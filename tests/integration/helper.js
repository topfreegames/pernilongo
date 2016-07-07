// pernilongo
// https://github.com/topfreegames/pernilongo
//
// Licensed under the MIT license:
// http://www.opensource.org/licenses/mit-license
// Copyright © 2016 Top Free Games <backend@tfgco.com>

require('./common')

const e = module.exports

e.registerPlayer = function(client, user, pass, cb){
  var reqRoute = 'connector.entryHandler.registerPlayer'
  var payload = {
    user: user,
    pass: pass
  }

  client.request(reqRoute, payload, res => {
    cb(res)
  })
}

e.registerPlayerAndAuthorizeInRooms = function(client, user, pass, rooms, cb){
  var reqRoute = 'connector.entryHandler.registerPlayerAndAuthorizeInRooms'
  var payload = {
    user: user,
    pass: pass,
    rooms: rooms
  }

  client.request(reqRoute, payload, res => {
    cb(res)
  })
}

e.authorizePlayer = function(client, user, rooms, cb){
  var reqRoute = 'connector.entryHandler.authorizePlayerInRooms'
  var payload = {
    user: user,
    rooms: rooms
  }

  client.request(reqRoute, payload, res => {
    cb(res)
  })
}

e.unauthorizePlayer = function(client, user, rooms, cb){
  var reqRoute = 'connector.entryHandler.unauthorizePlayerInRooms'
  var payload = {
    user: user,
    rooms: rooms
  }

  client.request(reqRoute, payload, res => {
    cb(res)
  })
}

e.redisGet = function(redisClient, key, cb) {
  redisClient.get(key, res => {
    cb(res)
  })
}
