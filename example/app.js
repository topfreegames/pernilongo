// pernilongo
// https://github.com/topfreegames/pernilongo
//
// Licensed under the MIT license:
// http://www.opensource.org/licenses/mit-license
// Copyright © 2016 Top Free Games <backend@tfgco.com>


var pomelo = require('pomelo');
var pernilongo = require('../')

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'pernilongo_example');

// configure monitor
app.configure('production|development', function(){
  app.set('monitorConfig',
    {
      monitor : pomelo.monitors.redismonitor,
      redisNodes: {
        host: "127.0.0.1",
        port: "3434"
      }
    })
});

// app configuration
app.configure('production|development', 'connector', function(){
  app.set('connectorConfig',
    {
      connector : pomelo.connectors.hybridconnector,
      heartbeat : 3,
      useDict : true,
      useProtobuf : true
    });
    app.use(pernilongo, {
      pernilongo: {
        redisUrl: process.env.REDIS_URL || "//localhost:6379"
      }
    })
});

// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
