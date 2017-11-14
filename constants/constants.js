let keyDistanceAndTime = 'AIzaSyCPDys-IZuq1CqhFr6cVEc-rMeT5Z33iKE'

module.exports = {
  keyDistanceAndTime,
  getDistanceMatrix: (start, end) => {
    let startLoc = `${start.latitude},${start.longitude}`
    let endLoc = `${end.latitude},${end.longitude}`
    return `https://maps.googleapis.com/maps/api/distancematrix/json?
      units=imperial&origins=${startLoc}&destinations=${endLoc}&
      key=${keyDistanceAndTime}&units=metric`
  }
}
