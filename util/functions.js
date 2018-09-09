var _global = require('./global')
const _config = require('../config')
const _kts = require('./kts')
const _script = require('../db/script')

let getBot = () => {
  for (let index in _global.bots) {
    return _global.bots[index]
  }
}

let getClient = (id, socket) => {
  var sock = socket
  if (id) {
    sock = _global.clients[id]
  }
  if (sock) {
    return sock
  } else {
    return socket
  }
}

let deleteServiceByCabman = async (idCabman, db, Service) => {
  db.all(_script.select.orderByCabman, [idCabman], (err, rows) => {
    if (!err && rows && rows.length > 0) {
      for (index in rows) {
        db.all(_script.select.orderByService, [rows[index].service], (error, elements) => {
          if (!error && elements && elements.length > 0) {
            db.run(_script.delete.orderByService, [rows[index].service])
            db.run(_script.delete.service, [rows[index].service])
            Service.getLastServiceUser(elements[0].user, json => {
              if (json && json.length > 0) {
                let order = json[0].info
                order.action = _kts.action.cancel
                order = Service.addTime(order, _kts.json.cancelTime)
                order = Service.addTime(order, _kts.json.cancel)
                Service.update(order, data => {
                  getBot().emit(_kts.socket.cancelTime, data.info.user)
                })
              }
            })
          }
        })
      }
    }
  })
  db.run(_script.update.orderByCabman, [idCabman])
}

module.exports = {
  getBot,
  getClient,
  deleteServiceByCabman,
  inCity: (address) => {
    let value = /(.)*((,|-|\.|\*|_)*(\s|\S)*(B|b)uenaventura(,|-|\.|\*|_)(\s|\S)*(V|v)alle(\s|\S)*del(\s|\S)*(C|c)auca(,|-|\.|\*|_)(\s|\S)*(C|c)olombia)/g.test(address)
    return value
  },
  getMeService: (token) => {
    return {
      method: _kts.method.get,
      headers: {'USER-TOKEN': token}
    }
  },
  getInit: (data, method) => {
    return {
      method: method,
      headers: {'Content-Type': _kts.header.applicationJson},
      body: JSON.stringify({
        'info': JSON.stringify(data)
      })
    }
  },
  savePositionCab: async (data, db) => {
    db.run(_script.insert.position, [data.id, data.service, data.action, data.position.latitude, data.position.longitude, new Date().toString()])
  },
  deleteServiceForAccept: async (idDriver, idService, db) => {
    db.run(_script.update.service_status, [idDriver, idService])
  },
  redirectDefault: (res) => res.redirect(_config.urlServer)
}
