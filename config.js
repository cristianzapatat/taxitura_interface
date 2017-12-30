module.exports = {
  port: process.env.PORT || 3001,
  portQueue: process.env.PORT_QUEUE || 61613,
  hostQueue: process.env.HOST_QUEUE || 'localhost',
  sendMessageQueue: process.env.SEND_MESSAGE_QUEUE || 'send_message_queue',
  sendMessageQueueError: process.env.SEND_MESSAGE_QUEUE_ERROR || 'send_message_queue_error',
  numberTryQueue: process.env.NUMBER_TRY_QUEUE || 3
}
