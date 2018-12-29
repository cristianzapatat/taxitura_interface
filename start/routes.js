'use strict'

const Config = use('Adonis/Src/Config')
const Route = use('Route')

const prefixRoot = `${Config.get('app').name}`

Route.get('/', () => '')

Route
  .group(() => {
    Route.get('/position-info/:latitude/:longitude', 'UtilController.getInfoPosition')
    Route.get('/calculate-distance/:latitude/:longitude/:latitudeUser/:longitudeUser', 'UtilController.calculateDistance')
    Route.get('/route/:latitude/:longitude/:latitudeUser/:longitudeUser', 'UtilController.getRoute')
  })
  .prefix('util')
  .prefix(prefixRoot)
  .middleware('proxy')

Route
  .group(() => {
    Route.get('/last-service/:userId/user', 'ServiceController.getLastServiceByUser')
    Route.get('/last-service/:driverId/driver', 'ServiceController.getLastServiceByDriver')
    Route.get('/service-canceled/:driverId/driver', 'ServiceController.getServicesCanceledByDriver')
    Route.get('/position-cab/:userId/user', 'ServiceController.getPositionCab')
    Route.get('/finished-today/:driverId/driver', 'ServiceController.getServicesFinishedToday')

    Route.post('/add-to-queue', 'ServiceController.putInQueue').validator('AddToQueue')
    Route.post('/update-action', 'ServiceController.updateAction').validator('UpdateActionService')

    Route.put('/quality', 'ServiceController.qualityService').validator('QualityService')
    Route.put('/on-my-way', 'ServiceController.onMyWay').validator('OnMyWayService')

    Route.delete('/cancel/:userId/user', 'ServiceController.cancelServiceByUser')
    Route.delete('/cancel/:serviceId/cab', 'ServiceController.cancelServiceByCab')
  })
  .prefix('service')
  .prefix(prefixRoot)
  .middleware('proxy')
