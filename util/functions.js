var _global = require('./global')
const _config = require('../config')
const _kts = require('./kts')
const _script = require('../db/script')

let reg = new RegExp(_kts.regex.inCity, 'g')

module.exports = {
  getBot: () => {
    for (let index in _global.bots) {
      return _global.bots[index]
    }
  },
  inCity: (address) => reg.test(address),
  getInit: (data, method) => {
    return {
      method: method,
      headers: { 'Content-Type': _kts.header.applicationJson },
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
