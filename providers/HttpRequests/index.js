'use strict'

const Request = require('request-promise')

class HttpRequest {
  constructor (Config) {
    this.Config = Config
  }

  async get (options) {
    return Request.get(options)
  }

  async post (options) {
    return Request.post(options)
  }

  async put (options) {
    return Request.put(options)
  }
}

module.exports = HttpRequest
