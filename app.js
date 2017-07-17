'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

const bots = {}
const clients = {}
const orders = {}

app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())

io.on('connection', socket => {
  clients[socket.id] = socket

  socket.emit('message', {
    connection: true,
    id_socekt: socket.id,
    remote_address: socket.handshake.address
  })

  socket.on('bot', data => {
    delete clients[socket.id]
    bots[socket.id] = socket
  })

  socket.on('taxitura', order => {
    if (order.action === 'order') {
      order['id'] = new Date().getTime()
      order['state'] = 0
      orders[order.id] = order
      io.emit('app', order)
    }
  })

  socket.on('app', order => {
    if (order) {
      if (order.action === 'order') {
        if (orders[order.id].state === 0) {
          order.state = 1
          orders[order.id] = order
          // Cuando el taxista acepta el servicio,se le responde al mismo para que dibuje el servicio
          getBot().emit('order', order)
          socket.emit('accept', order)
        }
      } else if (order.action === 'arrive') {
        // quien llega al cliente debe ser igual que el que acepto
        if (orders[order.id].state === 1) {
          order.state = 2
          orders[order.id] = order
          getBot().emit('arrive', order)
        }
      } else if (order.action === 'end') {
        // quien finaliza servicio debe ser igual que los anteriores
        if (orders[order.id].state === 2) {
          order.state = 3
          orders[order.id] = order
          getBot().emit('end', order)
        }
      }
    }
  })

  socket.on('disconnect', () => {
    if (clients[socket.id]) {
      delete clients[socket.id]
    }
    if (bots[socket.id]) {
      delete bots[socket.id]
    }
  })
})

app.get('/get', (req, res) => {
  res.status(200).send({
    bots: Object.keys(bots).length,
    clients: Object.keys(clients).length,
    cant_orders: Object.keys(orders).length,
    orders: orders
  })
})

function getBot () {
  for (let index in bots) {
    return bots[index]
  }
}

module.exports = server
