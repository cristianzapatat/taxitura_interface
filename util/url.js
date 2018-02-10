const _config = require('../config')

let keyDistanceMatrix = 'AIzaSyACBAr9IbMFB22u2IVLlgdI6LHRJOI0P74'
let keyGeocoding = 'AIzaSyC4PiNYLHiaDRYU63MQhb698_17WaSVCZI' // Google Maps Geocodign API
let urlServices = `${_config.urlServer}/api/v1/services`

module.exports = {
  keyDistanceMatrix,
  keyGeocoding,
  meService: `${_config.urlServer}/api/v1/me`,
  getDistanceMatrix: (start, end) => {
    let startLoc = `${start.latitude},${start.longitude}`
    let endLoc = `${end.latitude},${end.longitude}`
    return `https://maps.googleapis.com/maps/api/distancematrix/json?
      units=imperial&origins=${startLoc}&destinations=${endLoc}&
      key=${keyDistanceMatrix}&units=metric`
  },
  getGeocoding: (pos) => `https://maps.google.com/maps/api/geocode/json?key=${keyGeocoding}&latlng=${encodeURI(`${pos.latitude},${pos.longitude}`)}`,
  urlServices,
  getIdService: (idOrder) => `${urlServices}/${idOrder}`,
  lastServiceUser: (idUser) => `${urlServices}?filter_type=last_user&filter_params=${idUser}`,
  lastServiceDriver: (idDriver) => `${urlServices}?filter_type=last_driver&filter_params=${idDriver}`,
  multipleServices: (ids) => `${urlServices}?filter_type=multiple_services&filter_params=${ids.toString()}`,
  cantServicesDayDriver: (idDriver, status) => {
    let date = new Date()
    if (!status) status = 'end'
    let time = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    return `${urlServices}?filter_type=day&initial_date=${time} 00:00:00&end_date=${time} 23:59:59&filter_params=${idDriver}&status=${status}`
  }
}
