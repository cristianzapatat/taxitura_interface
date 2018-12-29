'use strict'

const Admin = use('firebase-admin')
const Logger = use('Logger')

class Firebase {
  constructor (Config) {
    this.config = Config.get('firebase')
    Admin.initializeApp({
      credential: Admin.credential.cert({
        projectId: this.config.project_id,
        clientEmail: this.config.client_email,
        privateKey: this.config.private_key
      }),
      databaseURL: `https://${this.config.database}.firebaseio.com`
    })
    this.firebase = Admin.app()
    Logger.info('Init firebase...')
  }

  async sendMessageBroadcast (topic = null, body = null) {
    if (topic && body) {
      const message = {
        android: {
          priority: 'normal',
          restrictedPackageName: this.config.restricted_package_name,
          collapseKey: `${this.config.restricted_package_name}.${Date.now()}`
        },
        data: {
          order: JSON.stringify(body)
        },
        topic
      }
      this.firebase.messaging().send(message)
        .then(response => {
          // Logger.info(`Success send message to topic '${topic}'`, { response })
        })
        .catch(err => {
          Logger.warning(`Unabled send message to topic '${topic}'`, { err })
        })
    }
  }

  async sendMessageUser (token = null, body = null) {
    if (token && body) {
      const message = {
        android: {
          priority: 'high',
          restrictedPackageName: this.config.restricted_package_name,
          collapseKey: `${this.config.restricted_package_name}.${Date.now()}`
        },
        data: {
          order: JSON.stringify(body)
        },
        token
      }
      this.firebase.messaging().send(message)
        .then(response => {
          // Logger.info(`Success send message to token '${token}'`, { response })
        })
        .catch(err => {
          Logger.warning(`Unabled send message to token '${token}'`, { err })
        })
    }
  }
}

module.exports = Firebase
