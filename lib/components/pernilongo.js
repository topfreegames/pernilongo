// pernilongo
// https://github.com/topfreegames/pernilongo
//
// Licensed under the MIT license:
// http://www.opensource.org/licenses/mit-license
// Copyright © 2016 Top Free Games <backend@tfgco.com>

const utils = require('pomelo/lib/util/utils')
const KublaiService = require('../services/pernilongo.js')
const PernilongoService = require('../services/pernilongo.js')

const Component = function (app, opts) {
  if (!opts.mongoUrl) {
    throw new Error('Could not load pernilongo since no mongo url was specified...')
  }
  this.app = app
  this.app.set('pernilongo', new PernilongoService(opts.mongoUrl, this.app, this))
}

Component.prototype.start = (cb) => {
  utils.invokeCallback(cb)
}

module.exports = function (app, opts) {
  return new Component(app, opts)
}
