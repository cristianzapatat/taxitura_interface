'use strict'

/*
|--------------------------------------------------------------------------
| Bugsnag Configuaration
|--------------------------------------------------------------------------
|
|
*/

const Env = use('Env')

module.exports = {
  bugsnag_key: Env.get('BUGSNAG_KEY')
}
