'use strict'

const express = require('express')
const fs = require('fs')
const path = require('path')
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')

const app = express()
app.set('views', path.join(__dirname, 'views'))
app.engine('.hbs', exphbs({extname: '.hbs'}))
app.set('view engine', 'hbs')

const server = require('http').Server(app)
const io = require('socket.io')(server)

const consts = require('./constants/constants.js')

let bots = {}
let clients = {}
let positionsCab = {}
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

  socket.on('savePositionCab', data => {
    positionsCab[data.cabman.id] = {
      position_cabman: data.position_cabman
    }
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
          delete positionsCab[order.cabman.id]
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
    if (user) {
      let service = ordersInForce[user.id]
      if (service) {
        if (service.chanel) {
          let sock = clients[service.chanel.socket]
          if (sock) {
            sock.emit('getPositionApp', service)
          } else {
            socket.emit('returnPositionBot', {status: false, sock: false, user: service.user}) // Socket off
          }
        } else {
          socket.emit('returnPositionBot', {status: false, sock: true, user: user})
        }
      } else {
        socket.emit('returnPositionBot', {status: null, sock: false, user: user})
      }
    }
  })

  socket.on('returnPositionApp', data => {
    let service = ordersInForce[data.user.id]
    if (service) {
      let startLoc = `${data.position.latitude},${data.position.longitude}`
      let endLoc = `${service.position_user.latitude},${service.position_user.longitude}`
      fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${startLoc}&destinations=${endLoc}&key=${consts.apiDistanceAndTime}&units=metric`)
        .then(res => {
          return res.json()
        })
        .then(json => {
          positionsCab[service.cabman.id] = {
            position_cabman: {
              latitude: data.position.latitude,
              longitude: data.position.longitude
            }
          }
          getBot().emit('returnPositionBot', {
            status: true,
            service: service.service,
            position_cabman: {
              distance: json,
              latitude: data.position.latitude,
              longitude: data.position.longitude
            },
            user: service.user
          })
        })
    } else {
      getBot().emit('returnPositionBot', {status: null, sock: false, user: data.user})
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
    orders: orders,
    ordersInForce: ordersInForce,
    positionsCab: positionsCab
  })
})

app.get('/delete', (req, res) => {
  orders = {}
  ordersInForce = {}
  positionsCab = {}
  res.status(200).send({
    status: 'OK'
  })
})

app.get('/position_cabman/:order/:user', (req, res) => {
  let order = req.params.order
  let user = req.params.user
  if (order && user) {
    let service = orders[order]
    let serviceInForce = ordersInForce[user]
    if (service && serviceInForce) {
      let data = JSON.stringify({
        user: {
          id: serviceInForce.user.id,
          lat: serviceInForce.position_user.latitude,
          lng: serviceInForce.position_user.longitude
        },
        cabman: {
          name: serviceInForce.cabman.name,
          lat: serviceInForce.position_cabman.latitude,
          lng: serviceInForce.position_cabman.longitude
        },
        service: {
          id: order
        }
      })
      res.render('positionCabman', {
        data: data
      })
    } else {
      redirectDefault(res)
    }
  } else {
    redirectDefault(res)
  }
})

app.get('/img/:img/png', (req, res) => {
  let name = req.params.img
  if (name) {
    let root = `./img/${name}.png`
    if (fs.existsSync(root)) {
      var img = fs.readFileSync(root)
      res.writeHead(200, { 'Content-Type': 'image/png' })
      res.end(img, 'binary')
    } else {
      var image = fs.readFileSync(`./img/taxitura.png`)
      res.writeHead(200, { 'Content-Type': 'image/png' })
      res.end(image, 'binary')
    }
  } else {
    var imgg = fs.readFileSync(`./img/taxitura.png`)
    res.writeHead(200, { 'Content-Type': 'image/png' })
    res.end(imgg, 'binary')
  }
})

app.post('/get_position_cab/:user', (req, res) => {
  let user = req.params.user
  if (user) {
    let service = ordersInForce[user]
    if (service) {
      let idCabman = service.cabman.id
      if (idCabman) {
        let positions = positionsCab[idCabman]
        if (positions) {
          res.status(200).send({
            positions
          })
        }
      }
    }
  }
  res.status(404).send({
    positions: null
  })
})

app.use((req, res, next) => {
  redirectDefault(res)
})

function getBot () {
  for (let index in bots) {
    return bots[index]
  }
}

function redirectDefault (res) {
  res.redirect('https://www.facebook.com/taxitura/')
}

module.exports = server
