var logger = require('pomelo-logger').getLogger('pomelo')

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
  this.pernilongo = this.app.get('pernilongo')
};

Handler.prototype.entry = function(msg, session, next) {
  next(null, {code: 200, msg: 'Welcome to pomelo 2.0.'});
};

Handler.prototype.registerPlayer = function(msg, session, next) {
  logger.debug('registering player ' + msg.user)
  this.pernilongo.registerPlayer(msg.user, msg.pass).then( res => {
    return next(null, 'player registered!')
  }).catch(e => {
    return next(new Error('failed to register player'))
  })
}

Handler.prototype.authorizePlayerInRooms = function(msg, session, next) {
  this.pernilongo.authorizePlayerInRooms(msg.user, msg.rooms).then(  res => {
    return next(null, 'player authorized!')
  }).catch(e => {
    return next(new Error('failed to authorize player'))
  })
}

Handler.prototype.unauthorizePlayerInRooms = function(msg, session, next) {
  this.pernilongo.unauthorizePlayerInRooms(msg.user, msg.rooms).then(  res => {
    return next(null, 'player unauthorized!')
  }).catch(e => {
    return next(new Error('failed to unauthorize player'))
  })
}
