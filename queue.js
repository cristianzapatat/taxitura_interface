/* eslint handle-callback-err: ["error", "error"] */
const fetch = require('node-fetch')

const _global = require('./util/global')
const _config = require('./config')
const _url = require('./util/url')
const _kts = require('./util/kts')
const _fns = require('./util/functions')

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
 * @param {*} schedule, instancia del programador de tareas.
 */
let addAddress = async (socketClient, body, Service, Queue, db, schedule) => {
  let order = JSON.parse(body)
  fetch(_url.getGeocoding(order.position_user))
  .then(result => {
    return result.json()
  })
  .then(json => {
    order = Service.addAddress(order, json.results[0].formatted_address)
    Service.update(order,
      data => emitToSocket(socketClient, Service, data.info, db, schedule),
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
 * @param {*} schedule, instancia del programador de tareas.
 */
let emitToSocket = async (socketClient, Service, order, db, schedule) => {
  if (_fns.inCity(order.position_user.addressFull)) {
    if (Object.keys(_global.clients).length > 0) {
      let date = new Date()
      date = new Date(date.getTime() + _kts.time.executionScheduleService)
      let _id = order.user.id
      console.log('creando la tarea')
      _global.schedules[_id] = schedule.scheduleJob(date, function (_id, fireDate) {
        //todo eliminar la tarea del arreglog
        let ServiceClass = require('./class/Service')
        let _Service = new ServiceClass()
        _Service.getLastServiceUser(_id, json => {
          if (json && json.length > 0) {
            let order = json[0].info
            order.action = _kts.action.cancelTime
            order = _Service.addTime(order, _kts.json.cancelTime  , fireDate)
            _Service.update(order,
              data => {
                //_fns.getBot().emit(_kts.socket.cancelTime, data.infor.user)
                console.log('se elimina el servicio', order)
                db.run(_script.delete.service, [data.info.service.id])
              })
          }
        })
      }.bind(null, _id))
      console.log(_global.schedules)
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
 * @param {*} schedule, instancia del programador de tareas.
 */
module.exports = (Queue, Service, socketClient, db, schedule) => { // TODO definir el caso 'else'
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
        addAddress(socketClient, body, Service, Queue, db, schedule)
      }
    })
  })
  Queue.subscribe(_config.sendMessageQueueError, (msg) => {
    msg.readString(_kts.conf.utf8, (err, body) => {
      if (!err) {
        addAddress(socketClient, body, Service, Queue, db, schedule)
      }
    })
  })
}
