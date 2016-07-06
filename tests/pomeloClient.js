'use strict'

var JS_WS_CLIENT_TYPE = 'js-websocket'
var JS_WS_CLIENT_VERSION = '0.0.1'

var WebSocket = require('ws')
var Protocol = require('pomelo-protocol')
var Package = Protocol.Package
var Message = Protocol.Message
var EventEmitter = require('events').EventEmitter
var protobuf = require('pomelo-protobuf')

var decodeIOProtobuf = null
var decodeIOEncoder = null
var decodeIODecoder = null

var globalProtos = null
var RES_OK = 200
var RES_OLD_CLIENT = 501

if (typeof Object.create !== 'function') {
  Object.create = function (o) {
    function F() {}
    F.prototype = o
    return new F()
  }
}

var pomelo = Object.create(EventEmitter.prototype) // object extend from object
var socket = null
var reqId = 0
var callbacks = {}
var handlers = {}
// Map from request id to route
var routeMap = {}
var dict = {}    // route string to code
var abbrs = {}   // code to route string
var serverProtos = {}
var clientProtos = {}
var protoVersion = 0

var heartbeatInterval = 0
var heartbeatTimeout = 0
var nextHeartbeatTimeout = 0
var gapThreshold = 100   // heartbeat gap threashold
var heartbeatId = null
var heartbeatTimeoutId = null
var handshakeCallback = null

var decode = null
var encode = null

var reconnect = false
var reconncetTimer = null
var reconnectUrl = null
var reconnectAttempts = 0
var reconnectionDelay = 5000
var DEFAULT_MAX_RECONNECT_ATTEMPTS = 10

var useCrypto

var handshakeBuffer = {
  sys: {
    type: JS_WS_CLIENT_TYPE,
    version: JS_WS_CLIENT_VERSION,
    rsa: {},
  },
  player: {},
}

var initCallback = null

var deCompose = function (msg) {
  var route = msg.route

  // Decompose route from dict
  if (msg.compressRoute) {
    if (!abbrs[route]) {
      return {}
    }
    route = msg.route = abbrs[route]
  }
  if (protobuf && serverProtos[route]) {
    return protobuf.decodeStr(route, msg.body)
  } else if (decodeIODecoder && decodeIODecoder.lookup(route)) {
    return decodeIODecoder.build(route).decode(msg.body)
  }
  return JSON.parse(Protocol.strdecode(msg.body))
}

var defaultDecode = pomelo.decode = function (data) {
  // probuff decode
  var msg = Message.decode(data)

  if (msg.id > 0) {
    msg.route = routeMap[msg.id]
    delete routeMap[msg.id]
    if (!msg.route) {
      return undefined
    }
  }

  msg.body = deCompose(msg)
  return msg
}

var defaultEncode = pomelo.encode = function (_reqId, _route, _msg) {
  var msg = _msg
  var route = _route
  var type = _reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY

  // compress message by protobuf
  if (protobuf && clientProtos[route]) {
    msg = protobuf.encode(route, msg)
  } else if (decodeIOEncoder && decodeIOEncoder.lookup(route)) {
    var Builder = decodeIOEncoder.build(route)
    msg = new Builder(msg).encodeNB()
  } else {
    msg = Protocol.strencode(JSON.stringify(msg))
  }

  var compressRoute = 0
  if (dict && dict[route]) {
    route = dict[route]
    compressRoute = 1
  }

  return Message.encode(_reqId, type, compressRoute, route, msg)
}

var reset = function () {
  reconnect = false
  reconnectionDelay = 1000 * 5
  reconnectAttempts = 0
  clearTimeout(reconncetTimer)
}

var send = function (packet) {
  if (socket) socket.send(packet)
}

var processPackage = function (msgs) {
  if (Array.isArray(msgs)) {
    for (var i = 0; i < msgs.length; i++) {
      var msg = msgs[i]
      handlers[msg.type](msg.body)
    }
  } else {
    handlers[msgs.type](msgs.body)
  }
}

