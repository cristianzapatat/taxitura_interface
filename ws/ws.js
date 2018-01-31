/* eslint handle-callback-err: ["error", "error"] */
const express = require('express')
const fs = require('fs')
const fetch = require('node-fetch')

var _global = require('../util/global')
const _fns = require('../util/functions')
const _url = require('../util/url')

var router = express.Router()

router.get('/gt', (req, res) => {
  res.status(200).send({
    bots: Object.keys(_global.bots).length,
    clients: Object.keys(_global.clients).length,
    positionsCab: _global.positionsCab,
    canceledOrders: _global.canceledOrders
  })
})

router.get('/position_cabman/:idUser', (req, res) => {
  let id = req.params.idUser
  if (id) {
    fetch(_url.lastServiceUser(id))
      .then(response => {
        if (response.status >= 200 && response.status <= 299) {
          return response.json()
        } else {
          throw response.status
        }
      })
      .then(json => {
        if (json && json.length) {
          let order = json[0].info
          res.render('positionCabman', { data: JSON.stringify({
            status: true,
            user: {
              id: order.user.id,
              lat: order.position_user.latitude,
              lng: order.position_user.longitude
            },
            cabman: {
              name: order.cabman.name,
              lat: order.position_cabman.latitude,
              lng: order.position_cabman.longitude
            } }) })
        } else {
          res.render('positionCabman', { data: JSON.stringify({
            status: false,
            user: null,
            cabman: null
          }) })
        }
      })
      .catch(err => {
        _fns.redirectDefault(res)
      })
  } else {
    _fns.redirectDefault(res)
  }
})

router.get('/get_current_position_cab/:idUser', (req, res) => {
  let id = req.params.idUser
  if (id) {
    fetch(_url.lastServiceUser(id))
      .then(response => {
        if (response.status >= 200 && response.status <= 299) {
          return response.json()
        } else {
          throw response.status
        }
      })
      .then(json => {
        if (json && json.length) {
          let order = json[0].info
          let idCabman = order.cabman.id
          if (idCabman) {
            let positions = _global.positionsCab[idCabman]
            if (positions) {
              if (positions.length > 0) {
                res.status(200).send({ status: true, positions: positions[positions.length - 1] })
              } else {
                res.status(200).send({ status: true, positions: null, cause: 'there aren\'t positions' })
              }
            } else {
              res.status(200).send({ status: true, positions: null, cause: 'positions are nulls' })
            }
          } else {
            res.status(200).send({ status: true, positions: null, cause: 'there aren\'t idCabman' })
          }
        } else {
          res.status(200).send({ status: false, positions: null, cause: 'json is null' })
        }
      })
      .catch(err => {
        res.status(500).send({ status: null, positions: null, err: JSON.stringify(err) })
      })
  } else {
    res.status(404).send({ status: null, positions: null })
  }
})

router.get('/img/:img/png', (req, res) => {
  let name = req.params.img
  let image = null
  if (name) {
    let root = `./img/${name}.png`
    if (fs.existsSync(root)) {
      image = fs.readFileSync(root)
    } else {
      image = fs.readFileSync(`./img/taxitura.png`)
    }
  } else {
    image = fs.readFileSync(`./img/taxitura.png`)
  }
  res.writeHead(200, { 'Content-Type': 'image/png' })
  res.end(image, 'binary')
})

router.get('/json/:name', (req, res) => {
  let name = req.params.name
  var json = {}
  if (name) {
    let root = `./json/${name}.json`
    if (fs.existsSync(root)) {
      json = fs.readFileSync(root, 'utf8')
    }
  }
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(json)
})

router.get('/get_services_canceled/:id', (req, res) => { // TODO consumir servicio del API
  // let list = []
  // if (req.params.id) {
  //   let servicesCanceled = _global.canceledOrders[req.params.id]
  //   if (servicesCanceled) {
  //     let cant = Object.keys(servicesCanceled).length
  //     if (cant > 0) {
  //       for (let index in servicesCanceled) {
  //         list.push(servicesCanceled[index])
  //       }
  //     }
  //   }
  // }
  // res.status(200).send(list)
})

module.exports = router
