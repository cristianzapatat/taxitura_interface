'use strict'

function decode (str, precision) {
  let index = 0
  let lat = 0
  let lng = 0
  const coordinates = []
  let shift = 0
  let result = 0
  let byte = null
  let latitudeChange
  let longitudeChange
  const factor = Math.pow(10, precision || 5)

  while (index < str.length) {
    byte = null
    shift = 0
    result = 0
    do {
      byte = str.charCodeAt(index += 1) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    latitudeChange = ((result & 1) ? ~(result >> 1) : (result >> 1))
    result = 0
    shift = result
    do {
      byte = str.charCodeAt(index += 1) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    longitudeChange = ((result & 1) ? ~(result >> 1) : (result >> 1))

    lat += latitudeChange
    lng += longitudeChange
    coordinates.push([lat / factor, lng / factor])
  }

  return coordinates
}

module.exports = { decode }
