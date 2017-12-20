const fetch = require('node-fetch')

var _global = require('./util/global')
const _kts = require('./util/kts')
const _url = require('./util/url')
const _fns = require('./util/functions')

const ServiceClass = require('./class/service')
const Service = new ServiceClass()

module.exports = (socket, io) => {
  _global.clients[socket.id] = socket

  // Callback que elimina un socket de la lista cuando este se desconecta
  socket.on(_kts.socket.disconnect, () => {
    if (_global.clients[socket.id]) {
      delete _global.clients[socket.id]
    }
    if (_global.bots[socket.id]) {
      delete _global.bots[socket.id]
    }
  })

  // Proceso para obtener los bots del sistema
  socket.emit(_kts.socket.getBot, true)
  socket.on(_kts.socket.responseBot, data => {
    if (data === true) {
      delete _global.clients[socket.id]
      _global.bots[socket.id] = socket
    }
  })

  // Callback para crear y distribuir un servicio
  socket.on(_kts.socket.createService, order => {
    fetch(_url.getGeocoding(order.position_user))
      .then(result => {
        return result.json()
      })
      .then(json => {
        order = Service.create(order, json.results[0].formatted_address, _kts.json.facebook)
        _global.orders[order.service.id] = order
        io.emit(_kts.socket.receiveService, order)
      })
      .catch(err => {
        console.log(err)
      })
  })

  // Callback que procesa el servicio (acepta, modifica, finaliza)
  socket.on(_kts.socket.responseService, order => {
    // Aceptar el servio
    if (order.action === _kts.action.accept) {
      if (_global.orders[order.service.id]) {
        if (_global.orders[order.service.id].action === _kts.action.order) {
          order = Service.addChanel(order, socket.id)
          _global.orders[order.service.id] = order
          _global.ordersInForce[order.user.id] = order
          _global.ordersForCabman[order.cabman.id] = order.user.id
          _fns.getBot().emit(_kts.socket.responseOrder, order)
          socket.emit(_kts.socket.acceptService, order)
          _fns.savePositionCab(order.cabman.id, order.position_cabman)
          _fns.deleteServiceForAccept(order.service.id)
        } else { socket.emit(_kts.socket.acceptService, null) }
      } else { socket.emit(_kts.socket.acceptService, null) }
    // el taxita llega donde el usuario
    } else if (order.action === _kts.action.arrive) {
      if (_global.orders[order.service.id].action === _kts.action.accept) {
        _global.orders[order.service.id] = order
        _global.ordersInForce[order.user.id] = order
        _fns.getBot().emit(_kts.socket.responseOrder, order)
        _fns.savePositionCab(order.cabman.id, order.position_cabman)
      }
    // El pasajero abordo el taxi según información del taxista
    } else if (order.action === _kts.action.aboard) {
      if (_global.orders[order.service.id].action === _kts.action.arrive) {
        _global.orders[order.service.id] = order
        _global.ordersInForce[order.user.id] = order
        _fns.getBot().emit(_kts.socket.responseOrder, order)
        _fns.savePositionCab(order.cabman.id, order.position_cabman)
      }
    // fin del servio
    } else if (order.action === _kts.action.end) {
      if (_global.orders[order.service.id].action === _kts.action.aboard) {
        _global.finishedOrders[order.service.id] = order
        delete _global.orders[order.service.id]
        delete _global.ordersInForce[order.user.id]
        _fns.getBot().emit(_kts.socket.responseOrder, order)
        _fns.savePositionCab(order.cabman.id, order.position_cabman)
      }
    }
  })

  // Callback para aceptar un servicio que fue previamente cancelado por el taxista
  socket.on(_kts.socket.acceptCancel, order => {
    if (order.action === _kts.action.accept) {
      if (_global.orders[order.service.id].action === _kts.action.order) {
        order = Service.addChanel(order, socket.id)
        _global.orders[order.service.id] = order
        _global.ordersInForce[order.user.id] = order
        fetch(_url.getDistanceMatrix(order.position_cabman, order.position_user))
          .then(response => {
            return response.json()
          })
          .then(json => {
            order = Service.addTimeAndDistance(order, json.rows[0].elements[0].distance.value, json.rows[0].elements[0].duration.value)
            _global.orders[order.service.id] = order
            _global.ordersInForce[order.user.id] = order
            _global.ordersForCabman[order.cabman.id] = order.user.id
            _fns.getBot().emit(_kts.socket.responseOrder, order)
            socket.emit(_kts.socket.orderCanceled, order)
          })
        _fns.savePositionCab(order.cabman.id, order.position_cabman)
        _fns.deleteServiceForAccept(order.service.id)
      } else { socket.emit(_kts.socket.acceptService, null) }
    } else { socket.emit(_kts.socket.acceptService, null) }
  })

  // Callback para almacenar la posición del taxista
  socket.on(_kts.socket.savePositionCab, data => {
    _fns.savePositionCab(data.cabman.id, data.position_cabman)
  })

  // Callback para validar si un taxista tiene un servicio en curso
  socket.on(_kts.socket.serviceInMemory, id => {
    let idUser = _global.ordersForCabman[id]
    let order = null
    if (idUser) {
      order = _global.ordersInForce[idUser]
      if (!order) {
        order = null
      } else {
        order = Service.addChanel(order, socket.id)
        _global.orders[order.service.id] = order
        _global.ordersInForce[order.user.id] = order
      }
    }
    socket.emit(_kts.socket.isServiceInMemory, order)
  })

  // Callback para añadir un servio a la lista de pendientes de un taxista
  socket.on(_kts.socket.addServiceList, order => {
    if (!_global.pendingOrders[order.cabman.id]) {
      _global.pendingOrders[order.cabman.id] = {}
    }
    _global.pendingOrders[order.cabman.id][order.service.id] = order
  })

  // Callback para añadir un servio a lista de un servicio cancelado
  socket.on(_kts.socket.addServiceCanceled, order => {
    if (!_global.canceledOrders[order.cabman.id]) {
      _global.canceledOrders[order.cabman.id] = {}
    }
    _global.canceledOrders[order.cabman.id][order.service.id] = order
  })

  // callback para obtener el siguiente servio en la lista del taxista
  socket.on(_kts.socket.nextService, idCabman => {
    if (_global.pendingOrders[idCabman]) {
      let service = null
      for (let index in _global.pendingOrders[idCabman]) {
        service = _global.pendingOrders[idCabman][index]
        delete _global.pendingOrders[idCabman][index]
        break
      }
      if (service) {
        socket.emit(_kts.socket.receiveService, service)
      }
    }
  })

  // callback usado para añadir una calificación a un servicio
  socket.on(_kts.socket.quality, quality => {
    let order = _global.finishedOrders[quality.service.id]
    let message = ''
    if (order) {
      if (order.user.id === quality.user.id) {
        if (!order.quality) {
          _global.finishedOrders[quality.service.id][_kts.json.quality] = quality
          message = 'Gracias por calificar el servicio'
        } else {
          message = 'El servicio ya recibio una calificación previa'
        }
      } else {
        message = 'El servicio que está calificando pertenece a otro usuario'
      }
    } else {
      message = 'El servicio no está disponible para calificar'
    }
    let response = {
      user: { id: quality.user.id },
      message
    }
    socket.emit(_kts.socket.quality, response)
  })

  // Callback para obtener la posición del taxista por parte un usurio
  socket.on(_kts.socket.getPositionBot, user => {
    if (user) {
      let service = _global.ordersInForce[user.id]
      if (service) {
        let positions = _global.positionsCab[service.cabman.id]
        if (positions) {
          if (positions.length >= 0) {
            let position = positions[positions.length - 1]
            fetch(_url.getDistanceMatrix(position, service.position_user))
              .then(res => {
                return res.json()
              })
              .then(json => {
                _fns.getBot().emit(_kts.socket.returnPositionBot, {
                  status: true,
                  service: service.service,
                  position_cabman: {
                    distance: json.rows[0].elements[0].distance.value,
                    time: json.rows[0].elements[0].duration.value,
                    latitude: position.latitude,
                    longitude: position.longitude
                  },
                  user: service.user
                })
              })
          } else {
            socket.emit(_kts.socket.returnPositionBot, {status: false, user: user})
          }
        } else {
          socket.emit(_kts.socket.returnPositionBot, {status: false, user: user})
        }
      } else {
        let state = Service.searchServiceForUserOnOrders(user.id) !== null
        socket.emit(_kts.socket.returnPositionBot, {status: null, case: state, user: user})
      }
    }
  })

  // Callback para indicar al taxista que su usuario va en camino
  socket.on(_kts.socket.onMyWay, data => {
    let order = _global.ordersInForce[data.user.id]
    if (!order) {
      socket.emit(_kts.socket.notFoundService, data)
    } else {
      if (order.channel) {
        let sock = _global.clients[order.channel]
        if (sock) {
          sock.emit(_kts.socket.onMyWay, data)
        }
      }
    }
  })
}
