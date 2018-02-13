const _config = require('../config')

class Queue {
  constructor (client) {
    this._client = client
  }

  sendMessage (message, queue) {
    const frame = this._client.send({destination: queue})
    frame.write(message)
    frame.end()
  }

  saveServiceQueue (message) {
    this.sendMessage(message, _config.saveServiceQueue)
  }

  saveServiceQueueError (message) {
    this.sendMessage(message, _config.saveServiceQueueError)
  }

  sendMessageService (message) {
    this.sendMessage(message, _config.sendMessageQueue)
  }

  sendMessageServiceError (message) {
    this.sendMessage(message, _config.sendMessageQueueError)
  }

  subscribe (queue, callback) {
    this._client.subscribe({destination: queue}, (err, msg) => {
      if (!err) {
        callback(msg)
      } else { // TODO definir que hacer
        console.log(err)
      }
    })
  }

  getClient () {
    return this._client
  }
}

module.exports = Queue
