var _global = require('./global')
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
  savePositionCab: async (id, position) => {
    if (!_global.positionsCab[id]) {
      _global.positionsCab[id] = []
    }
    _global.positionsCab[id].push({
      latitude: position.latitude,
      longitude: position.longitude
    })
  },
  deleteServiceForAccept: async (idService) => {
    (async () => {
      for (let index in _global.canceledOrders) {
        delete _global.canceledOrders[index][idService]
      }
    })();
    (async () => {
      for (let index in _global.pendingOrders) {
        delete _global.pendingOrders[index][idService]
      }
    })()
  },
  redirectDefault (res) {
    res.redirect('http://www.taxitura.com/')
  }
}
