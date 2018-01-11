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
      } else {
        console.log(err)
      }
    })
  }

  getClient () {
    return this._client
  }
}

module.exports = Queue
