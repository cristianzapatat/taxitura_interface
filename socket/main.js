'use strict'

const net = require('net')
const config = require('../config')

const clients = {}
const clientsTemp = {}
const pedidos = []
const bot = []

net.createServer(socket => {
  console.log('#####--Customer Connected--######')
  if (bot.length === 0) {
    socket.name = socket.remoteAddress + ':' + socket.remotePort
    bot.push(socket)
    console.log(bot.length)
  }
  clients[socket.remoteAddress + ':' + socket.remotePort] = socket
  console.log(Object.keys(clients).length)
  socket.write('{"mensaje":"conectado"}')
  socket.on('data', (data) => {
    takeDecision(data, socket)
  })
  socket.on('end', () => {
    deleteCustomer(socket)
  })
}).listen(config.portSocket)

function takeDecision (data, customer) {
  console.log('Customer\'s message: ' + data)
  let dataToRobot = data
  data = JSON.parse(data)
  let idUser = data['fb_id']
  switch (data['accion']) {
    case 'aceptarpedido':
      if (pedidos[idUser] != null) {
        pedidos[idUser] = null
        sendMessageBot(dataToRobot)
      } else {
        sendMessage('El servicio ya fue aceptado', customer)
      }
      break
    case 'pedido':
      console.log('pedido')
      pedidos[idUser] = data
      data = data['accion'] + '|...|' + data['longitud'] + '|...|' +
        data['latitud'] + '|...|' + data['fb_id'] + '|...|' +
        data['url_pic'] + '|...|' + data['nombre']
      selectCabman(data)
      break
    case 'registrarcustomer':
      customer.name = customer.remoteAddress + ':' + customer.remotePort
      clients[data['id_taxista']] = customer
      clientsTemp[customer] = data['id_taxista']
      customer.write('{"mensaje":"conectado"}')
      break
  }
}

function sendMessageBot (message) {
  bot[0].write(message)
}

function selectCabman (message) {
  for (let indice in clients) {
    clients[indice].write(message)
  }
  process.stdout.write(message)
}

function deleteCustomer (customer) {
  customer.name = customer.remoteAddress + ':' + customer.remotePort
  let id = clientsTemp[customer]
  delete clientsTemp[customer]
  delete clients[id]
}

function sendMessage (message, customer) {
  customer.write(message)
}

function getCantCustomer () {
  return Object.keys(clients).length
}

console.log(`The server is listening on port ${config.portSocket}\n`)
console.log(Object.keys(clients).length)
console.log(net)

module.exports = {
  getCantCustomer
}
