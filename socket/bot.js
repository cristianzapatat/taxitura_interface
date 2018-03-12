/* eslint handle-callback-err: ["error", "error"] */
const fetch = require('node-fetch')

var _global = require('../util/global')
const _kts = require('../util/kts')
const _fns = require('../util/functions')
const _url = require('../util/url')
const _script = require('../db/script')

module.exports = (socket, Queue, Service, db) => {
  // Callback que elimina un socket de la lista cuando este se desconecta
  socket.on(_kts.socket.disconnect, () => {
    if (_global.bots[socket.id]) delete _global.bots[socket.id]
  })

  // Callback para notificar un cambio de socket de un bot
  socket.on('changeSocket', () => {
    _global.bots[socket.id] = socket
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
  socket.on(_kts.socket.cancelService, (user) => {
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
            _fns.getBot().emit(_kts.socket.notFoundService, {user})
          }
        } else _fns.getBot().emit(_kts.socket.notSentPetitionCancel)
      },
      err => _fns.getBot().emit(_kts.socket.notSentPetitionCancel))
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
                ord => _fns.getBot().emit(_kts.socket.quality, {user: ord.info.user, message: 'Gracias por calificar el servicio'}),
                err => _fns.getBot().emit(_kts.socket.errorFetch, data.user))
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
          _fns.getBot().emit(_kts.socket.quality, {
            user: data.user,
            message
          })
        }
      },
      err => _fns.getBot().emit(_kts.socket.errorFetch, data.user))
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
                _fns.getBot().emit(_kts.socket.returnPositionBot, {status: null, case: true, user: user})
              } else if (order.action === _kts.action.accept || order.action === _kts.action.arrive || order.action === _kts.action.aboard) {
                let position = order.position_cabman
                db.all(_script.select.position_last_cabman, [order.cabman.id], (err, rows) => {
                  if (err) _fns.getBot().emit(_kts.socket.errorFetch, user)
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
                    .catch(err => _fns.getBot().emit(_kts.socket.errorFetch, user))
                })
              }
            } else {
              _fns.getBot().emit(_kts.socket.returnPositionBot, {status: null, case: false, user: user})
            }
          } else {
            _fns.getBot().emit(_kts.socket.returnPositionBot, {status: null, case: false, user: user})
          }
        },
        err => _fns.getBot().emit(_kts.socket.errorFetch, user))
    }
  })

  // Callback para indicar al taxista que su usuario va en camino
  socket.on(_kts.socket.onMyWay, data => {
    Service.getId(data.service.id,
      json => {
        if (json) {
          let order = json.info
          if (order.action === _kts.action.arrive) {
            let sock = _fns.getClient(order.cabman.id, null)
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
                  err => _fns.getBot().emit(_kts.socket.errorFetch, data.user))
              }
            }
          }
        } else {
          _fns.getBot().emit(_kts.socket.notFoundService, data)
        }
      },
      err => _fns.getBot().emit(_kts.socket.errorFetch, data.user))
  })
}
