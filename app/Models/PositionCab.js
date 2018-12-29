'use strict'

const Model = use('Model')

class PositionCab extends Model {
  static get table () {
    return 'positions_cab'
  }
}

module.exports = PositionCab
