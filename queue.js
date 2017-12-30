/* eslint handle-callback-err: ["error", "error"] */
const fetch = require('node-fetch')

const _config = require('./config')
var _global = require('./util/global')
const _url = require('./util/url')
const _kts = require('./util/kts')

function createService (io, body, Service, Queue) {
  let order = JSON.parse(body)
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
    if (order.try) {
      order.try += 1
    } else {
      order[_kts.json.try] = 1
    }
    if (order.try <= _config.numberTryQueue) {
      Queue.sendMessageServiceError(JSON.stringify(order))
    } else {
      // TODO notificar al usuario que no hay taxista disponible
    }
  })
}

module.exports = (Queue, Service, io) => {
  Queue.subscribe(_config.sendMessageQueue, (msg) => {
    msg.readString('UTF-8', (err, body) => {
      if (!err) {
        createService(io, body, Service, Queue)
      } else {
        // TODO notificar al usuario
      }
    })
  })
  Queue.subscribe(_config.sendMessageQueueError, (msg) => {
    msg.readString('UTF-8', (err, body) => {
      if (!err) {
        createService(io, body, Service, Queue)
      } else {
        // TODO notificar al usuario
      }
    })
  })
}
