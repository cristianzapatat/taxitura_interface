const { ServiceProvider } = require('@adonisjs/fold')

class FirebaseProvider extends ServiceProvider {
  register () {
    this.app.singleton('Firebase', () => {
      const Config = this.app.use('Adonis/Src/Config')

      return new (require('.'))(Config)
    })
  }
}

module.exports = FirebaseProvider
