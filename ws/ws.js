const express = require('express')
const fs = require('fs')

var _global = require('../util/global')
const _fns = require('../util/functions')

var router = express.Router()

router.get('/gt', (req, res) => {
  res.status(200).send({
    bots: Object.keys(_global.bots).length,
    clients: Object.keys(_global.clients).length,
    cant: {
      orders: Object.keys(_global.orders).length,
      ordersInForce: Object.keys(_global.ordersInForce).length
    },
    positionsCab: _global.positionsCab,
    orders: _global.orders,
    ordersInForce: _global.ordersInForce,
    pendingOrders: _global.pendingOrders,
    canceledOrders: _global.canceledOrders
  })
})

router.get('/dlt', (req, res) => {
  _global.positionsCab = {}
  _global.orders = {}
  _global.ordersInForce = {}
  _global.pendingOrders = {}
  _global.canceledOrders = {}
  res.status(200).send({
    status: 'OK'
  })
})

router.get('/position_cabman/:order/:user', (req, res) => {
  let order = req.params.order
  let user = req.params.user
  if (order && user) {
    let service = _global.orders[order]
    let serviceInForce = _global.ordersInForce[user]
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
        _fns.redirectDefault(res)
      }
    }
  } else {
    _fns.redirectDefault(res)
  }
})

router.get('/img/:img/png', (req, res) => {
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

router.get('/json/:name', (req, res) => {
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

router.get('/get_services_canceled/:id', (req, res) => {
  let list = []
  if (req.params.id) {
    let servicesCanceled = _global.canceledOrders[req.params.id]
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

router.post('/get_current_position_cab/:user', (req, res) => {
  let user = req.params.user
  if (user) {
    let service = _global.ordersInForce[user]
    if (service) {
      let idCabman = service.cabman.id
      if (idCabman) {
        let positions = _global.positionsCab[idCabman]
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

module.exports = router
