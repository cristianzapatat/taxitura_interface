module.exports = {
  create: {
    table: {
      position: 'CREATE TABLE IF NOT EXISTS position (id INTEGER PRIMARY KEY AUTOINCREMENT, cabman INTEGER, service INTEGER, action TEXT, latitude DOUBLE, longitude DOUBLE, date TEXT)',
      service: 'CREATE TABLE IF NOT EXISTS service (id INTEGER PRIMARY KEY AUTOINCREMENT, cabman INTEGER, service INTEGER, status INT, cabman_accept INTEGER)',
      orders: 'CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT, user INTEGER, cabman INTEGER, service INTEGER, status INTEGER)'
    }
  },
  insert: {
    position: 'INSERT INTO position (cabman, service, action, latitude, longitude, date) VALUES (?, ?, ?, ?, ?, ?)',
    service: 'INSERT INTO service (cabman, service, status, cabman_accept) VALUES (?, ?, 0, "")',
    order: 'INSERT INTO orders (user, cabman, service, status) VALUES (?, ?, ?, 0)'
  },
  update: {
    service_status: 'UPDATE service SET status = 1, cabman_accept = ? WHERE status = 0 AND service = ?',
    orderByCabman: 'UPDATE orders SET status = 1 WHERE status = 0 AND cabman = ?',
  },
  select: {
    position_last_cabman: 'SELECT cabman, service, action, latitude, longitude FROM position WHERE cabman = ? ORDER BY id DESC LIMIT 1',
    service_cabman: 'SELECT service FROM service WHERE status = 0 AND cabman = ?',
    orderByService: 'SELECT user, service FROM orders WHERE service = ? LIMIT 1',
    orderByCabman: 'SELECT service, COUNT(id) AS cant FROM orders WHERE cabman = ? AND status = 0 GROUP BY service HAVING cant <= 1',
  },
  delete: {
    service: 'DELETE FROM service WHERE service = ?',
    orderByUser: 'DELETE FROM orders WHERE user = ?',
    orderByService: 'DELETE FROM orders WHERE service = ?'
  }
}