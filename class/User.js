const fetch = require('node-fetch')

const _url = require('../util/url')
const _fns = require('../util/functions')

class User {
  makeRequest (resolve, fail, url, header) {
    if (!header) header = {}
    fetch(url, header)
      .then(response => {
        if (response.status >= 200 && response.status <= 299) {
          return response.json()
        } else {
          throw response.status
        }
      })
      .then(json => {
        resolve(json)
      })
      .catch(err => {
        fail(err)
      })
  }

  meService (token, resolve, fail) {
    this.makeRequest(resolve, fail, _url.meService, _fns.getMeService(token))
  }
}

module.exports = User
