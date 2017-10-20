'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

const consts = require('./constants/constants.js')

let bots = {}
let clients = {}
let orders = {}
let ordersInForce = {}

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
      ordersInForce[order.user.id] = order
      io.emit('app', order)
    }
  })

  socket.on('app', order => {
    if (order) {
      if (order.action === 'order') {
        if (orders[order.service.id].service.state === 0) {
          order.service.state = 1
          order['chanel'] = {
            socket: socket.id
          }
          orders[order.service.id] = order
          ordersInForce[order.user.id] = order
          getBot().emit('order', order)
          socket.emit('accept', order)
        }
      } else if (order.action === 'arrive') {
        if (orders[order.service.id].service.state === 1) {
          order.service.state = 2
          orders[order.service.id] = order
          ordersInForce[order.user.id] = order
          getBot().emit('arrive', order)
          socket.emit('arrive', order)
        }
      } else if (order.action === 'end') {
        if (orders[order.service.id].service.state === 2) {
          order.service.state = 3
          orders[order.service.id] = order
          delete ordersInForce[order.user.id]
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

  socket.on('getPositionBot', user => {
    console.log(user)
    if (user) {
      let service = ordersInForce[user.id]
      if (service) {
        let sock = clients[service.chanel.socket]
        if (sock) {
          sock.emit('getPositionApp', service)
        } else {
          socket.emit('returnPositionBot', {status: false}) // Socket off
        }
      } else {
        socket.emit('returnPositionBot', null)
      }
    }
  })

  socket.on('returnPositionApp', data => {
    console.log(data)
    let service = ordersInForce[data.user.id]
    if (service) {
      let startLoc = `${data.position.latitude},${data.position.longitude}`
      let endLoc = `${service.position_user.latitude},${service.position_user.longitude}`
      fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${startLoc}&destinations=${endLoc}&key=${consts.apiDistanceAndTime}&units=metric`)
        .then(res => {
          return res.json()
        })
        .then(json => {
          let response = {
            position_cabman: {
              distance: json,
              latitude: data.position.latitude,
              longitude: data.position.longitude
            },
            user: service.user
          }
          getBot().emit('returnPositionBot', {status: true, response})
        })
    } else {
      getBot().emit('returnPositionBot', null)
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
