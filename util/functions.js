var _global = require('./global')

module.exports = {
  getBot: () => {
    for (let index in _global.bots) {
      return _global.bots[index]
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
    res.redirect('https://www.facebook.com/taxitura/')
  }
}
