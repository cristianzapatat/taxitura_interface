'use strict'

class UtilController {
  static get inject () {
    return [
      'App/Managers/UtilManager'
    ]
  }

  constructor (UtilManager) {
    this.utilManager = UtilManager
  }

  async getInfoPosition ({ params: { latitude, longitude } }) {
    return this.utilManager.getInfoPosition(latitude, longitude)
  }

  async calculateDistance ({ params: { latitude, longitude, latitudeUser, longitudeUser } }) {
    return this.utilManager.calculateDistance({ latitude, longitude, latitudeUser, longitudeUser })
  }

  async getRoute ({ params: { latitude, longitude, latitudeUser, longitudeUser } }) {
    return this.utilManager.getRoute({ latitude, longitude, latitudeUser, longitudeUser })
  }
}

module.exports = UtilController
