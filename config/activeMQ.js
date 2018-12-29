'use strict'

/*
|--------------------------------------------------------------------------
| ActiveMQ Queue Configuaration
|--------------------------------------------------------------------------
|
|
*/

const Env = use('Env')

module.exports = {
  queue_port: Env.get('QUEUE_PORT'),
  queue_host: Env.get('QUEUE_HOST'),
  queue_order_name: Env.get('QUEUE_ORDER_NAME'),
  queue_order_aux: Env.get('QUEUE_ORDER_AUX')
}
