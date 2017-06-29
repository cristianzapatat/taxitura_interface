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

  socket.on('_bot', data => {
    delete clients[socket.handshake.address]
    bots[socket.handshake.address] = socket
  })

  socket.on('taxitura', data => {
    data['server'] = 'taxitura'
    socket.emit('message', data)
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

module.exports = server
