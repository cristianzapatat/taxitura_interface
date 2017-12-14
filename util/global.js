// File that contains the global elements
module.exports = {
  bots: {}, // Lista de bot de Facebook
  clients: {}, // Lista de los taxista
  positionsCab: {}, // Posicion del taxista cuando esta en servicio
  orders: {}, // Lista de servicios que llegan desde Facebook
  finishedOrders: {}, // Lista de servicios terminados
  ordersInForce: {}, // Lista de servicios en proceso
  ordersForCabman: {}, // Almacena el servicio en el que se encuentre un taxista
  pendingOrders: {}, // Lista de los servicios pendientes por taxista
  canceledOrders: {} // Lista de los servicios cancelados por taxista
}
