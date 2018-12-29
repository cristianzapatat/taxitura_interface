'use strict'

const HttpRequest = use('Http/Request')

const { token, webhook } = use('Adonis/Src/Config').get('bot')
const urlServices = `${webhook}/webhook/interface`

class BotService {
  async updateServiceStatus (order) {
    const options = {
      uri: `${urlServices}/update_service_status`,
      headers: {
        authorization: token
      },
      body: { service: order },
      json: true
    }

    return HttpRequest.post(options)
  }
}

module.exports = BotService
