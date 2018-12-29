'use strict'

/*
|--------------------------------------------------------------------------
| Google Configuaration
|--------------------------------------------------------------------------
|
|
*/

const Env = use('Env')

module.exports = {
  key_geocoding: Env.get('G_KEY_GEOCODING'),
  key_distanceMatrix: Env.get('G_KEY_DISTANCE_MATRIX'),
  key_directions: Env.get('G_KEY_DIRECTIONS')
}
