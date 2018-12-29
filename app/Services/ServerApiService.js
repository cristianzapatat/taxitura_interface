'use strict'

const HttpRequest = use('Http/Request')
// const Logger = use('Logger')

const { server_api } = use('Adonis/Src/Config').get('serverApi')
const urlServices = `${server_api}/api/v1/services`

class ServerApiService {
  async getServiceById (serviceId) {
    const options = {
      uri: `${urlServices}/${serviceId}`,
      json: true
    }
    // Logger.info('Getting service by id', serviceId)

    return HttpRequest.get(options)
  }

  async getLastServiceByUser (userId) {
    const options = {
      uri: `${urlServices}?filter_type=last_user&filter_params=${userId}`,
      json: true
    }
    // Logger.info('Getting last order in server by user', userId)

    return HttpRequest.get(options)
  }

  async getLastServiceByDriver (driverId) {
    const options = {
      uri: `${urlServices}?filter_type=last_driver&filter_params=${driverId}`,
      json: true
    }
    // Logger.info('Getting last order in server by driver', options)

    return HttpRequest.get(options)
  }

  async getServicesCanceledByDriver (servicesId = [], driverId) {
    const options = {
      uri: `${urlServices}/?filter_type=multiple_services&filter_params=${servicesId.join(',')}`,
      json: true
    }
    // Logger.info('Getting services canceled in server by driver', driverId || 'empty')

    return HttpRequest.get(options)
  }

  async saveOrder (order) {
    const options = {
      uri: urlServices,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      formData: {
        info: JSON.stringify(order)
      },
      json: true
    }
    // Logger.info('Saving order in server', order.service.id || 'order null')

    return HttpRequest.post(options)
  }

  async updateOrder (order) {
    const options = {
      uri: `${urlServices}/${order.service.id}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      formData: {
        info: JSON.stringify(order)
      },
      json: true
    }
    // Logger.info('Updating order in server', order.service.id || 'order null')

    return HttpRequest.put(options)
  }

  async getServicesFinishedToday (driverId, status = 'end') {
    const date = new Date()
    const time = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    const options = {
      uri: `${urlServices}/?filter_type=day&initial_date=${time} 00:00:00&end_date=${time} 23:59:59&filter_params=${driverId}&status=${status}`,
      json: true
    }

    return HttpRequest.get(options)
  }
}

module.exports = ServerApiService
