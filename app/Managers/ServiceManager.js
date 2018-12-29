'use strict'

const Queue = use('ActiveMQ')
const Bugsnag = use('Bugsnag')
const QueueException = use('App/Exceptions/QueueException')
const { NOT_MODIFIED, PRECONDITION_FAILED, NOT_FOUND, RESET_CONTENT } = use('http-status')
const { queue_order_name, queue_order_aux } = use('Adonis/Src/Config').get('activeMQ')

class ServiceManager {
  static get inject () {
    return [
      'App/Repositories/PositionCabRepository',
      'App/Services/ServerApiService',
      'App/Services/BotService'
    ]
  }

  constructor (PositionCabRepository, ServerApiService, BotService) {
    this.positionCabRepository = PositionCabRepository
    this.serverApiService = ServerApiService
    this.botService = BotService
  }

  constructorAddServerApi (ServerApiService) {
    this.serverApiService = ServerApiService
  }

  identifyOrder (order) {
    const date = new Date()
    order.service = {
      id: date.getTime(),
      origin: 'facebook'
    }
    order.date.interface = date

    return order
  }

  nextActionService (action) {
    let response = ''
    switch (action) {
      case 'order':
        response = 'accept'
        break
      case 'accept':
        response = 'arrive'
        break
      case 'arrive':
        response = 'aboard'
        break
      case 'aboard':
        response = 'end'
        break
      case 'end':
        response = 'complete'
        break
      default:
        response = action
        break
    }

    return response
  }

  async getLastServiceByUser (userId) {
    const [service] = await this.serverApiService.getLastServiceByUser(userId)
    Bugsnag.info(`${userId} search services ${!!service}`, { service })

    if (service) {
      return service.info
    }

    return service
  }

  async getLastServiceByDriver (driverId) {
    const [service = {}] = await this.serverApiService.getLastServiceByDriver(driverId)
    const { info } = service

    return info
  }

  async getServicesCanceledByDriver (driverId) {
    const services = await this.serverApiService.getServicesCanceledByDriver([], driverId)

    return JSON.parse(`[${services.toString().replace(/"=>/g, '":')}]`)
  }

  async putInQueue (response, order) {
    const keyAction = (new Date()).getTime()
    Bugsnag.info(`${keyAction} putInQueue Init`, order)
    const lastService = await this.getLastServiceByUser(order.user.id)
    Bugsnag.info(`${keyAction} putInQueue result lastService`, lastService)

    if (!lastService) {
      const service = this.identifyOrder(order)
      Bugsnag.info(`${keyAction} putInQueue update service`, service)
      let state = await Queue.sendMessage(JSON.stringify(service), queue_order_name)
      Bugsnag.info(`${keyAction} putInQueue state`, { state })
      if (!state) {
        state = await Queue.sendMessage(JSON.stringify(service), queue_order_aux)
        Bugsnag.info(`${keyAction} putInQueue two state`, { state })
      }
      if (state) {
        return service
      }
      Bugsnag.warning(`${keyAction} putInQueue QueueException`)

      return new QueueException()
    }

    Bugsnag.error(`${keyAction} putInQueue error`)

    return response.status(NOT_MODIFIED).send()
  }

  async updateAction (response, service) {
    const { service: { id }, action, cabman: { id: idCabman } } = service
    const { info: order } = await this.serverApiService.getServiceById(id)

    if (order && order.action !== 'end') {
      let updateService = null
      const { action: actionNow, cabman } = order
      const actions = ['accept', 'arrive', 'aboard', 'end']
      if ((action === 'order' && cabman) || (actions.includes(action) && idCabman !== cabman.id)) {
        return response.status(NOT_FOUND).send({ code: '003', message: `order in processing: ${actionNow}` })
      }
      const nextAction = this.nextActionService(action)
      service.action = nextAction
      service.date[nextAction] = new Date()
      updateService = await this.updateService(service)

      if (updateService) {
        updateService.bot = await this.botService.updateServiceStatus(updateService)
      }

      return updateService
    }

    return response.status(NOT_FOUND).send({ code: '002', message: 'order not found' })
  }

  async cancelServiceByUser (response, userId) {
    const lastService = await this.getLastServiceByUser(userId)
    Bugsnag.warning(`Cancel service by user ${userId}, service = ${!!lastService}`, lastService)

    if (lastService) {
      const { action } = lastService
      const values = ['order', 'accept', 'arrive']
      if (values.includes(action)) {
        lastService.action = 'cancel'
        lastService.date.cancel_by_user = new Date()
        // TODO: si action es accept o arrive notificar al taxista
        const service = await this.updateService(lastService)

        return service
      }

      return response.status(PRECONDITION_FAILED).send()
    }

    return response.status(NOT_MODIFIED).send()
  }

  async cancelServiceByCab (response, serviceId) {
    try {
      const { info: order } = await this.serverApiService.getServiceById(serviceId)
      if (order) {
        const { action } = order
        const values = ['order', 'accept', 'arrive']
        if (values.includes(action)) {
          order.action = 'cancel'
          order.date.cancel_by_cab = new Date()
          // TODO: Notificar al usuario
          const service = await this.updateService(order)

          return service
        }
      }

      return response.status(NOT_FOUND).send({ code: '002', message: 'order not found' })
    } catch (error) {
      return response.status(NOT_FOUND).send({ code: '002', message: 'order not found', error })
    }
  }

  async getPositionCab (userId) {
    const order = await this.getLastServiceByUser(userId)

    if (order) {
      const { service } = order
      const position = await this.positionCabRepository.lastPosition(service.id)

      if (position) {
        const { service: service_id, latitude, longitude } = position

        return { service: service_id, latitude, longitude }
      }

      return position
    }

    return order
  }

  async qualityService ({ service_id, user_id, quality }, response) {
    const result = await this.validateUserOwnerOrder(service_id, user_id, response, async order => {
      const date = new Date()
      order.quality = {
        quality,
        date
      }
      order.date.quality = date
      const orderQuality = await this.updateService(order)

      return orderQuality
    })

    return result
  }

  async onMyWay ({ service_id, user_id }, response) {
    const result = await this.validateUserOwnerOrder(service_id, user_id, response, async order => {
      const date = new Date()
      if (!order.onMyWay) order.onMyWay = []
      order.onMyWay.push(date)
      const orderOnMyWay = await this.updateService(order)
      // TODO notificar al taxista

      return orderOnMyWay
    })

    return result
  }

  async getServicesFinishedToday (driverId, status) {
    try {
      const data = await this.serverApiService.getServicesFinishedToday(driverId, status)

      return {
        id: driverId,
        cant: data.length
      }
    } catch (error) {
      return {
        id: driverId,
        cant: 0
      }
    }
  }

  // Internal Methods
  async createService (order) {
    const { info } = await this.serverApiService.saveOrder(order)

    return info
  }

  async updateService (order) {
    const { info } = await this.serverApiService.updateOrder(order)

    return info
  }

  async validateUserOwnerOrder (serviceId, userId, response, callBack) {
    try {
      const { info: order } = await this.serverApiService.getServiceById(serviceId)
      if (order) {
        const { user } = order
        if (user.id === userId) {
          return callBack(order)
        }

        return response.status(RESET_CONTENT).send({ code: '001', message: 'user does not match' })
      }

      return response.status(NOT_FOUND).send({ code: '002', message: 'order not found' })
    } catch (error) {
      return response.status(NOT_FOUND).send({ code: '002', message: 'order not found', error })
    }
  }
}

module.exports = ServiceManager
