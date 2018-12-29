'use strict'

const { Ignitor } = require('@adonisjs/ignitor')

new Ignitor(require('@adonisjs/fold'))
  .appRoot(__dirname)
  .preLoad('app/Managers/QueueManager.js')
  .fireHttpServer()
  .catch(console.error)
