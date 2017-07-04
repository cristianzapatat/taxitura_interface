'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

const bots = {}
const clients = {}

app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())

io.on('connection', socket => {
  clients[socket.handshake.address] = socket

  socket.emit('message', {
    connection: true,
    id_socekt: socket.id,
    remote_address: socket.handshake.address
  })

  socket.on('bot', data => {
    console.log('conexion de un bot')
    delete clients[socket.handshake.address]
    bots[socket.handshake.address] = socket
  })

  socket.on('taxitura', data => {
    if (data.accion === 'pedido') {
      io.emit('app', data)
    }
  })

  socket.on('app', data => {
    if (data) {
      if (data.action === 'order') {
        getBot().emit('order', data)
      } else if (data.action === 'arrive') {
        getBot().emit('arrive', data)
      }
    }
  })

  socket.on('disconnect', () => {
    if (clients[socket.handshake.address]) {
      delete clients[socket.handshake.address]
    }
    if (bots[socket.handshake.address]) {
      delete bots[socket.handshake.address]
    }
  })
})

app.get('/get', (req, res) => {
  res.status(200).send({
    bots: Object.keys(bots).length,
    clients: Object.keys(clients).length
  })
})

function getBot () {
  for (let index in bots) {
    return bots[index]
  }
}

module.exports = server
