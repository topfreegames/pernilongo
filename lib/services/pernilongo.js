// pernilongo
// https://github.com/topfreegames/pernilongo
//
// Licensed under the MIT license:
// http://www.opensource.org/licenses/mit-license
// Copyright © 2016 Top Free Games <backend@tfgco.com>

const request = require('request')
const url = require('url')
const mqtt = require('mqtt')
const logger = require('pomelo-logger').getLogger('pernilongo')

const PernilongoService = function (mosquittoUrl, mosquittoUser, mosquittoPass, app, component) {
  this.mosquittoUrl = mosquittoUrl
  this.mosquittoUser = mosquittoUser
  this.mosquittoPass = mosquittoPass
  this.app = app
  this._component = component 
}

module.exports = function (mosquittoUrl, mosquittoUser, mosquittoPass, app, component) {
  var service = new PernilongoService(mosquittoUrl, mosquittoUser, mosquittoPass, app, component)
  service.setupMqttClient()
  return service
}

PernilongoService.prototype.setupMqttClient = function (){
  this.client = mqtt.connect(this.mosquittoUrl, {username: this.mosquittoUser, password: this.mosquittoPass})

  client.on('connect', function() {
    logger.info('pernilongo mqttclient connected!')
  })

  client.on('reconnect', function() {
    logger.warn('pernilongo mqttclient disconnected, attempting reconnection!')
  })
}

PernilongoService.prototype.registerPlayer = function (){
}

PernilongoService.prototype.permitPlayerInRooms = function (){
}

PernilongoService.prototype.denyPlayerInRooms = function(){
}
