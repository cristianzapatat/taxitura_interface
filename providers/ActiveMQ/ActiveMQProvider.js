const { ServiceProvider } = require('@adonisjs/fold')

class ActiveMQProvider extends ServiceProvider {
  register () {
    this.app.singleton('ActiveMQ', () => {
      const Config = this.app.use('Adonis/Src/Config')

      return new (require('.'))(Config)
    })
  }
}

module.exports = ActiveMQProvider
