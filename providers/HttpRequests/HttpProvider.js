const { ServiceProvider } = require('@adonisjs/fold')

class HttpProvider extends ServiceProvider {
  register () {
    this.app.singleton('Http/Request', () => {
      const Config = this.app.use('Adonis/Src/Config')

      return new (require('.'))(Config)
    })
  }
}

module.exports = HttpProvider
