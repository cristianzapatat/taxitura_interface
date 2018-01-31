/* eslint handle-callback-err: ["error", "error"] */
const fetch = require('node-fetch')

var _global = require('./util/global')
const _kts = require('./util/kts')
const _url = require('./util/url')
const _fns = require('./util/functions')

function processResponseService (order, Service, socket, nameDate) {
  order = Service.addTime(order, nameDate)
  updateService(order, ord => {
    actionResponseService(ord, socket)
  }, (order, err) => { // TODO determinar que hacer en caso de error
  })
}

function actionResponseService (order, socket) {
  _fns.getBot().emit(_kts.socket.responseOrder, order)
  if (socket) {
    socket.emit(_kts.socket.acceptService, order)
    _fns.deleteServiceForAccept(order.service.id)
  }
  _fns.savePositionCab(order.cabman.id, {
    id: order.cabman.id,
    service: order.service.id,
    action: order.action,
    position: {
      latitude: order.position_cabman.latitude,
      longitude: order.position_cabman.longitude
    }
  })
}

function updateService (order, resolve, fail) {
  fetch(`${_url.urlServices}/${order.service.id}`, _fns.getInit(order, _kts.method.put))
    .then(response => {
      if (response.status >= 200 && response.status <= 299) {
        return response.json()
      } else {
        throw response.status
      }
    })
    .then(json => {
      resolve(json.info)
    })
    .catch(err => {
      fail(order, err)
    })
}

