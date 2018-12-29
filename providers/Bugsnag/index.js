'use strict'

const BugsnagCli = use('@bugsnag/js')
const Logger = use('Logger')

class Bugsnag {
  constructor (Config) {
    this.config = Config.get('bugsnag')
    this.bugsnagCli = BugsnagCli(this.config.bugsnag_key)
    Logger.info('Bugsnag starting...')
  }

  info (msn, extraData = {}) {
    this.bugsnagCli.notify(
      `${msn} => ${JSON.stringify(extraData)}`,
      {
        severity: 'info',
        metaData: extraData
      }
    )
  }

  warning (msn, extraData = {}) {
    this.bugsnagCli.notify(
      `${msn} => ${JSON.stringify(extraData)}`,
      {
        severity: 'warning',
        metaData: extraData
      }
    )
  }

  error (msn, extraData = {}) {
    this.bugsnagCli.notify(
      `${msn} => ${JSON.stringify(extraData)}`,
      {
        severity: 'error',
        metaData: extraData
      }
    )
  }
}

module.exports = Bugsnag
