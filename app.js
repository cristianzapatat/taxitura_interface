/* eslint handle-callback-err: ["error", "error"] */
const express = require('express')
const path = require('path')
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser')
const stompit = require('stompit')

const WS = require('./ws/ws')
const _kts = require('./util/kts')
const _fns = require('./util/functions')
const _config = require('./config')

const ServiceClass = require('./class/service')
const Service = new ServiceClass()

const QueueClass = require('./class/Queue')
var Queue = null

const app = express()
app.set(_kts.config.views, path.join(__dirname, _kts.config.views))
app.engine(_kts.config.hbsPoint, exphbs({extname: _kts.config.hbsPoint}))
app.set(_kts.config.viewEngine, _kts.config.hbs)

const server = require('http').Server(app)
const io = require('socket.io')(server)

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

stompit.connect({host: _config.hostQueue, port: _config.portQueue}, (err, client) => {
  if (!err) {
    Queue = new QueueClass(client)
    io.on(_kts.socket.connection, socket => {
      require('./socket')(socket, io, Queue, Service)
    })
    require('./queue')(Queue, Service, io)
  } else {
    console.log(err)
  }
})

app.use('/', WS)

app.use((req, res, next) => {
  _fns.redirectDefault(res)
})

module.exports = server
