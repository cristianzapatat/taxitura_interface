'use strict'

const BadRequestException = use('App/Exceptions/BadRequestException')

class AddToQueue {
  get rules () {
    return {
      action: 'required|string|equals:order',
      user: 'required|object',
      'user.id': 'required|string',
      'user.url_pic': 'required|url',
      'user.name': 'required|string',
      'user.first_name': 'required|string',
      'user.last_name': 'required|string',
      position_user: 'required|object',
      'position_user.latitude': 'required|number',
      'position_user.longitude': 'required|number',
      'position_user.address': 'required|string',
      'position_user.ref': 'string',
      date: 'required|object',
      'date.creation': 'required|string'
    }
  }

  async fails () {
    return new BadRequestException()
  }

  static get fillable () {
    return [
      'action',
      'user.id',
      'user.url_pic',
      'user.name',
      'user.first_name',
      'user.last_name',
      'position_user.latitude',
      'position_user.longitude',
      'position_user.ref',
      'position_user.address',
      'date.creation'
    ]
  }
}

module.exports = AddToQueue
