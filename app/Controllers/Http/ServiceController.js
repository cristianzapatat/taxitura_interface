'use strict'

const AddToQueueValidator = use('App/Validators/AddToQueue')
const QualityServiceValidator = use('App/Validators/QualityService')
const OnMyWayValidator = use('App/Validators/OnMyWayService')

class ServiceController {
  static get inject () {
    return [
      'App/Managers/ServiceManager'
    ]
  }

  constructor (ServiceManager) {
    this.serviceManager = ServiceManager
  }

  async putInQueue ({ request, response }) {
    const order = request.only(AddToQueueValidator.fillable)

    return this.serviceManager.putInQueue(response, order)
  }

  async updateAction ({ request, response }) {
    const service = request.all()

    return this.serviceManager.updateAction(response, service)
  }

  async cancelServiceByUser ({ params: { userId }, response }) {
    return this.serviceManager.cancelServiceByUser(response, userId)
  }

  async cancelServiceByCab ({ params: { serviceId }, response }) {
    return this.serviceManager.cancelServiceByCab(response, serviceId)
  }

  async getLastServiceByUser ({ params: { userId } }) {
    return this.serviceManager.getLastServiceByUser(userId)
  }

  async getLastServiceByDriver ({ params: { driverId } }) {
    return this.serviceManager.getLastServiceByDriver(driverId)
  }

  async getServicesCanceledByDriver ({ params: { driverId } }) {
    return this.serviceManager.getServicesCanceledByDriver(driverId)
  }

  async getPositionCab ({ params: { userId } }) {
    return this.serviceManager.getPositionCab(userId)
  }

  async qualityService ({ request, response }) {
    const quality = request.only(QualityServiceValidator.fillable)

    return this.serviceManager.qualityService(quality, response)
  }

  async onMyWay ({ request, response }) {
    const data = request.only(OnMyWayValidator.fillable)

    return this.serviceManager.onMyWay(data, response)
  }

  async getServicesFinishedToday ({ request }) {
    const { params: { driverId }, qs: { status } } = request

    return this.serviceManager.getServicesFinishedToday(driverId, status)
  }
}

module.exports = ServiceController
