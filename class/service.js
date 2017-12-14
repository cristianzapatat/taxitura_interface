const _global = require('../util/global')
const _kts = require('../util/kts')

class Service {
  create (order, address, origin) {
    if (!address || address.length === 0) {
      address = `-${_kts.operators.coma}-`
    }
    let date = new Date()
    order[_kts.json.service] = {
      id: date.getTime(),
      origin: origin || _kts.json.withoutOrigin,
      date_creation: date
    }
    let pos = address.split(_kts.operators.coma)
    order.position_user[_kts.json.addressFull] = address
    order.position_user[_kts.json.address] = `${pos[0]}, ${pos[1]}`
    return order
  }

  addTimeAndDistance (order, distance, time) {
    order.position_cabman.distance = distance || -1
    order.position_cabman.time = time || -1
    return order
  }

  searchServiceForUserOnOrders (id) {
    for (let index in _global.orders) {
      let order = _global.orders[index]
      if (order.user.id === id) return order
    }
    return null
  }
}

module.exports = Service
