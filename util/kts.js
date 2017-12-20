/*
File that contains the constants of the project
*/
module.exports = {
  config: {
    views: 'views',
    hbsPoint: '.hbs',
    hbs: 'hbs',
    viewEngine: 'view engine'
  },
  socket: {
    connection: 'connection',
    getBot: 'getBot',
    responseBot: 'responseBot',
    createService: 'createService',
    receiveService: 'receiveService',
    responseService: 'responseService',
    responseOrder: 'responseOrder',
    acceptService: 'acceptService',
    acceptCancel: 'acceptCancel',
    orderCanceled: 'orderCanceled',
    savePositionCab: 'savePositionCab',
    serviceInMemory: 'serviceInMemory',
    isServiceInMemory: 'isServiceInMemory',
    addServiceList: 'addServiceList',
    addServiceCanceled: 'addServiceCanceled',
    nextService: 'nextService',
    quality: 'quality',
    getPositionBot: 'getPositionBot',
    returnPositionBot: 'returnPositionBot',
    onMyWay: 'onMyWay',
    notFoundService: 'notFoundService',
    disconnect: 'disconnect'
  },
  action: {
    order: 'order',
    accept: 'accept',
    arrive: 'arrive',
    aboard: 'aboard',
    end: 'end'
  },
  json: {
    service: 'service',
    facebook: 'facebook',
    withoutOrigin: null,
    addressFull: 'addressFull',
    address: 'address',
    quality: 'quality',
    channel: 'channel',
    onMyWay: 'onMyWay'
  },
  operators: {
    coma: ','
  },
  time: {
    onMyWay: 180000
  }
}
