'use strict'

/*
|--------------------------------------------------------------------------
| Bot Configuaration
|--------------------------------------------------------------------------
|
|
*/

const Env = use('Env')

module.exports = {
  token: Env.get('BOT_TOKEN'),
  webhook: Env.get('BOT_WEBHOOK')
}
