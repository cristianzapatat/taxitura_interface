'use strict'

const PositionCab = use('App/Models/PositionCab')

class PositionCabRepository {
  async lastPosition (serviceId) {
    const positions = await PositionCab
      .query()
      .where({ service: serviceId })
      .orderBy('created_at', 'desc')
      .limit(1)
      .fetch()
    const [position] = positions.rows

    return position
  }
}

module.exports = PositionCabRepository
