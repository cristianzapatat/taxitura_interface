/* eslint handle-callback-err: ["error", "error"] */
const fetch = require('node-fetch')

const _global = require('./util/global')
const _config = require('./config')
const _url = require('./util/url')
const _kts = require('./util/kts')
const _fns = require('./util/functions')

async function saveService (body, Service, Queue, newTry) {
  let order = JSON.parse(body)
  if (newTry) order = Service.create(order, _kts.json.facebook)
  Service.save(order,
    data => Queue.sendMessageService(JSON.stringify(data.info)),
    err => {
      _fns.getBot().emit(_kts.socket.notFoundCabman, order)
      order[_kts.json.err] = err
      if (newTry) Queue.saveServiceQueueError(JSON.stringify(order))
    })
}

async function addAddress (socketClient, body, Service, Queue) {
  let order = JSON.parse(body)
  fetch(_url.getGeocoding(order.position_user))
  .then(result => {
    return result.json()
  })
  .then(json => {
    order = Service.addAddress(order, json.results[0].formatted_address)
    Service.update(order,
      data => emitToSocket(socketClient, Service, data.info),
      err => catchSend(order, Queue, err))
  })
  .catch(err => {
    catchSend(order, Queue)
  })
}

async function emitToSocket (socketClient, Service, order) {
  if (_fns.inCity(order.position_user.addressFull)) {
    if (Object.keys(_global.clients).length > 0) {
      socketClient.emit(_kts.socket.receiveService, order)
    } else {
      order.action = _kts.action.withoutCab
      order = Service.addTime(order, _kts.json.cancel)
      Service.update(order,
        data => _fns.getBot().emit(_kts.socket.withoutCab, data.info),
        err => {}) // TODO
    }
  } else {
    order.action = _kts.action.outOfCity
    order = Service.addTime(order, _kts.json.cancel)
    Service.update(order,
      data => _fns.getBot().emit(_kts.socket.outOfCity, data.info),
      err => {}) // TODO
  }
}

async function catchSend (order, Queue, err) {
  if (err) order[_kts.json.err] = err
  if (order.try) {
    order.try += 1
  } else {
    order[_kts.json.try] = 1
  }
  if (order.try <= _config.numberTryQueue) {
    Queue.sendMessageServiceError(JSON.stringify(order))
  } else {
    _fns.getBot().emit(_kts.socket.notFoundCabman, order)
  }
}

module.exports = (Queue, Service, socketClient) => { // TODO definir el caso 'else'
  Queue.subscribe(_config.saveServiceQueue, (msg) => {
    msg.readString(_kts.conf.utf8, (err, body) => {
      if (!err) {
        saveService(body, Service, Queue, true)
      }
    })
  })
  Queue.subscribe(_config.saveServiceQueueError, (msg) => {
    msg.readString(_kts.conf.utf8, (err, body) => {
      if (!err) {
        saveService(body, Service, Queue, false)
      }
    })
  })
  Queue.subscribe(_config.sendMessageQueue, (msg) => {
    msg.readString(_kts.conf.utf8, (err, body) => {
      if (!err) {
        addAddress(socketClient, body, Service, Queue)
      }
    })
  })
  Queue.subscribe(_config.sendMessageQueueError, (msg) => {
    msg.readString(_kts.conf.utf8, (err, body) => {
      if (!err) {
        addAddress(socketClient, body, Service, Queue)
      }
    })
  })
}
