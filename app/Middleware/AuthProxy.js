'use strict'

const UnauthorizedException = use('App/Exceptions/UnauthorizedException')

class AuthProxy {
  async handle ({ request }, next) {
    const auth = request.header('authorization')
    if (auth && auth.startsWith('Bearer ')) {
      await next()
    } else {
      throw new UnauthorizedException()
    }
  }
}

module.exports = AuthProxy
