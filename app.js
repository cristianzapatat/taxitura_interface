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

let bots = {} // Lista de bot de Facebook
let clients = {} // Lista de los taxista
let positionsCab = {} // Posicion del taxista cuando esta en servicio
let orders = {} // Lista de servicios que llegan desde Facebook
let finishedOrders = {} // Lista de servicios terminados
let ordersInForce = {} // Lista de servicios en proceso
let ordersForCabman = {} // Almacena el servicio en el que se encuentre un taxista
let pendingOrders = {} // Lista de los servicios pendientes por taxista
let canceledOrders = {} // Lista de los servicios cancelados por taxista

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
    savePositionCab(data.cabman.id, data.position_cabman)
  })

  socket.on('taxitura', order => {
    if (order.action === 'order') {
      fetch(consts.getGeocoding(order.position_user))
        .then(result => {
          console.log('el result----------------------------')
          return result.json()
        })
        .then(json => {
          console.log(json)
          order['service'] = { id: new Date().getTime() }
          let full = json.results[0].formatted_address
          let pos = full.split(',')
          order.position_user['addressFull'] = full
          order.position_user['address'] = `${pos[0]}, ${pos[1]}`
          orders[order.service.id] = order
          ordersInForce[order.user.id] = order
          io.emit('app', order)
        })
        .catch(err => {
          console.log('el errror')
          console.log(err)
        })
    }
  })

  socket.on('app', order => {
    if (order) {
      if (order.action === 'accept') {
        if (orders[order.service.id]) {
          if (orders[order.service.id].action === 'order') {
            orders[order.service.id] = order
            ordersInForce[order.user.id] = order
            ordersForCabman[order.cabman.id] = order.user.id
            getBot().emit('order', order)
            socket.emit('accept', order)
            savePositionCab(order.cabman.id, order.position_cabman)
            deleteServiceForAccept(order.service.id)
          } else { socket.emit('accept', null) }
        } else { socket.emit('accept', null) }
      } else if (order.action === 'arrive') {
        if (orders[order.service.id].action === 'accept') {
          orders[order.service.id] = order
          ordersInForce[order.user.id] = order
          savePositionCab(order.cabman.id, order.position_cabman)
          getBot().emit('arrive', order)
        }
      } else if (order.action === 'end') {
        if (orders[order.service.id].action === 'arrive') {
          finishedOrders[order.service.id] = order
          delete orders[order.service.id]
          delete ordersInForce[order.user.id]
          savePositionCab(order.cabman.id, order.position_cabman)
          getBot().emit('end', order)
        }
      }
    }
  })

  socket.on('acceptCancel', order => {
    if (order.action === 'order') {
      if (orders[order.service.id].action === 'order') {
        orders[order.service.id] = order
        ordersInForce[order.user.id] = order
        fetch(consts.getDistanceMatrix(order.position_cabman, order.position_user))
          .then(response => {
            return response.json()
          })
          .then(json => {
            order.position_cabman.distance = json.rows[0].elements[0].distance.value
            order.position_cabman.time = json.rows[0].elements[0].duration.value
            orders[order.service.id] = order
            ordersInForce[order.user.id] = order
            getBot().emit('order', order)
            socket.emit('orderCanceled', order)
          })
        savePositionCab(order.cabman.id, order.position_cabman)
        deleteServiceForAccept(order.service.id)
      } else {
        socket.emit('accept', null)
      }
    } else {
      socket.emit('accept', null)
    }
  })

  socket.on('serviceInMemory', id => {
    let idUser = ordersForCabman[id]
    let order = null
    if (idUser) {
      order = ordersInForce[idUser]
      if (!order) order = null
    }
    socket.emit('isServiceInMemory', order)
  })

  socket.on('nextService', idCabman => {
    if (pendingOrders[idCabman]) {
      let service = null
      for (let index in pendingOrders[idCabman]) {
        service = pendingOrders[idCabman][index]
        delete pendingOrders[idCabman][index]
        break
      }
      if (service) {
        socket.emit('app', service)
      }
    }
  })

  socket.on('addServiceList', order => {
    if (!pendingOrders[order.cabman.id]) {
      pendingOrders[order.cabman.id] = {}
    }
    pendingOrders[order.cabman.id][order.service.id] = order
  })

  socket.on('addServiceCanceled', order => {
    if (!canceledOrders[order.cabman.id]) {
      canceledOrders[order.cabman.id] = {}
    }
    canceledOrders[order.cabman.id][order.service.id] = order
  })

  socket.on('quality', quality => {
    let order = finishedOrders[quality.service.id]
    let message = ''
    if (order) {
      if (order.user.id === quality.user.id) {
        if (!order.quality) {
          finishedOrders[quality.service.id]['quality'] = quality
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
        let positions = positionsCab[service.cabman.id]
        if (positions) {
          if (positions.length >= 0) {
            let position = positions[positions.length - 1]
            fetch(consts.getDistanceMatrix(position, service.position_user))
              .then(res => {
                return res.json()
              })
              .then(json => {
                getBot().emit('returnPositionBot', {
                  status: true,
                  service: service.service,
                  position_cabman: {
                    distance: json.rows[0].elements[0].distance.value,
                    time: json.rows[0].elements[0].duration.value,
                    latitude: position.latitude,
                    longitude: position.longitude
                  },
                  user: service.user
                })
              })
          } else {
            socket.emit('returnPositionBot', {status: false, user: user})
          }
        } else {
          socket.emit('returnPositionBot', {status: false, user: user})
        }
      } else {
        socket.emit('returnPositionBot', {status: null, user: user})
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

app.get('/gt', (req, res) => {
  res.status(200).send({
    bots: Object.keys(bots).length,
    clients: Object.keys(clients).length,
    cant: {
      orders: Object.keys(orders).length,
      ordersInForce: Object.keys(ordersInForce).length,
      finishedOrders: Object.keys(finishedOrders).length
    },
    positionsCab,
    orders,
    ordersInForce,
    finishedOrders,
    pendingOrders,
    canceledOrders
  })
})

app.get('/dlt', (req, res) => {
  positionsCab = {}
  orders = {}
  finishedOrders = {}
  ordersInForce = {}
  pendingOrders = {}
  canceledOrders = {}
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
      if (service.service.id === serviceInForce.service.id) {
        let data = JSON.stringify({
          status: true,
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
        let data = JSON.stringify({
          status: false,
          user: null,
          cabman: null,
          service: { id: order }
        })
        res.render('positionCabman', {
          data
        })
      }
    } else {
      if (service) {
        let data = JSON.stringify({
          status: false,
          user: null,
          cabman: null,
          service: { id: order }
        })
        res.render('positionCabman', {
          data
        })
      } else {
        redirectDefault(res)
      }
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

app.get('/json/:name', (req, res) => {
  let name = req.params.name
  if (name) {
    let root = `./json/${name}.json`
    if (fs.existsSync(root)) {
      var json = fs.readFileSync(root, 'utf8')
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(json)
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('{}')
    }
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end('{}')
  }
})

app.get('/get_services_canceled/:id', (req, res) => {
  let list = []
  if (req.params.id) {
    let servicesCanceled = canceledOrders[req.params.id]
    if (servicesCanceled) {
      let cant = Object.keys(servicesCanceled).length
      if (cant > 0) {
        for (let index in servicesCanceled) {
          list.push(servicesCanceled[index])
        }
      }
    }
  }
  res.status(200).send(list)
})

app.post('/get_current_position_cab/:user', (req, res) => {
  let user = req.params.user
  if (user) {
    let service = ordersInForce[user]
    if (service) {
      let idCabman = service.cabman.id
      if (idCabman) {
        let positions = positionsCab[idCabman]
        if (positions) {
          if (positions.length > 0) {
            res.status(200).send({
              status: true,
              positions: positions[positions.length - 1]
            })
          } else {
            res.status(200).send({
              status: true,
              positions: null
            })
          }
        } else {
          res.status(200).send({
            status: true,
            positions: null
          })
        }
      } else {
        res.status(200).send({
          status: true,
          positions: null
        })
      }
    } else { // Service end
      res.status(200).send({
        status: false,
        positions: null
      })
    }
  }
  res.status(404).send({
    status: null,
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

function savePositionCab (id, position) {
  if (!positionsCab[id]) {
    positionsCab[id] = []
  }
  positionsCab[id].push({
    latitude: position.latitude,
    longitude: position.longitude
  })
}

function deleteServiceForAccept (idService) {
  for (let index in canceledOrders) {
    delete canceledOrders[index][idService]
  }
  for (let index in pendingOrders) {
    delete pendingOrders[index][idService]
  }
}

module.exports = server
