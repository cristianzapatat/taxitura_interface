const fetch = require('node-fetch')

const _kts = require('../util/kts')
const _url = require('../util/url')
const _fns = require('../util/functions')

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

  makeRequest (resolve, fail, url, header) {
    if (!header) header = {}
    fetch(url, header)
      .then(response => {
        if (response.status >= 200 && response.status <= 299) {
          return response.json()
        } else {
          throw response.status
        }
      })
      .then(json => {
        if (resolve) resolve(json)
      })
      .catch(err => {
        if (fail) fail(err)
      })
  }

  save (order, resolve, fail) {
    this.makeRequest(resolve, fail, _url.urlServices, _fns.getInit(order, _kts.method.post))
  }

  update (order, resolve = undefined, fail = undefined) {
    this.makeRequest(resolve, fail, _url.getIdService(order.service.id), _fns.getInit(order, _kts.method.put))
  }

  getId (idOrder, resolve, fail) {
    this.makeRequest(resolve, fail, _url.getIdService(idOrder))
  }

  getLastServiceUser (idUser, resolve = undefined, fail = undefined) {
    this.makeRequest(resolve, fail, _url.lastServiceUser(idUser))
  }

  getLastServiceDriver (idDriver, resolve, fail) {
    this.makeRequest(resolve, fail, _url.lastServiceDriver(idDriver))
  }

  getCantServicesDayDriver (idDriver, resolve, fail) {
    this.makeRequest(resolve, fail, _url.cantServicesDayDriver(idDriver))
  }

  getMultipleServices (array, resolve, fail) {
    this.makeRequest(resolve, fail, _url.multipleServices(array))
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

  addTime (order, nameTime, date = new Date()) {
    order.date[nameTime] = date
    return order
  }

  addTimeAndDistance (order, distance, time) {
    order.position_cabman.distance = distance || -1
    order.position_cabman.time = time || -1
    return order
  }
}

module.exports = Service
