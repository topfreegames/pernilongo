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

const { Pool, Client } = require('pg')

//this should be changed to environment variables 
const pool = new Pool({
  user: 'root',
  host: 'localhost',
  database: 'mqtt',
  password: 'postgres',
  port: 5555,
});

//all redis stuff will be removed
//---------------
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
//---------------

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
  var PBKDF2Hash = (password.getPBKDF2Hash(pass)).split('$');
  var hashedPasswd = PBKDF2Hash[4];
  var salt = PBKDF2Hash[3];
  return pool.query("INSERT INTO mqtt_user (username, password, salt) VALUES ($1, $2, $3)", [user, hashedPasswd, salt]);
}

PernilongoService.prototype.registerPlayerAndAuthorizeInRooms = async function(user, pass, rooms){
  var PBKDF2Hash = (password.getPBKDF2Hash(pass)).split('$');
  var hashedPasswd = PBKDF2Hash[4];
  var salt = PBKDF2Hash[3];

  const client = await pool.connect();

  try {
    await client.query("BEGIN")
    await client.query("INSERT INTO mqtt_user (username, password, salt) VALUES ($1, $2, $3) RETURNING username", [user, hashedPasswd, salt])
    
    const queries = rooms.map((room) =>
      client.query({
        text: 'INSERT INTO mqtt_acl (allow, ipaddr, username, access, topic) VALUES (1, NULL, $1, $2, $3)',
        values: [user, 3, room],
      })
    );

    await Promise.all(queries);
    await client.query("COMMIT");
  }
  catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
  finally {
    client.release();
  }
}

PernilongoService.prototype.authorizePlayerInRooms = async function (user, rooms){
  
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN")
    
    const queries = rooms.map((room) =>
      client.query({
        text: 'INSERT INTO mqtt_acl (allow, ipaddr, username, access, topic) VALUES (1, NULL, $1, $2, $3)',
        values: [user, 3, room],
      })
    );

    await Promise.all(queries);
    await client.query("COMMIT");
  }
  catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
  finally {
    client.release();
  }
}

//todo
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

PernilongoService.prototype.unauthorizePlayerInRooms = async function(user, rooms){
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN")
    
    const queries = rooms.map((room) =>
      client.query({
        text: 'DELETE FROM mqtt_acl WHERE username = $1 AND topic = $2',
        values: [user, room],
      })
    );

    await Promise.all(queries);
    await client.query("COMMIT");
  }
  catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
  finally {
    client.release();
  }
}
