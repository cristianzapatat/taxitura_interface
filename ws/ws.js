/* eslint handle-callback-err: ["error", "error"] */
const express = require('express')
const fs = require('fs')

var _global = require('../util/global')
const _fns = require('../util/functions')
const _kts = require('../util/kts')
const _script = require('../db/script')

var Service, db

var router = express.Router()

router.get('/gt', (req, res) => {
  let ids = []
  for (let index in _global.clients) {
    ids.push(index + ' ' + _global.clients[index].id)
  }
  let schudeles
  for (let index in _global.schedules) {
    schudeles.push(index)
  }
  res.status(200).send({
    bots: Object.keys(_global.bots).length,
    clients: Object.keys(_global.clients).length,
    clientsIds: ids,
    schedules: schudeles
  })
})

router.get('/isInternet', (req, res) => {
  res.status(200).send({status: true})
})

router.get('/service_fact_today/:idDriver', (req, res) => {
  let idDriver = req.params.idDriver
  if (idDriver) {
    Service.getCantServicesDayDriver(idDriver,
      json => res.status(200).send({id: idDriver, cant: json.length}),
      err => res.status(404).send({id: idDriver, cant: 0}))
  } else {
    res.status(404).send({id: idDriver, cant: 0})
  }
})

router.get('/position_cabman/:idUser', (req, res) => {
  let id = req.params.idUser
  if (id) {
    Service.getLastServiceUser(id,
      json => {
        if (json && json.length) {
          let order = json[0].info
          let action = order.action === _kts.action.accept || order.action === _kts.action.arrive
          let cabman = {
            name: order.cabman.name,
            lat: order.position_cabman.latitude,
            lng: order.position_cabman.longitude
          }
          db.all(_script.select.position_last_cabman, [order.cabman.id], (err, rows) => {
            if (err) _fns.redirectDefault(res)
            else if (rows && rows.length > 0) {
              cabman = {
                name: order.cabman.name,
                lat: rows[0].latitude,
                lng: rows[0].longitude
              }
              res.render('positionCabman', {
                data: JSON.stringify({
                  status: true,
                  action,
                  user: {
                    id: order.user.id,
                    lat: order.position_user.latitude,
                    lng: order.position_user.longitude
                  },
                  cabman
                }),
                action
              })
            } else {
              res.render('positionCabman', {
                action: true,
                data: JSON.stringify({
                  status: false,
                  user: null,
                  cabman: null
                })
              })
            }
          })
        } else {
          res.render('positionCabman', {
            action: true,
            data: JSON.stringify({
              status: false,
              user: null,
              cabman: null
            })
          })
        }
      },
      err => _fns.redirectDefault(res))
  } else {
    _fns.redirectDefault(res)
  }
})

router.get('/get_current_position_cab/:idUser', (req, res) => {
  let id = req.params.idUser
  if (id) {
    Service.getLastServiceUser(id,
      json => {
        if (json && json.length) {
          let order = json[0].info
          let idCabman = order.cabman.id
          if (idCabman) {
            db.all(_script.select.position_last_cabman, [order.cabman.id], (err, rows) => {
              if (err) res.status(500).send({ status: null, data: null, err: JSON.stringify(err) })
              else if (rows && rows.length > 0) {
                res.status(200).send({
                  status: true,
                  data: rows[0],
                  action: order.action === _kts.action.accept || order.action === _kts.action.arrive
                })
              } else {
                res.status(200).send({ status: true, data: null, cause: 'there aren\'t positions' })
              }
            })
          } else {
            res.status(200).send({ status: true, data: null, cause: 'there aren\'t idCabman' })
          }
        } else {
          res.status(200).send({ status: false, data: null, cause: 'json is null' })
        }
      },
      err => res.status(500).send({ status: null, data: null, err: JSON.stringify(err) }))
  } else {
    res.status(404).send({ status: null, data: null })
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
  res.writeHead(200, {'Content-Type': 'image/png'})
  res.end(image, 'binary')
})

router.get('/json/:name', (req, res) => {
  let name = req.params.name
  var json = {}
  if (name) {
    let root = `./json/${name}.json`
    if (fs.existsSync(root)) json = fs.readFileSync(root, 'utf8')
  }
  res.writeHead(200, {'Content-Type': 'application/json'})
  res.end(json)
})

router.get('/get_services_canceled/:idDriver', (req, res) => {
  let idDriver = req.params.idDriver
  if (idDriver) {
    db.all(_script.select.service_cabman, [idDriver], (err, rows) => {
      if (err) res.status(500).send([])
      else if (rows && rows.length > 0) {
        let array = []
        for (var i = 0; i < rows.length; i++) {
          array.push(parseInt(rows[i].service))
        }
        Service.getMultipleServices(array,
          json => {
            let list = []
            if (json && json.length > 0) {
              json = JSON.parse(`[${json.toString().replace(/"=>/g, '":')}]`)
              for (var i = 0; i < json.length; i++) {
                list.push(json[i].info)
              }
            }
            res.status(200).send(list)
          },
          err => res.status(404).send([]))
      } else {
        res.status(200).send([])
      }
    })
  } else {
    res.status(404).send([])
  }
})

module.exports = {
  router,
  setService: (service) => {
    Service = service
  },
  setDb: (database) => {
    db = database
  }
}
