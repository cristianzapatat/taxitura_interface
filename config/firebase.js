'use strict'

/*
|--------------------------------------------------------------------------
| Firebase Configuaration
|--------------------------------------------------------------------------
|
|
*/

const Env = use('Env')

module.exports = {
  project_id: Env.get('FB_PROJECT_ID'),
  client_email: Env.get('FB_CLIENT_EMAIL'),
  private_key: Env.get('FB_PRIVATE_KEY'),
  database: Env.get('FB_DATABASE'),
  restricted_package_name: Env.get('FB_RESTRICTED_PACKAGE_NAME')
}
