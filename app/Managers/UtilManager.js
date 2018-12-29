'use strict'

const Utils = use('App/Utils')

class UtilManager {
  static get inject () {
    return [
      'App/Services/GoogleService'
    ]
  }

  constructor (GoogleService) {
    this.googleService = GoogleService
  }

  async getInfoPosition (latitude, longitude) {
    if (!isNaN(latitude) && !isNaN(longitude)) {
      const data = await this.googleService.getGeocoding({ latitude, longitude })

      if (data.status && data.status.toUpperCase() === 'OK') {
        const [result] = data.results

        if (result) {
          const { formatted_address: ref, geometry: { location }, plus_code } = result

          return { status: 'OK', ref, location, plus_code }
        }
      }

      return {
        status: 'OK',
        msn: data,
        ref: '---',
        location: { lat: latitude, lng: longitude },
        plus_code: { compound_code: '---', global_code: '---' }
      }
    }

    return { url: 'error' }
  }

  async calculateDistance ({ latitude, longitude, latitudeUser, longitudeUser }) {
    if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(latitudeUser) && !isNaN(longitudeUser)) {
      const data = await this.googleService
        .getDistanceMatrix({ latitude, longitude, latitudeUser, longitudeUser })

      if (data.rows && data.rows.length) {
        const { rows: [info] } = data

        if (info) {
          const { elements: [element] } = info

          return element
        }
      }

      return {
        msn: data,
        status: 'OK',
        distance: { value: 0 },
        duration: { value: 0 }
      }
    }

    return { url: 'error' }
  }

  async getRoute ({ latitude, longitude, latitudeUser, longitudeUser }) {
    if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(latitudeUser) && !isNaN(longitudeUser)) {
      const data = await this.googleService
        .getDirections({ latitude, longitude, latitudeUser, longitudeUser })

      if (data.routes && data.routes.length) {
        const { routes: [info] } = data

        if (info) {
          const { overview_polyline: { points } } = info
          const root = Utils.decode(points, 5)
          const coords = root.map(point => {
            const position = { latitude: point[0], longitude: point[1] }

            return position
          })

          return {
            status: 'OK',
            coords
          }
        }
      }

      return {
        status: 'OK',
        msn: data,
        coords: [
          { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
          { latitude: parseFloat(latitudeUser), longitude: parseFloat(longitudeUser) }
        ]
      }
    }

    return { url: 'error' }
  }
}

module.exports = UtilManager
