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
const password = require('../../lib/password')
const bluebird = require('bluebird')
const Promise = require('bluebird')

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

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
  this.redisClient = redis.createClient(this.redisUrl, {
    retry_strategy: function(options) {
      var r = Math.floor(Math.random() * 10) + 1
      var randomTime = 1000 * r
      logger.error("pernilongo retrying redis connection with time in ms", randomTime)
      return randomTime
    }
  })

  this.redisClient.on('connect', function(){
    logger.info('pernilongo redis client connected')
  })

  this.redisClient.on('reconnecting', function(){
    logger.warn('pernilongo lost connecting to redis, attempting reconnection...')
  })

}

PernilongoService.prototype.getRoom = function(gameId, roomId){
  return "chat/" + gameId + "/room/" + roomId
}

PernilongoService.prototype.getUser = function(gameId, userId){
  return gameId + ":" + userId
}

PernilongoService.prototype.getUserRoomAuthorization = function(gameId, userId, roomId) {
  return this.getUser(gameId, userId) + "-" + this.getRoom(gameId, roomId)
}

PernilongoService.prototype.registerPlayer = function (user, pass){
  if(!this.redisClient.connected) return Promise.reject(new Error('pernilongo redis client is not connected!'))
  return this.redisClient.setnxAsync(user, password.getPBKDF2Hash(pass))
}

PernilongoService.prototype.registerPlayerAndAuthorizeInRooms = function(user, pass, rooms){
  if(!this.redisClient.connected) return Promise.reject(new Error('pernilongo redis client is not connected!'))
  var multi = this.redisClient.multi()
  multi.setnx(user, password.getPBKDF2Hash(pass))
  for (var topic of rooms){
    multi.setnx(user + "-" + topic, 2)
  }
  return multi.execAsync()
}

PernilongoService.prototype.authorizePlayerInRooms = function (user, rooms){
  if(!this.redisClient.connected) return Promise.reject(new Error('pernilongo redis client is not connected!'))
  var multi = this.redisClient.multi()
  for (var topic of rooms){
    multi.setnx(user + "-" + topic, 2)
  }
  return multi.execAsync()
}

PernilongoService.prototype.authorizePlayerInRoomsWithExpireTime = function (user, rooms, expireTime){
  if(!this.redisClient.connected) return Promise.reject(new Error('pernilongo redis client is not connected!'))
  var multi = this.redisClient.multi()
  for (var topic of rooms){
    var key = user + "-" + topic
    multi.setnx(key, 2)
    multi.expire(key, expireTime)
  }
  return multi.execAsync()
}

PernilongoService.prototype.unauthorizePlayerInRooms = function(user, rooms){
  if(!this.redisClient.connected) return Promise.reject(new Error('pernilongo redis client is not connected!'))
  var multi = this.redisClient.multi()
  for (var topic of rooms){
    multi.del(user + "-" + topic)
  }
  return multi.execAsync()
}
