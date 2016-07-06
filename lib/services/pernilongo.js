// pernilongo
// https://github.com/topfreegames/pernilongo
//
// Licensed under the MIT license:
// http://www.opensource.org/licenses/mit-license
// Copyright © 2016 Top Free Games <backend@tfgco.com>

const request = require('request')
const url = require('url')
const logger = require('pomelo-logger').getLogger('pernilongo')
const redis = require('redis')

const PernilongoService = function (redisUrl, app, component) {
  this.redisUrl = redisUrl
  this.app = app
  this._component = component 
}

module.exports = function (redisUrl, app, component) {
  var service = new PernilongoService(redisUrl, app, component)
  service.setupRedisClient()
  return service
}

PernilongoService.prototype.setupRedisClient = function (){
  this.redisClient = redis.createClient(this.redisUrl) 

  this.redisClient.on('connect', function(){
    logger.info('pernilongo redis client connected')
  })

  this.redisClient.on('reconnecting', function(){
    logger.info('pernilongo lost connecting to redis, attempting reconnection...')
  })

}

PernilongoService.prototype.registerPlayer = function (user, pass){
  this.redisClient.set(user, )
}

PernilongoService.prototype.permitPlayerInRooms = function (user, rooms){
}

PernilongoService.prototype.denyPlayerInRooms = function(user, rooms){
}
