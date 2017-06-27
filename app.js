'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const socket = require('./socket/main')

app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())

app.get('/get', (req, res) => {
  res.status(200).send({
    'cant': socket.getCantCustomer
  })
})

module.exports = app
