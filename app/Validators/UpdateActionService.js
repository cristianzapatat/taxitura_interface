'use strict'

const BadRequestException = use('App/Exceptions/BadRequestException')

class UpdateActionService {
  get rules () {
    return {
      action: 'required|string',
      service: 'required|object',
      'service.id': 'required|integer',
      user: 'required|object',
      'user.id': 'required|string',
      position_user: 'required|object',
      cabman: 'required|object',
      'cabman.id': 'required|integer',
      'cabman.name': 'required|string',
      'cabman.photo': 'required|string',
      'cabman.phone': 'required|string',
      'cabman.placa': 'required|string',
      position_cabman: 'required|object',
      'position_cabman.latitude': 'required|number',
      'position_cabman.longitude': 'required|number',
      'position_cabman.distance': 'required|number',
      'position_cabman.duration': 'required|number'
    }
  }

  async fails () {
    return new BadRequestException()
  }
}

module.exports = UpdateActionService