var sendMessage = function (_reqId, _route, _msg) {
  var route = _route
  var msg = _msg
  if (useCrypto) {
    msg = JSON.stringify(msg)
    var sig = rsa.signString(msg, 'sha256')
    msg = JSON.parse(msg)
    msg.__crypto__ = sig
  }

  if (encode) {
    msg = encode(reqId, route, msg)
  }

  var packet = Package.encode(Package.TYPE_DATA, msg)
  send(packet)
}

var connect = function (params, url, cb) {
  if (!params) params = {}
  var maxReconnectAttempts = params.maxReconnectAttempts || DEFAULT_MAX_RECONNECT_ATTEMPTS
  reconnectUrl = url
  // Add protobuf version
  if (globalProtos && protoVersion === 0) {
    var protos = JSON.parse(globalProtos)

    protoVersion = protos.version || 0
    serverProtos = protos.server || {}
    clientProtos = protos.client || {}

    if (!!protobuf) {
      protobuf.init({ encoderProtos: clientProtos, decoderProtos: serverProtos })
    }
    if (!!decodeIOProtobuf) {
      decodeIOEncoder = decodeIOProtobuf.loadJson(clientProtos)
      decodeIODecoder = decodeIOProtobuf.loadJson(serverProtos)
    }
  }
  // Set protoversion
  handshakeBuffer.sys.protoVersion = protoVersion

  var onopen = function () {
    if (!!reconnect) {
      pomelo.emit('reconnect')
    }
    reset()
    var obj = Package.encode(
      Package.TYPE_HANDSHAKE,
      Protocol.strencode(JSON.stringify(handshakeBuffer))
    )
    send(obj)
  }

  var onmessage = function (event) {
    processPackage(Package.decode(event.data), cb)
    // new package arrived, update the heartbeat timeout
    if (heartbeatTimeout) {
      nextHeartbeatTimeout = Date.now() + heartbeatTimeout
    }
  }

  var onerror = function (event) {
    pomelo.emit('io-error', event)
    console.error('socket error: ', event)
  }

  var onclose = function (event) {
    pomelo.emit('close', event)
    pomelo.emit('disconnect', event)
    if (!!params.reconnect && reconnectAttempts < maxReconnectAttempts) {
      reconnect = true
      reconnectAttempts++
      reconncetTimer = setTimeout(function () {
        connect(params, reconnectUrl, cb)
      }, reconnectionDelay)
      reconnectionDelay *= 2
    }
  }

  socket = new WebSocket(url)
  socket.binaryType = 'arraybuffer'
  socket.onopen = onopen
  socket.onmessage = onmessage
  socket.onerror = onerror
  socket.onclose = onclose
}

pomelo.init = function (params, cb) {
  initCallback = cb
  var host = params.host
  var port = params.port
  var useSsl = params.ssl

  encode = params.encode || defaultEncode
  decode = params.decode || defaultDecode

  var url = useSsl ? 'wss://' + host : 'ws://' + host
  if (port) {
    url += ':' + port
  }

  connect(params, url, cb)
}

pomelo.disconnect = function () {
  if (socket) {
    if (socket.disconnect) socket.disconnect()
    if (socket.close) socket.close()
    socket = null
  }

  if (heartbeatId) {
    clearTimeout(heartbeatId)
    heartbeatId = null
  }
  if (heartbeatTimeoutId) {
    clearTimeout(heartbeatTimeoutId)
    heartbeatTimeoutId = null
  }
}

pomelo.request = function (_route, _msg, _cb) {
  var route = _route
  var msg = _msg
  var cb = _cb

  if (arguments.length === 2 && typeof msg === 'function') {
    cb = msg
    msg = {}
  } else {
    msg = msg || {}
  }
  route = route || msg.route
  if (!route) {
    return
  }

  reqId++
  sendMessage(reqId, route, msg)

  callbacks[reqId] = cb
  routeMap[reqId] = route
}

pomelo.notify = function (route, msg) {
  if (!msg) msg = {}
  sendMessage(0, route, msg)
}

// var handler = {}

