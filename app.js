'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
// const socket = require('./socket/main')
const clients = []

app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())

io.on('connection', socket => {
  console.log('cliente conectado\n')
  clients.push(socket.handshake.address)
  socket.emit('message', {
    cant_clients: clients.length,
    id_socekt: socket.id,
    remote_address: socket.handshake.address
  })
})

app.get('/get', (req, res) => {
  console.log(clients.length)
  res.status(200).send({
    cant: clients.length
  })
})

module.exports = server
