/* eslint handle-callback-err: ["error", "error"] */
const fetch = require('node-fetch')

var _global = require('./util/global')
const _kts = require('./util/kts')
const _url = require('./util/url')
const _fns = require('./util/functions')
const _script = require('./db/script')

const UserClass = require('./class/User')
const User = new UserClass()

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
      socket.emit(_kts.socket.acceptService, order)
    } else {
      socket.emit(_kts.socket.orderCanceled, order)
    }
    _fns.deleteServiceForAccept(order.cabman.id, order.service.id, db)
  } else {
    socket.emit(_kts.socket.processService, order)
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
          socket.emit(_kts.socket.sessionEnd, id, null)
        }
      } else {
        socket.emit(_kts.socket.sessionEnd, id, null)
      }
    })
}

module.exports = (socket, io, Queue, Service, db) => {
  // Callback que elimina un socket de la lista cuando este se desconecta
  socket.on(_kts.socket.disconnect, () => {
    if (_global.clients[socket.id]) delete _global.clients[socket.id]
    if (_global.bots[socket.id]) delete _global.bots[socket.id]
  })

  // Proceso para obtener los bots del sistema
  socket.emit(_kts.socket.getBot, true)
  socket.on(_kts.socket.responseBot, data => {
    if (data === true) _global.bots[socket.id] = socket
  })

  // proceso para recuperar los socket de los clientes
  socket.emit(_kts.socket.getClient, true)
  socket.on(_kts.socket.responseClient, (id, token) => {
    if (id && token) {
      validateToken(id, token, socket, () => {
        socket.id = id
        _global.clients[id] = socket
      })
    }
  })

  socket.on(_kts.socket.sessionStart, (id, token) => {
    if (id && token) io.emit(_kts.socket.sessionEnd, id, token)
  })

  // Callback que encola los nuevos servicios que llegan por socket.
  socket.on(_kts.socket.createService, async (order) => {
    Service.getLastServiceUser(order.user.id,
      json => {
        if (json) {
          if (json.length === 0) {
            order.date[_kts.json.queue] = new Date()
            Queue.saveServiceQueue(JSON.stringify(order))
            _fns.getBot().emit(_kts.socket.orderProcessing, order)
          } else {
            _fns.getBot().emit(_kts.socket.orderInProcess, json[0].info)
          }
        } else {
          _fns.getBot().emit(_kts.socket.notSentPetition, order)
        }
      },
      err => _fns.getBot().emit(_kts.socket.notSentPetition, order))
  })

  // Callback que permite al usuario cancelar un servicio
  socket.on(_kts.socket.cancelService, async(user) => {
    Service.getLastServiceUser(user.id,
      json => {
        if (json) {
          if (json.length > 0) {
            let order = json[0].info
            if (order.action === _kts.action.order) {
              order.action = _kts.action.cancel
              order = Service.addTime(order, _kts.json.cancel)
              Service.update(order,
                data => {
                  _fns.getBot().emit(_kts.socket.cancelSuccess, user)
                  db.run(_script.delete.service, [data.info.service.id])
                },
                err => _fns.getBot().emit(_kts.socket.notSentPetitionCancel))
            } else {
              _fns.getBot().emit(_kts.socket.cancelDenied, user)
            }
          } else {
            socket.emit(_kts.socket.notFoundService, {user})
          }
        } else _fns.getBot().emit(_kts.socket.notSentPetitionCancel)
      },
      err => _fns.getBot().emit(_kts.socket.notSentPetitionCancel))
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
              socket.emit(_kts.socket.acceptService, null)
            }
          } else {
            socket.emit(_kts.socket.acceptService, null)
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
              socket.emit(_kts.socket.acceptService, null)
            }
          } else {
            socket.emit(_kts.socket.acceptService, null)
          }
        },
        err => console.log('Error acceptCancel', err)) // TODO validar el error de consulta del servicio
    })
  })

  // Callback para almacenar la posición del taxista
  socket.on(_kts.socket.savePositionCab, data => {
    _fns.savePositionCab(data, db)
  })

  // Callback para validar si un taxista tiene un servicio en curso
  socket.on(_kts.socket.serviceInMemory, (idDriver, token) => {
    validateToken(idDriver, token, socket, () => {
      socket.id = idDriver
      _global.clients[idDriver] = socket
      Service.getLastServiceDriver(idDriver,
        json => {
          if (json) {
            if (json.length > 0) {
              let order = json[0].info
              socket.emit(_kts.socket.isServiceInMemory, order)
            } else {
              socket.emit(_kts.socket.isServiceInMemory, null)
            }
          } else {
            socket.emit(_kts.socket.isServiceInMemory, null)
          }
        },
        err => console.log('serviceInMemory serviceInMemory', err)) // TODO definir que hacer
    })
  })

  // Callback para añadir un servio a la lista de servicios cancelados de un taxista
  socket.on(_kts.socket.addServiceCanceled, (order, token) => {
    validateToken(order.cabman.id, token, socket, () => {
      db.run(_script.insert.service, [order.cabman.id.toString(), order.service.id.toString()])
    })
  })

  // callback usado para añadir una calificación a un servicio
  socket.on(_kts.socket.quality, data => {
    Service.getId(data.service.id,
      json => {
        let message = ''
        if (json) {
          let order = json.info
          if (order.user.id === data.user.id) {
            if (!order.quality) {
              order[_kts.json.quality] = data.quality
              Service.update(order,
                ord => socket.emit(_kts.socket.quality, {user: ord.info.user, message: 'Gracias por calificar el servicio'}),
                err => socket.emit(_kts.socket.errorFetch, data.user))
            } else {
              message = 'El servicio ya recibio una calificación previa'
            }
          } else {
            message = 'El servicio que está calificando pertenece a otro usuario'
          }
        } else {
          message = 'El servicio no está disponible para calificar'
        }
        if (message.length > 0) {
          socket.emit(_kts.socket.quality, {
            user: data.user,
            message
          })
        }
      },
      err => socket.emit(_kts.socket.errorFetch, data.user))
  })

  // Callback para obtener la posición del taxista por parte un usurio
  socket.on(_kts.socket.getPositionBot, user => {
    if (user) {
      Service.getLastServiceUser(user.id,
        json => {
          if (json) {
            if (json.length > 0) {
              let order = json[0].info
              if (order.action === _kts.action.order) {
                socket.emit(_kts.socket.returnPositionBot, {status: null, case: true, user: user})
              } else if (order.action === _kts.action.accept || order.action === _kts.action.arrive || order.action === _kts.action.aboard) {
                let position = order.position_cabman
                db.all(_script.select.position_last_cabman, [order.cabman.id], (err, rows) => {
                  if (err) socket.emit(_kts.socket.errorFetch, user)
                  else if (rows && rows.length > 0) {
                    position = {latitude: rows[0].latitude, longitude: rows[0].longitude}
                  }
                  fetch(_url.getDistanceMatrix(position, order.position_user))
                    .then(res => {
                      return res.json()
                    })
                    .then(json => {
                      _fns.getBot().emit(_kts.socket.returnPositionBot, {
                        status: true,
                        service: order.service,
                        position_cabman: {
                          distance: json.rows[0].elements[0].distance.value,
                          time: json.rows[0].elements[0].duration.value,
                          latitude: position.latitude,
                          longitude: position.longitude
                        },
                        user: order.user
                      })
                    })
                    .catch(err => socket.emit(_kts.socket.errorFetch, user))
                })
              }
            } else {
              socket.emit(_kts.socket.returnPositionBot, {status: null, case: false, user: user})
            }
          } else {
            socket.emit(_kts.socket.returnPositionBot, {status: null, case: false, user: user})
          }
        },
        err => socket.emit(_kts.socket.errorFetch, user))
    }
  })

  // Callback para indicar al taxista que su usuario va en camino
  socket.on(_kts.socket.onMyWay, data => {
    Service.getId(data.service.id,
      json => {
        if (json) {
          let order = json.info
          if (order.action === _kts.action.arrive) {
            let sock = _global.clients[order.cabman.id]
            let update = false
            if (sock) {
              if (!order.onMyWay) {
                order[_kts.json.onMyWay] = []
                order.onMyWay.push(new Date().getTime())
                update = true
              } else {
                let time = new Date()
                if ((time.getTime() - order.onMyWay[order.onMyWay.length - 1]) > _kts.time.onMyWay) {
                  order.onMyWay.push(time.getTime())
                  update = true
                }
              }
              if (update) {
                Service.update(order,
                  ord => sock.emit(_kts.socket.onMyWay, data),
                  err => socket.emit(_kts.socket.errorFetch, data.user))
              }
            }
          }
        } else {
          socket.emit(_kts.socket.notFoundService, data)
        }
      },
      err => socket.emit(_kts.socket.errorFetch, data.user))
  })
}
