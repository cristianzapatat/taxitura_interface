'use strict'

// const Logger = use('Logger')
const { FORBIDDEN } = use('http-status')
const { LogicalException } = use('@adonisjs/generic-exceptions')

class QueueException extends LogicalException {
  handle (error, { response, request }) {
    // Logger.error('Forbidden', { error: error.stack, body: request.all() })
    response.status(FORBIDDEN).send(error)
  }
}

module.exports = QueueException
