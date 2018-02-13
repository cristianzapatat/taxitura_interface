module.exports = {
  create: {
    table: {
      position: 'CREATE TABLE IF NOT EXISTS position (id INTEGER PRIMARY KEY AUTOINCREMENT, cabman INTEGER, service INTEGER, action TEXT, latitude DOUBLE, longitude DOUBLE, date TEXT)',
      service: 'CREATE TABLE IF NOT EXISTS service (id INTEGER PRIMARY KEY AUTOINCREMENT, cabman INTEGER, service INTEGER, status INT, cabman_accept INTEGER)'
    }
  },
  insert: {
    position: 'INSERT INTO position (cabman, service, action, latitude, longitude, date) VALUES (?, ?, ?, ?, ?, ?)',
    service: 'INSERT INTO service (cabman, service, status, cabman_accept) VALUES (?, ?, 0, "")'
  },
  update: {
    service_status: 'UPDATE service SET status = 1, cabman_accept = ? WHERE status = 0 AND service = ?'
  },
  select: {
    position_last_cabman: 'SELECT cabman, service, action, latitude, longitude FROM position WHERE cabman = ? ORDER BY id DESC LIMIT 1',
    service_cabman: 'SELECT service FROM service WHERE status = 0 AND cabman = ?'
  }
}
