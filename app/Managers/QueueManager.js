'use strict'

const QueueMQ = use('ActiveMQ')
const Firebase = use('Firebase')
const Logger = use('Logger')
const ServiceManager = use('App/Managers/ServiceManager')
const ServerApiService = use('App/Services/ServerApiService')
const serviceManager = new ServiceManager()
serviceManager.constructorAddServerApi(new ServerApiService())
const { queue_order_name, queue_order_aux } = use('Adonis/Src/Config').get('activeMQ')

const getDataQueue = queueName => {
  QueueMQ.subscribeQueue(queueName, async msg => {
    // Logger.info(`Obtained order the queue ${queueName}`, msg.service.id)
    const order = await serviceManager.createService(msg)
    Firebase.sendMessageBroadcast('order', order)
  })
}

const initialQueue = () => {
  Logger.info('Initialing subscribe to queue... 5 seg')
  setTimeout(async () => {
    getDataQueue(queue_order_name)
    getDataQueue(queue_order_aux)
  }, 5000)
}

initialQueue()
