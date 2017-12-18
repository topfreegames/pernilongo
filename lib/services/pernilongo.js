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
const MongoClient = require('mongodb').MongoClient

const PernilongoService = function (mongoUrl, app, component) {
  this.mongoUrl = mongoUrl
  this.app = app
  this._component = component
  this.connecting = false
}

module.exports = function (mongoUrl, app, component) {
  const service = new PernilongoService(mongoUrl, app, component)
  service.setupMongoClient()
  return service
}

PernilongoService.prototype.setupMongoClient = function (){
  const self = this
  if (this.connecting) {
    return
  }
  this.connecting = true

  MongoClient.connect(this.mongoUrl,
    { reconnectInterval: 2000, reconnectTries: Infinity }, function(err, db) {
    self.connecting = false
    if (err) {
      // TODO: Do something
      return
    }
    self.users = bluebird.promisifyAll(db.collection('mqtt_user'))
    self.acl = bluebird.promisifyAll(db.collection('mqtt_acl'))
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
  const PBKDF2Hash = (password.getPBKDF2Hash(pass)).split('$');
  const hashedPass = PBKDF2Hash[4];
  const salt = PBKDF2Hash[3];

  if (!this.users) {
    this.setupMongoClient()
    return Promise.resolve()
  }
  return this.users.updateOneAsync({username: user}, {$set: {username: user, password: hashedPass, salt: salt}}, {upsert: true});
}

PernilongoService.prototype.authorizePlayerInRooms = function (user, rooms){
  if (!this.acl) {
    this.setupMongoClient()
    return Promise.resolve()
  }
  const bulk = this.acl.initializeUnorderedBulkOp({useLegacyOps: true})
  rooms.forEach(function(topic) {
    bulk.find({username: user, pubsub: topic}).upsert().update({$set: {username: user, pubsub: [topic]}})
  })
  if (!!rooms && rooms.length > 0) {
    return bulk.execute()
  }
  return Promise.resolve()
}

PernilongoService.prototype.unauthorizePlayerInRooms = function(user, rooms){
  if (!this.acl) {
    this.setupMongoClient()
    return Promise.resolve()
  }
  return this.acl.removeAsync({username: user, pubsub:{$in:rooms}})
}

PernilongoService.prototype.registerPlayerAndAuthorizeInRooms = function(user, pass, rooms){
  return this.registerPlayer(user, pass).
    then(() => this.authorizePlayerInRooms(user, rooms))
}

PernilongoService.prototype.authorizePlayerInRoomsWithExpireTime = function (user, rooms, expireTime){
  if (!this.acl) {
    this.setupMongoClient()
    return Promise.resolve()
  }
  const bulk = this.acl.initializeUnorderedBulkOp({useLegacyOps: true})
  rooms.forEach(function(topic) {
    bulk.find({username: user, pubsub: topic}).upsert().update({$set: {username: user, pubsub: [topic], expires: new Date(Date.now() + 1000*expireTime)}});
  })
  if (!!rooms && rooms.length > 0) {
    return bulk.execute()
  }
  return bulk.execute()
}

