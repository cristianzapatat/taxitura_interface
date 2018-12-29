'use strict'

const Schema = use('Schema')

class PositionCabSchema extends Schema {
  up () {
    this.create('positions_cab', table => {
      table.increments()
      table.string('cabman')
      table.string('service').nullable()
      table.string('action').nullable()
      table.float('latitude')
      table.float('longitude')
      table.timestamp('created_at').defaultTo(this.fn.now())
    })

    this.raw('ALTER TABLE "public"."positions_cab" ALTER COLUMN "created_at" TYPE timestamp without time zone;')
  }

  down () {
    this.drop('positions_cab')
  }
}

module.exports = PositionCabSchema
