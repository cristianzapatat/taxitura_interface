'use strict'

const BadRequestException = use('App/Exceptions/BadRequestException')

class OnMyWayService {
  get rules () {
    return {
      service_id: 'required|integer',
      user_id: 'required|string'
    }
  }

  async fails () {
    return new BadRequestException()
  }

  static get fillable () {
    return [
      'service_id',
      'user_id'
    ]
  }
}

module.exports = OnMyWayService
