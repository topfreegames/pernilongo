// pernilongo
// https://github.com/topfreegames/pernilongo
//
// Licensed under the MIT license:
// http://www.opensource.org/licenses/mit-license
// Copyright © 2016 Top Free Games <backend@tfgco.com>

const pomeloClient = require('./../pomeloClient')
const redis = require('redis')

const chai = require('chai')

// should style
global.should = require('chai').should()

// expect style
global.expect = require('chai').expect

// assert style
global.assert = require('chai').assert

require('blanket')

process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.LOG_LEVEL = 'none'

global.serversConfig = {
  connector: {
    host: '127.0.0.1',
    port: 3150,
    clientHost: '127.0.0.1',
    clientPort: 3010,
    frontend: true
  }
}

beforeEach(function (done) {
  const self = this
  self.pomeloClient = pomeloClient

  self.pomeloClient.init({
    host: global.serversConfig.connector.clientHost,
    port: global.serversConfig.connector.clientPort,
    player: {}
  }, () => {
    done()
  })
})

afterEach(function (done) {
  const self = this
  self.pomeloClient.disconnect()
  done()
})
