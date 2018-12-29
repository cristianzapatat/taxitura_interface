'use strict'

const HttpRequest = use('Http/Request')

const { key_geocoding, key_distanceMatrix, key_directions } = use('Adonis/Src/Config').get('google')

class GoogleService {
  async getGeocoding ({ latitude, longitude }) {
    const options = {
      uri: `https://maps.google.com/maps/api/geocode/json?key=${key_geocoding}&latlng=${latitude},${longitude}`,
      json: true
    }

    return HttpRequest.get(options)
  }

  async getDistanceMatrix ({ latitude, longitude, latitudeUser, longitudeUser }) {
    const startLoc = `${latitude},${longitude}`
    const endLoc = `${latitudeUser},${longitudeUser}`
    const options = {
      uri: `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${startLoc}&destinations=${endLoc}&key=${key_distanceMatrix}&units=metric`,
      json: true
    }

    return HttpRequest.get(options)
  }

  async getDirections ({ latitude, longitude, latitudeUser, longitudeUser }) {
    const startLoc = `${latitude},${longitude}`
    const endLoc = `${latitudeUser},${longitudeUser}`
    const options = {
      uri: `https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${endLoc}&key=${key_directions}`,
      json: true
    }

    return HttpRequest.get(options)
  }
}

module.exports = GoogleService
