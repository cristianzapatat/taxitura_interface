'use strict'

/*
|--------------------------------------------------------------------------
| Server API Configuaration
|--------------------------------------------------------------------------
|
|
*/

const Env = use('Env')

module.exports = {
  server_api: Env.get('SERVER_API')
}
