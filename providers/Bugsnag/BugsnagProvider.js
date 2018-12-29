const { ServiceProvider } = require('@adonisjs/fold')

class BugsnagProvider extends ServiceProvider {
  register () {
    this.app.singleton('Bugsnag', () => {
      const Config = this.app.use('Adonis/Src/Config')

      return new (require('.'))(Config)
    })
  }
}

module.exports = BugsnagProvider
