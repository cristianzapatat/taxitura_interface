/*
File that contains the constants of the project
*/
module.exports = {
  regex: {
    inCity: '(.)*((,|-|\\.|\\*|_)*(\\s|\\S)*(B|b)uenaventura(,|-|\\.|\\*|_)(\\s|\\S)*(V|v)alle(\\s|\\S)*del(\\s)*(C|c)auca(,|-|\\.|\\*|_)(\\s|\\S)*(C|c)olombia)'
  },
  conf: {
    utf8: 'UTF-8'
  },
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
    processService: 'processService',
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
    notFoundCabman: 'notFoundCabman',
    notSentPetition: 'notSentPetition',
    errorMessageQueue: 'errorMessageQueue',
    orderInProcess: 'orderInProcess',
    orderProcessing: 'orderProcessing',
    outOfCity: 'outOfCity',
    disconnect: 'disconnect',
    errorFetch: 'errorFetch'
  },
  action: {
    order: 'order',
    accept: 'accept',
    arrive: 'arrive',
    aboard: 'aboard',
    end: 'end',
    cancel: 'cancel',
    outOfCity: 'outofcity'
  },
  json: {
    service: 'service',
    facebook: 'facebook',
    withoutOrigin: null,
    addressFull: 'addressFull',
    address: 'address',
    quality: 'quality',
    channel: 'channel',
    onMyWay: 'onMyWay',
    interface: 'interface',
    queue: 'queue',
    try: 'try',
    accept: 'accept',
    arrive: 'arrive',
    aboard: 'aboard',
    end: 'end',
    cancel: 'cancel',
    err: 'error'
  },
  operators: {
    coma: ','
  },
  time: {
    onMyWay: 180000
  },
  method: {
    get: 'GET',
    put: 'PUT',
    post: 'POST'
  },
  header: {
    contentType: 'Content-Type',
    multiparFormData: 'multipart/form-data',
    applicationJson: 'application/json'
  }
}
