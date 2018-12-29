'use strict'

// const Logger = use('Logger')
const { BAD_REQUEST } = use('http-status')
const { LogicalException } = use('@adonisjs/generic-exceptions')

class BadRequestException extends LogicalException {
  handle (error, { response, request }) {
    // Logger.error('Bad Request', { error: error.stack, body: request.all() })
    response.status(BAD_REQUEST).send(error)
  }
}

module.exports = BadRequestException
