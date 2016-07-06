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

const PernilongoService = function (mosquittoUrl, app, component) {
  this.mosquittoUrl = mosquittoUrl
  this.app = app
  this._component = component 
}

module.exports = function (mosquittoUrl, app, component) {
  var service = PernilongoService(mosquittoUrl, app, component)
  service.setupMqttClient()
  return service
}

PernilongoService.prototype.setupMqttClient = function (){
  var client = mqtt.connect(this.mosquittoUrl)
  client.on('connect', function() {
    logger.info('pernilongo mqttclient connected!')
  })
}

PernilongoService.prototype.registerPlayer = function (){
}

PernilongoService.prototype.permitPlayerInRooms = function (){
}

PernilongoService.prototype.denyPlayerInRooms = function(){
}
