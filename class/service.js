const _global = require('../util/global')
const _kts = require('../util/kts')

class Service {
  create (order, origin) {
    let date = new Date()
    order[_kts.json.service] = {
      id: date.getTime(),
      origin: origin || _kts.json.withoutOrigin
    }
    order.date[_kts.json.interface] = date
    return order
  }

  addAddress (order, address) {
    if (!address || address.length === 0) {
      address = `-${_kts.operators.coma}-`
    }
    let pos = address.split(_kts.operators.coma)
    order.position_user[_kts.json.addressFull] = address
    order.position_user[_kts.json.address] = `${pos[0]}, ${pos[1]}`
    return order
  }

  addChanel (order, channel) {
    order[_kts.json.channel] = channel
    return order
  }

  addTime (order, nameTime) {
    order.date[nameTime] = new Date()
    return order
  }

  addTimeAndDistance (order, distance, time) {
    order.position_cabman.distance = distance || -1
    order.position_cabman.time = time || -1
    return order
  }
}

module.exports = Service
