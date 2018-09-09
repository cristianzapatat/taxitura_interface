module.exports = {
  timeOnMyWay: process.env.TIME_WAY || 180000,
  port: process.env.PORT || 3002,
  portQueue: process.env.PORT_QUEUE || 61613,
  hostQueue: process.env.HOST_QUEUE || 'localhost',
  saveServiceQueue: process.env.SAVE_SERVICE_QUEUE || 'save_service_queue',
  saveServiceQueueError: process.env.SAVE_SERVICE_QUEUE_ERROR || 'save_service_queue_error',
  sendMessageQueue: process.env.SEND_MESSAGE_QUEUE || 'send_message',
  sendMessageQueueError: process.env.SEND_MESSAGE_QUEUE_ERROR || 'send_message_error',
  numberTryQueue: process.env.NUMBER_TRY_QUEUE || 3,
  urlServer: process.env.URL_SERVER || 'localhost:3000',
  develop: process.env.DEVELOP ? true : false || false
}
