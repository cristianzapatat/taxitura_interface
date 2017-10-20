'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

let bots = {}
let clients = {}
let orders = {}

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
      order['service'] = {
        id: new Date().getTime(),
        state: 0
      }
      orders[order.service.id] = order
      io.emit('app', order)
    }
  })

  socket.on('app', order => {
    if (order) {
      if (order.action === 'order') {
        if (orders[order.service.id].service.state === 0) {
          order.service.state = 1
          orders[order.service.id] = order
          getBot().emit('order', order)
          socket.emit('accept', order)
        }
      } else if (order.action === 'arrive') {
        if (orders[order.service.id].service.state === 1) {
          order.service.state = 2
          orders[order.service.id] = order
          getBot().emit('arrive', order)
          socket.emit('arrive', order)
        }
      } else if (order.action === 'end') {
        if (orders[order.service.id].service.state === 2) {
          order.service.state = 3
          orders[order.service.id] = order
          getBot().emit('end', order)
        }
      }
    }
  })

  socket.on('quality', quality => {
    let order = orders[quality.service.id]
    let message = ''
    if (order) {
      if (order.user.id === quality.user.id) {
        if (!order.quality) {
          orders[quality.service.id]['quality'] = quality
          message = 'Gracias por calificar el servicio'
        } else {
          message = 'El servicio ya recibio una calificación previa'
        }
      } else {
        message = 'El servicio que está calificando pertenece a otro usuario'
      }
    } else {
      message = 'El servicio no está disponible para calificar'
    }
    let response = {
      user: { id: quality.user.id },
      message
    }
    socket.emit('quality', response)
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

app.get('/delete', (req, res) => {
  orders = {}
  res.status(200).send({
    status: 'OK'
  })
})

function getBot () {
  for (let index in bots) {
    return bots[index]
  }
}

module.exports = server
