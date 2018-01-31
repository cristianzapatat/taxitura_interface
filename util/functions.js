var _global = require('./global')
const _config = require('../config')
const _kts = require('./kts')

module.exports = {
  getBot: () => {
    for (let index in _global.bots) {
      return _global.bots[index]
    }
  },
  getInit: (data, method) => {
    return {
      method: method,
      headers: { 'Content-Type': _kts.header.applicationJson },
      body: JSON.stringify({
        'info': JSON.stringify(data)
      })
    }
  },
  savePositionCab: async (id, data) => {
    if (!_global.positionsCab[id]) {
      _global.positionsCab[id] = []
    }
    _global.positionsCab[id].push(data)
  },
  deleteServiceForAccept: async (idService) => {
    (async () => {
      for (let index in _global.canceledOrders) {
        let pos = _global.canceledOrders[index].indexOf(idService)
        if (pos >= 0) _global.canceledOrders[index].splice(pos, 1)
      }
    })()
  },
  redirectDefault (res) {
    res.redirect(_config.urlServer)
  }
}
