const app = require('./app')
const config = require('./config')

app.listen(config.port, () => {
  console.log(`server run in the port: ${config.port}`)
})
