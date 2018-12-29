'use strict'

const Stompit = use('stompit')
const Logger = use('Logger')
let clientMQ

class ActiveMQ {
  constructor (Config) {
    this.config = Config.get('activeMQ')
    Stompit.connect({
      host: this.config.queue_host,
      port: this.config.queue_port
    }, this.init)
  }

  init (err, client) {
    if (err) {
      Logger.error('Exit app for activeMQ...', { err })
      process.exit(1)
    } else {
      Logger.info('Setting activeMQ client...')
      clientMQ = client
    }
  }

  async sendMessage (message, queueName) {
    let state = true
    if (message && message.length > 0 && queueName && queueName.length > 0) {
      const frame = clientMQ.send({ destination: queueName })
      frame.write(message)
      frame.end()
    } else {
      Logger.warning('Message or queueName empty...', { message, queueName })
      state = false
    }

    return state
  }

  async subscribeQueue (queueName, callBack) {
    clientMQ.subscribe({ destination: queueName }, (err, message) => {
      if (!err) {
        message.readString('UTF-8', (error, body) => {
          if (!error) {
            callBack(JSON.parse(body))
          } else {
            Logger.warning('Read queue error', { error })
          }
        })
      } else {
        Logger.error('Error getting subscribition message', { err })
      }
    })
  }
}

module.exports = ActiveMQ