module.exports = (socket, io, Queue, Service) => {
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

  // Callback que encola los nuevos servicios que llegan por socket.
  socket.on(_kts.socket.createService, async (order) => {
    fetch(_url.lastServiceUser(order.user.id))
      .then(response => {
        if (response.status >= 200 && response.status <= 299) {
          return response.json()
        } else {
          throw response.status
        }
      })
      .then(json => {
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
      })
      .catch(err => {
        _fns.getBot().emit(_kts.socket.notSentPetition, order)
      })
  })

  // Callback que procesa el servicio (acepta, modifica, finaliza)
  socket.on(_kts.socket.responseService, order => {
    fetch(`${_url.urlServices}/${order.service.id}`)
      .then(response => {
        if (response.status >= 200 && response.status <= 299) {
          return response.json()
        } else {
          throw response.status
        }
      })
      .then(json => {
        let orderAux = json.info
        if (orderAux) {
          order.date = orderAux.date
          if (orderAux.onMyWay) order[_kts.json.onMyWay] = orderAux.onMyWay
          if (order.action === _kts.action.accept && orderAux.action === _kts.action.order) { // Aceptar el servio
            order = Service.addChanel(order, socket.id)
            processResponseService(order, Service, socket, _kts.json.accept)
          } else if (order.action === _kts.action.arrive && orderAux.action === _kts.action.accept) { // el taxita llega donde el usuario
            processResponseService(order, Service, null, _kts.json.arrive)
          } else if (order.action === _kts.action.aboard && orderAux.action === _kts.action.arrive) { // El pasajero abordo el taxi según información del taxista
            processResponseService(order, Service, null, _kts.json.aboard)
          } else if (order.action === _kts.action.end && orderAux.action === _kts.action.aboard) { // fin del servio
            processResponseService(order, Service, null, _kts.json.end)
          } else {
            socket.emit(_kts.socket.acceptService, null)
          }
        } else {
          socket.emit(_kts.socket.acceptService, null)
        }
      })
      .catch(err => {
        // TODO validar el error de consulta del servicio
        console.log('Error responseService', err)
      })
  })

  // Callback para aceptar un servicio que fue previamente cancelado por el taxista
  socket.on(_kts.socket.acceptCancel, order => {
    fetch(`${_url.urlServices}/${order.service.id}`)
      .then(response => {
        if (response.status >= 200 && response.status <= 299) {
          return response.json()
        } else {
          throw response.status
        }
      })
      .then(json => {
        let orderAux = json.info
        if (orderAux) {
          if (order.action === _kts.action.accept && orderAux.action === _kts.action.order) {
            fetch(_url.getDistanceMatrix(order.position_cabman, order.position_user))
              .then(response => {
                return response.json()
              })
              .then(json => {
                order = Service.addChanel(order, socket.id)
                order = Service.addTimeAndDistance(order, json.rows[0].elements[0].distance.value, json.rows[0].elements[0].duration.value)
                processResponseService(order, Service, socket, _kts.json.accept)
              })
              .catch(err => {
                // TODO validar el error de consulta del servicio
                console.log('Error 2 acceptCancel', err)
              })
          } else {
            socket.emit(_kts.socket.acceptService, null)
          }
        } else {
          socket.emit(_kts.socket.acceptService, null)
        }
      })
      .catch(err => {
        // TODO validar el error de consulta del servicio
        console.log('Error acceptCancel', err)
      })
  })

  // Callback para almacenar la posición del taxista
  socket.on(_kts.socket.savePositionCab, data => {
    _fns.savePositionCab(data.id, data.data)
  })

  // Callback para validar si un taxista tiene un servicio en curso
  socket.on(_kts.socket.serviceInMemory, idDriver => {
    fetch(_url.lastServiceUser(idDriver))
      .then(response => {
        if (response.status >= 200 && response.status <= 299) {
          return response.json()
        } else {
          throw response.status
        }
      })
      .then(json => {
        if (json) {
          if (json.length > 0) {
            let order = json[0].length
            order = Service.addChanel(order, socket.id)
            updateService(order, ord => {
              socket.emit(_kts.socket.isServiceInMemory, ord)
            }, (order, err) => { // TODO determinar que hacer en caso de error
            })
          } else {
            socket.emit(_kts.socket.isServiceInMemory, null)
          }
        } else {
          socket.emit(_kts.socket.isServiceInMemory, null)
        }
      })
      .catch(err => { // TODO definir que hacer
      })
  })

  // Callback para añadir un servio a la lista de servicios cancelados de un taxista
  socket.on(_kts.socket.addServiceCanceled, order => {
    if (!_global.canceledOrders[order.cabman.id]) {
      _global.canceledOrders[order.cabman.id] = []
    }
    _global.canceledOrders[order.cabman.id].push(order.service.id)
  })

  // callback usado para añadir una calificación a un servicio
  socket.on(_kts.socket.quality, data => {
    fetch(`${_url.urlServices}/${data.service.id}`)
      .then(response => {
        if (response.status >= 200 && response.status <= 299) {
          return response.json()
        } else {
          throw response.status
        }
      })
      .then(json => {
        let message = ''
        if (json) {
          let order = json.info
          if (order.user.id === data.user.id) {
            if (!order.quality) {
              order[_kts.json.quality] = data.quality
              updateService(order, ord => {
                socket.emit(_kts.socket.quality, {
                  user: ord.user,
                  message: 'Gracias por calificar el servicio'
                })
              }, (order, err) => {
                socket.emit(_kts.socket.errorFetch, data.user)
              })
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
      })
      .catch(err => {
        socket.emit(_kts.socket.errorFetch, data.user)
      })
  })

  // Callback para obtener la posición del taxista por parte un usurio
  socket.on(_kts.socket.getPositionBot, user => {
    if (user) {
      fetch(_url.lastServiceUser(user.id))
        .then(response => {
          if (response.status >= 200 && response.status <= 299) {
            return response.json()
          } else {
            throw response.status
          }
        })
        .then(json => {
          if (json) {
            if (json.length > 0) {
              let order = json[0].info
              if (order.action === _kts.action.order) {
                socket.emit(_kts.socket.returnPositionBot, {status: null, case: true, user: user})
              } else if (order.action === _kts.action.accept || _kts.action.arrive || _kts.action.aboard) {
                let positions = _global.positionsCab[order.cabman.id]
                if (positions) {
                  if (positions.length >= 0) {
                    let position = positions[positions.length - 1]
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
                      .catch(err => {
                        socket.emit(_kts.socket.errorFetch, user)
                      })
                  } else {
                    socket.emit(_kts.socket.returnPositionBot, {status: false, user: user})
                  }
                } else {
                  socket.emit(_kts.socket.returnPositionBot, {status: false, user: user})
                }
              }
            } else {
              socket.emit(_kts.socket.returnPositionBot, {status: null, case: false, user: user})
            }
          } else {
            socket.emit(_kts.socket.returnPositionBot, {status: null, case: false, user: user})
          }
        })
        .catch(err => {
          socket.emit(_kts.socket.errorFetch, user)
        })
    }
  })

  // Callback para indicar al taxista que su usuario va en camino
  socket.on(_kts.socket.onMyWay, data => {
    fetch(`${_url.urlServices}/${data.service.id}`)
      .then(response => {
        if (response.status >= 200 && response.status <= 299) {
          return response.json()
        } else {
          throw response.status
        }
      })
      .then(json => {
        if (json) {
          let order = json.info
          if (order.channel) {
            if (order.action === _kts.action.arrive) {
              let sock = _global.clients[order.channel]
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
                  updateService(order, ord => {
                    sock.emit(_kts.socket.onMyWay, data)
                  }, (order, err) => {
                    socket.emit(_kts.socket.errorFetch, data.user)
                  })
                }
              }
            }
          }
        } else {
          socket.emit(_kts.socket.notFoundService, data)
        }
      })
      .catch(err => {
        socket.emit(_kts.socket.errorFetch, data.user)
      })
  })
}
