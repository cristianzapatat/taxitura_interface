let keyDistanceMatrix = 'AIzaSyACBAr9IbMFB22u2IVLlgdI6LHRJOI0P74'
let keyGeocoding = 'AIzaSyC4PiNYLHiaDRYU63MQhb698_17WaSVCZI' // Google Maps Geocodign API

module.exports = {
  keyDistanceMatrix,
  keyGeocoding,
  getDistanceMatrix: (start, end) => {
    let startLoc = `${start.latitude},${start.longitude}`
    let endLoc = `${end.latitude},${end.longitude}`
    return `https://maps.googleapis.com/maps/api/distancematrix/json?
      units=imperial&origins=${startLoc}&destinations=${endLoc}&
      key=${keyDistanceMatrix}&units=metric`
  },
  getGeocoding: (pos) => {
    return `https://maps.google.com/maps/api/geocode/json?
      key=${keyGeocoding}&latlng=${encodeURI(`${pos.latitude},${pos.longitude}`)}`
  }
}
