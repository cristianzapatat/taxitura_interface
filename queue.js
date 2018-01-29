/* eslint handle-callback-err: ["error", "error"] */
const fetch = require('node-fetch')

const _config = require('./config')
const _url = require('./util/url')
const _kts = require('./util/kts')
const _fns = require('./util/functions')

function saveService (body, Service, Queue, newTry) {
  let order = JSON.parse(body)
  if (newTry) order = Service.create(order, _kts.json.facebook)
  fetch(_url.urlServices, _fns.getInit(order, _kts.method.post))
    .then(response => {
      if (response.status >= 200 && response.status <= 299) {
        return response.json()
      } else {
        throw response.status
      }
    })
    .then(data => {
      Queue.sendMessageService(JSON.stringify(order))
    })
    .catch(err => {
      _fns.getBot().emit(_kts.socket.notFoundCabman, order)
      order[_kts.json.err] = err
      if (newTry) Queue.saveServiceQueueError(JSON.stringify(order))
    })
}

function addAddress (io, body, Service, Queue) {
  let order = JSON.parse(body)
  fetch(_url.getGeocoding(order.position_user))
  .then(result => {
    return result.json()
  })
  .then(json => {
    order = Service.addAddress(order, json.results[0].formatted_address)
    fetch(`${_url.urlServices}/${order.service.id}`, _fns.getInit(order, _kts.method.put))
      .then(response => {
        if (response.status >= 200 && response.status <= 299) {
          return response.json()
        } else {
          throw response.status
        }
      })
      .then(json => {
        io.emit(_kts.socket.receiveService, json.info)
      })
      .catch(err => {
        catchSend(order, Queue, err)
      })
  })
  .catch(err => {
    catchSend(order, Queue)
  })
}

function catchSend (order, Queue, err) {
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

module.exports = (Queue, Service, io) => {
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
        addAddress(io, body, Service, Queue)
      }
    })
  })
  Queue.subscribe(_config.sendMessageQueueError, (msg) => {
    msg.readString(_kts.conf.utf8, (err, body) => {
      if (!err) {
        addAddress(io, body, Service, Queue)
      }
    })
  })
}
