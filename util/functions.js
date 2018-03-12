var _global = require('./global')
const _config = require('../config')
const _kts = require('./kts')
const _script = require('../db/script')

module.exports = {
  getBot: () => {
    for (let index in _global.bots) {
      return _global.bots[index]
    }
  },
  getClient: (id, socket) => {
    var sock = _global.clients[id]
    if (sock) {
      return sock
    } else {
      return socket
    }
  },
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
