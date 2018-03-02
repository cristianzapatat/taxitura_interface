/* eslint handle-callback-err: ["error", "error"] */
const fetch = require('node-fetch')

var _global = require('../util/global')
const _kts = require('../util/kts')
const _url = require('../util/url')
const _fns = require('../util/functions')
const _script = require('../db/script')

const UserClass = require('../class/User')
const User = new UserClass()

var ids = {}

function processResponseService (order, Service, socket, nameDate, accept, cancel, db) {
  order = Service.addTime(order, nameDate)
  Service.update(order,
    ord => actionResponseService(ord.info, socket, accept, cancel, db),
    err => {}) // TODO determinar que hacer en caso de error
}

function actionResponseService (order, socket, accept, cancel, db) {
  _fns.getBot().emit(_kts.socket.responseOrder, order)
  if (accept) {
    if (!cancel) {
      _fns.getClient(order.cabman.id, socket).emit(_kts.socket.acceptService, order)
    } else {
      _fns.getClient(order.cabman.id, socket).emit(_kts.socket.orderCanceled, order)
    }
    _fns.deleteServiceForAccept(order.cabman.id, order.service.id, db)
  } else {
    _fns.getClient(order.cabman.id, socket).emit(_kts.socket.processService, order)
  }
  _fns.savePositionCab({
    id: order.cabman.id,
    service: order.service.id,
    action: order.action,
    position: {
      latitude: order.position_cabman.latitude,
      longitude: order.position_cabman.longitude
    }
  }, db)
}

function validateToken (id, token, socket, callback) {
  User.meService(token,
    json => {
      if (json) {
        if (id === json.id && token === json.token) {
          callback()
        } else {
          _fns.getClient(id, socket).emit(_kts.socket.sessionEnd, id, null)
        }
      } else {
        _fns.getClient(id, socket).emit(_kts.socket.sessionEnd, id, null)
      }
    })
}

module.exports = (socket, socketClient, Service, db) => {
  // Callback que elimina un socket de la lista cuando este se desconecta
  socket.on(_kts.socket.disconnect, () => {
    let id
    if (ids[socket.id]) id = ids[socket.id]
    if (_global.clients[id]) {
      delete _global.clients[id]
      delete ids[socket.id]
    }
  })

  // Callback para notificar un cambio de socket de un cliente
  socket.on('changeSocket', id => {
    ids[socket.id] = id
    _global.clients[id] = socket
  })

  // Callback que indica a la interfaz el inicio de sessión de un taxista.
  socket.on(_kts.socket.sessionStart, (id, token) => {
    if (id && token) {
      ids[socket.id] = id
      _global.clients[id] = socket
      socketClient.emit(_kts.socket.sessionEnd, id, token)
      validateToken(id, token, socket, () => {
        Service.getLastServiceDriver(id,
          json => {
            if (json) {
              if (json.length > 0) {
                let order = json[0].info
                _fns.getClient(id, socket).emit(_kts.socket.isServiceInMemory, order)
              } else {
                _fns.getClient(id, socket).emit(_kts.socket.isServiceInMemory, null)
              }
            } else {
              _fns.getClient(id, socket).emit(_kts.socket.isServiceInMemory, null)
            }
          },
          err => console.log('serviceInMemory serviceInMemory', err)) // TODO definir que hacer
      })
    }
  })

  // Callback que procesa el servicio (acepta, modifica, finaliza)
  socket.on(_kts.socket.responseService, (order, token) => {
    validateToken(order.cabman.id, token, socket, () => {
      Service.getId(order.service.id,
        json => {
          let orderAux = json.info
          if (orderAux) {
            order.date = orderAux.date
            if (orderAux.onMyWay) order[_kts.json.onMyWay] = orderAux.onMyWay
            if (order.action === _kts.action.accept && orderAux.action === _kts.action.order) { // Aceptar el servio
              processResponseService(order, Service, socket, _kts.json.accept, true, false, db)
            } else if (order.action === _kts.action.arrive && orderAux.action === _kts.action.accept) { // el taxita llega donde el usuario
              processResponseService(order, Service, socket, _kts.json.arrive, false, false, db)
            } else if (order.action === _kts.action.aboard && orderAux.action === _kts.action.arrive) { // El pasajero abordo el taxi según información del taxista
              processResponseService(order, Service, socket, _kts.json.aboard, false, false, db)
            } else if (order.action === _kts.action.end && orderAux.action === _kts.action.aboard) { // fin del servio
              processResponseService(order, Service, socket, _kts.json.end, false, false, db)
            } else {
              _fns.getClient(order.cabman.id, socket).emit(_kts.socket.acceptService, null)
            }
          } else {
            _fns.getClient(order.cabman.id, socket).emit(_kts.socket.acceptService, null)
          }
        },
        err => console.log('Error responseService', err)) // TODO validar el error de consulta del servicio
    })
  })

  // Callback para aceptar un servicio que fue previamente cancelado por el taxista
  socket.on(_kts.socket.acceptCancel, (order, token) => {
    validateToken(order.cabman.id, token, socket, () => {
      Service.getId(order.service.id,
        json => {
          let orderAux = json.info
          if (orderAux) {
            if (order.action === _kts.action.accept && orderAux.action === _kts.action.order) {
              fetch(_url.getDistanceMatrix(order.position_cabman, order.position_user))
                .then(response => {
                  return response.json()
                })
                .then(json => {
                  order = Service.addTimeAndDistance(order, json.rows[0].elements[0].distance.value, json.rows[0].elements[0].duration.value)
                  processResponseService(order, Service, socket, _kts.json.accept, true, true, db)
                })
                .catch(err => console.log('Error 2 acceptCancel', err)) // TODO validar el error de consulta del servicio
            } else {
              _fns.getClient(order.cabman.id, socket).emit(_kts.socket.acceptService, null)
            }
          } else {
            _fns.getClient(order.cabman.id, socket).emit(_kts.socket.acceptService, null)
          }
        },
        err => console.log('Error acceptCancel', err)) // TODO validar el error de consulta del servicio
    })
  })

  // Callback para almacenar la posición del taxista
  socket.on(_kts.socket.savePositionCab, data => {
    _fns.savePositionCab(data, db)
  })

  // Callback para añadir un servio a la lista de servicios cancelados de un taxista
  socket.on(_kts.socket.addServiceCanceled, (order, token) => {
    validateToken(order.cabman.id, token, socket, () => {
      db.run(_script.insert.service, [order.cabman.id.toString(), order.service.id.toString()])
    })
  })
}
