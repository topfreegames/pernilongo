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

var MongoClient = require('mongodb').MongoClient,
  assert = require('assert');

const PernilongoService = function (mongoUrl, app, component) {
  this.mongoUrl = mongoUrl
  this.app = app
  this._component = component
}

module.exports = function (mongoUrl, app, component) {
  var service = new PernilongoService(mongoUrl, app, component)
  service.setupMongoClient()
  return service
}

PernilongoService.prototype.setupMongoClient = function (){

  var self = this;

  MongoClient.connect(this.mongoUrl, function(err, db) {
    assert.equal(null, err);
    self.users = bluebird.promisifyAll(db.collection('mqtt_user'));
    self.acl = bluebird.promisifyAll(db.collection('mqtt_acl'));
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
  var PBKDF2Hash = (password.getPBKDF2Hash(pass)).split('$');
  var hashedPass = PBKDF2Hash[4];
  var salt = PBKDF2Hash[3];

  var userDoc = {username: user, password: hashedPass, salt: salt};

  return this.users.insertOneAsync(userDoc);
}

PernilongoService.prototype.authorizePlayerInRooms = function (user, rooms){
  return this.acl.insertManyAsync(rooms.map(function(topic) {
    return {username: user, subscribe: topic};
  }));
}

PernilongoService.prototype.unauthorizePlayerInRooms = function(user, rooms){
  return this.acl.removeAsync({username: user, subscribe:{$in:rooms}});
}

PernilongoService.prototype.registerPlayerAndAuthorizeInRooms = function(user, pass, rooms){
  return this.registerPlayer(user, pass).
    then(() => this.authorizePlayerInRooms(user, rooms))
}

function timeout(expireTime) {
  return new Promise(resolve => setTimeout(resolve, expireTime));
}

//todo
PernilongoService.prototype.authorizePlayerInRoomsWithExpireTime = function (user, rooms, expireTime){
  await Promise.all(
    this.authorizePlayerInRooms(user, rooms),
    timeout(expireTime)
  );
  await this.unauthorizePlayerInRooms(user, rooms)
}

