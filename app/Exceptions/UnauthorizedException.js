'use strict'

// const Logger = use('Logger')
const { UNAUTHORIZED } = use('http-status')
const { LogicalException } = use('@adonisjs/generic-exceptions')

class UnauthorizedException extends LogicalException {
  handle (error, { response, request }) {
    // Logger.error('Unauthorized', { error: error.stack, body: request.all() })
    response.status(UNAUTHORIZED).send(error)
  }
}

module.exports = UnauthorizedException