var heartbeatTimeoutCb = function () {
  var gap = nextHeartbeatTimeout - Date.now()
  if (gap > gapThreshold) {
    heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, gap)
  } else {
    console.error('server heartbeat timeout')
    pomelo.emit('heartbeat timeout')
    pomelo.disconnect()
  }
}


var heartbeat = function () {
  if (!heartbeatInterval) {
    // no heartbeat
    return
  }

  var obj = Package.encode(Package.TYPE_HEARTBEAT)
  if (heartbeatTimeoutId) {
    clearTimeout(heartbeatTimeoutId)
    heartbeatTimeoutId = null
  }

  if (heartbeatId) {
    // already in a heartbeat interval
    return
  }
  heartbeatId = setTimeout(function () {
    heartbeatId = null
    send(obj)

    nextHeartbeatTimeout = Date.now() + heartbeatTimeout
    heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, heartbeatTimeout)
  }, heartbeatInterval)
}

// Initilize data used in pomelo client
var initData = function (data) {
  if (!data || !data.sys) return
  dict = data.sys.dict
  var protos = data.sys.protos

  // Init compress dict
  if (dict) {
    abbrs = {}

    for (var route in dict) {
      if ({}.hasOwnProperty.call(dict, route)) {
        abbrs[dict[route]] = route
      }
    }
  }

  // Init protobuf protos
  if (protos) {
    protoVersion = protos.version || 0
    serverProtos = protos.server || {}
    clientProtos = protos.client || {}

    // Save protobuf protos to localStorage
    globalProtos = JSON.stringify(protos)

    if (!!protobuf) {
      protobuf.init({ encoderProtos: protos.client, decoderProtos: protos.server })
    }
    if (!!decodeIOProtobuf) {
      decodeIOEncoder = decodeIOProtobuf.loadJson(clientProtos)
      decodeIODecoder = decodeIOProtobuf.loadJson(serverProtos)
    }
  }
}

var handshakeInit = function (data) {
  if (data.sys && data.sys.heartbeat) {
    heartbeatInterval = data.sys.heartbeat * 1000   // heartbeat interval
    heartbeatTimeout = heartbeatInterval * 2        // max heartbeat timeout
  } else {
    heartbeatInterval = 0
    heartbeatTimeout = 0
  }

  initData(data)

  if (typeof handshakeCallback === 'function') {
    handshakeCallback(data.player)
  }
}

var handshake = function (_data) {
  var data = JSON.parse(Protocol.strdecode(_data))

  if (data.code === RES_OLD_CLIENT) {
    pomelo.emit('error', 'client version not fullfill')
    return
  }

  if (data.code !== RES_OK) {
    pomelo.emit('error', 'handshake fail')
    return
  }

  handshakeInit(data)

  var obj = Package.encode(Package.TYPE_HANDSHAKE_ACK)
  send(obj)
  if (initCallback) {
    initCallback(socket)
  }
}

var processMessage = function (pomelo, msg) {
  if (!msg.id) {
    // server push message
    pomelo.emit(msg.route, msg.body)
    return
  }

  // if have a id then find the callback function with the request
  var cb = callbacks[msg.id]

  delete callbacks[msg.id]
  if (typeof cb !== 'function') {
    return
  }

  cb(msg.body)
  return
}

var onData = function (data) {
  var msg = data
  if (decode) {
    msg = decode(msg)
  }
  processMessage(pomelo, msg)
}

var onKick = function (_data) {
  var data = JSON.parse(Protocol.strdecode(_data))
  pomelo.emit('onKick', data)
}

handlers[Package.TYPE_HANDSHAKE] = handshake
handlers[Package.TYPE_HEARTBEAT] = heartbeat
handlers[Package.TYPE_DATA] = onData
handlers[Package.TYPE_KICK] = onKick

// var processMessageBatch = function (pomelo, msgs) {
//   for(var i=0, l=msgs.length; i<l; i++) {
//     processMessage(pomelo, msgs[i])
//   }
// }

module.exports = pomelo
