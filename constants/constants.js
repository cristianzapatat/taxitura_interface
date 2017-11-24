let keyDistanceAndTime = 'AIzaSyCPDys-IZuq1CqhFr6cVEc-rMeT5Z33iKE'
let keyGeocoding = 'AIzaSyCuixa1UeWyGrleFN_w7ceAJE9oYYmz1lU' // Google Maps Geocodign API

module.exports = {
  keyDistanceAndTime,
  keyGeocoding,
  getDistanceMatrix: (start, end) => {
    let startLoc = `${start.latitude},${start.longitude}`
    let endLoc = `${end.latitude},${end.longitude}`
    return `https://maps.googleapis.com/maps/api/distancematrix/json?
      units=imperial&origins=${startLoc}&destinations=${endLoc}&
      key=${keyDistanceAndTime}&units=metric`
  },
  getGeocoding: (pos) => {
    return `https://maps.google.com/maps/api/geocode/json?
      key=${keyGeocoding}&latlng=${encodeURI(`${pos.latitude},${pos.longitude}`)}`
  }
}
