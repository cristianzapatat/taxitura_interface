/* eslint handle-callback-err: ["error", "error"] */
const express = require('express')
const path = require('path')
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser')
const stompit = require('stompit')
const sqlite3 = require('sqlite3').verbose()

const WS = require('./ws/ws')
const _kts = require('./util/kts')
const _fns = require('./util/functions')
const _config = require('./config')
const _script = require('./db/script')

const ServiceClass = require('./class/Service')
const Service = new ServiceClass()

const QueueClass = require('./class/Queue')
var Queue = null

const app = express()
app.set(_kts.config.views, path.join(__dirname, _kts.config.views))
app.engine(_kts.config.hbsPoint, exphbs({extname: _kts.config.hbsPoint}))
app.set(_kts.config.viewEngine, _kts.config.hbs)

const server = require('http').Server(app)
const socketClient = require('socket.io')(server, {
  path: '/client',
  pingInterval: 4000,
  pingTimeout: 1000,
  cookie: false
})
const socketBot = require('socket.io')(server, {
  path: '/bot',
  pingInterval: 3000,
  pingTimeout: 1000,
  cookie: false
})

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

let db = new sqlite3.Database('./db/interface.db', (err) => {
  if (err) console.error('err connected database', err)
  else {
    console.log('Connected to the interface database.')
    db.serialize(() => {
      db.run(_script.create.table.position, (err) => {
        if (err) console.error('err table position', err)
        else console.log(`Table position created`)
      })
      db.run(_script.create.table.service, (err) => {
        if (err) console.error('err table service', err)
        else console.log(`Table service_cancel created`)
      })
      db.run(_script.create.table.orders, (err) => {
        if (err) console.error('err table service', err)
        else console.log(`Table orders created`)
      })
    })
  }
})

stompit.connect({host: _config.hostQueue, port: _config.portQueue}, (err, client) => {
  if (!err) {
    Queue = new QueueClass(client)
    socketClient.on(_kts.socket.connection, socket => {
      require('./socket/client')(socket, socketClient, Service, db)
    })
    socketBot.on(_kts.socket.connection, socket => {
      require('./socket/bot')(socket, Queue, Service, db)
    })
    require('./queue')(Queue, Service, socketClient, db)
  } else { // TODO definir que hacer
    console.log(err)
  }
})

WS.setService(Service)
WS.setDb(db)
app.use('/', WS.router)

app.use((req, res, next) => _fns.redirectDefault(res))

module.exports = server
