Pernilongo
==========

[![Build Status](https://travis-ci.org/topfreegames/pernilongo.svg?branch=master)](https://travis-ci.org/topfreegames/pernilongo)

### Example Usage

Make pomelo use the component:

```
var pernilongo = require('pernilongo-plugin')

...
...

app.configure('production|development', 'connector', function(){
  app.set('connectorConfig',
    ...
    ...
    app.use(pernilongo, {
      pernilongo: {
        redisUrl: "//localhost:6379"
      }
    })
    ...
    ...
})
```

Then use the component like:

```
var Handler = function(app) {
  ...
  this.pernilongo = this.app.get('pernilongo')
}

Handler.prototype.registerPlayer = function(msg, session, next) {
  logger.debug('registering player ' + msg.user)
  this.pernilongo.registerPlayer(msg.user, msg.pass).then( res => {
    return next(null, 'player registered!')
  }).catch(e => {
    return next(new Error('failed to register player'))
  })
}

```
