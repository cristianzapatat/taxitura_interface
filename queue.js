/* eslint handle-callback-err: ["error", "error"] */
const fetch = require('node-fetch')

const _global = require('./util/global')
const _config = require('./config')
const _url = require('./util/url')
const _kts = require('./util/kts')
const _fns = require('./util/functions')
const _script = require('./db/script')

/**
 * Función para almacenar el servicio en la base de datos
 * @param {*} body, Información del servicio
 * @param {class/Service} Service, Instancia de la clase Service
 * @param {class/Queue} Queue, Instancia de la clase Queue
 * @param {Boolean} newTry, Boolean que indica si se debe o no almacenar el servicio. 
 */
let saveService = async (body, Service, Queue, newTry) => {
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

/**
 * Función para añadir la dirección al servicio.
 * @param {*} socketClient, Canal de comunicación con el socket Cliente
 * @param {*} body, Información del servicio
 * @param {class/Service} Service, Instancia de la clase Service
 * @param {class/Queue} Queue, Instancia de la clase Queue.
 * @param {*} db, instancia de la base de datos local.
 */
let addAddress = async (socketClient, body, Service, Queue, db) => {
  let order = JSON.parse(body)
  fetch(_url.getGeocoding(order.position_user))
  .then(result => {
    return result.json()
  })
  .then(json => {
    order = Service.addAddress(order, json.results[0].formatted_address)
    Service.update(order,
      data => emitToSocket(socketClient, Service, data.info, db),
      err => catchSend(order, Queue, err))
  })
  .catch(err => {
    catchSend(order, Queue)
  })
}

/**
 * Función para propagar el mensaje de un nuevo servicio a los taxista.
 * @param {*} socketClient, Canal de comunicación con el socket Cliente
 * @param {class/Service} Service, Instancia de la clase Service
 * @param {*} order, Representa el servicio
 * @param {*} db, instancia de la base de datos local.
 */
let emitToSocket = async (socketClient, Service, order, db) => {
  if (_fns.inCity(order.position_user.addressFull) || _config.develop) {
    if (Object.keys(_global.clients).length > 0) {
      db.run(_script.delete.orderByUser, [order.user.id])
      for (index in _global.clients) {
        db.run(_script.insert.order, [order.user.id, index, order.service.id])
      }
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

/**
 * Función que se encarga de procesar un error y volver a encolar el servicio hasta un tope de veces (_config.numberTryQueue)
 * @param {*} order, Servicio que se volverá a encolar.
 * @param {class/Queue} Queue, Instancia de la clase Queue
 * @param {*} err, Información del Error
 */
let catchSend = async (order, Queue, err) => {
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

/**
 * Escuchadores que des-encolan los servicios que se ha solicitado.
 * @param {class/Queue} Queue, instancia de la clase Queue 
 * @param {class/Service} Service, instancia de la clase Service 
 * @param {*} socketClient, canal de comunicación con el socket cliente.
 * @param {*} db, instancia de la base de datos local.
 */
module.exports = (Queue, Service, socketClient, db) => { // TODO definir el caso 'else'
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
        addAddress(socketClient, body, Service, Queue, db)
      }
    })
  })
  Queue.subscribe(_config.sendMessageQueueError, (msg) => {
    msg.readString(_kts.conf.utf8, (err, body) => {
      if (!err) {
        addAddress(socketClient, body, Service, Queue, db)
      }
    })
  })
}
