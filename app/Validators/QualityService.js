'use strict'

const BadRequestException = use('App/Exceptions/BadRequestException')

class QualityService {
  get rules () {
    return {
      service_id: 'required|integer',
      user_id: 'required|string',
      quality: 'required|integer'
    }
  }

  async fails () {
    return new BadRequestException()
  }

  static get fillable () {
    return [
      'service_id',
      'user_id',
      'quality'
    ]
  }
}

module.exports = QualityService
