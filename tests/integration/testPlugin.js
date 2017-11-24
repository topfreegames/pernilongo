require('./common')

const helper = require('./helper')

describe('Integration', () =>{

  it('Should register user', function(done){
    var self = this
    helper.registerPlayer(self.pomeloClient, 'testplayer', 'testpass', res => {
      assert.equal(res, 'player registered!')
      done()
    })
  })

  it('Should register user and authorize in rooms', function(done){
    var self = this
    helper.registerPlayerAndAuthorizeInRooms(self.pomeloClient, 'testplayer', 'testpass', ['test1'], res => {
      assert.equal(res, 'player registered and authorized in rooms!')
      done()
    })
  })

  it('Should authorize user', function(done){
    var self = this
    helper.authorizePlayer(self.pomeloClient, 'testplayer', ['testroom1', 'testroom2'], res => {
      assert.equal(res, 'player authorized!')
      done()
    })

  })

  it('Should authorize user with an expire time', function(done){
    var self = this
    var expireTime = 10
    helper.authorizePlayerWithExpireTime(self.pomeloClient, 'testplayer2', ['testroom1', 'testroom2'], expireTime, res => {
      assert.equal(res, 'player authorized!')
      done()
    })

  })

  it('Should unauthorize user', function(done){
    var self = this
    helper.unauthorizePlayer(self.pomeloClient, 'testplayer', ['testroom1', 'testroom2'], res => {
      assert.equal(res, 'player unauthorized!')
      done()
    })

  })

})

describe('Database Connection', function() {

  var db;

  before(function(done){
    var MongoClient = require('mongodb').MongoClient;
    var connection = MongoClient.connect('mongodb://localhost:27017/mqtt');
    connection.then(function(_db){
      db = _db;
      done();
    })
  })

  it("Should save user into database after registration", function(done) {
    var self = this;
    helper.registerPlayer(self.pomeloClient, 'testslayer', 'testpass', res => {
        db.collection('mqtt_user').findOne({username: "testslayer"})
        .then(function(result) {
          assert.equal(result.username, "testslayer");
          done();
        })
        .catch(done);
    })
  })

  it("Should store a pbkdf2-hashed password into the database", function(done) {
    var self = this;
    helper.registerPlayer(self.pomeloClient, 'testslayer2', 'newpass', res => {
          db.collection('mqtt_user').findOne({username: "testslayer2"})
          .then(function(result) {
            var crypto = require('crypto');
            var hash = crypto.pbkdf2Sync("newpass", result.salt, 1000, 20, 'sha256').toString('hex');
            assert.equal(result.password, hash);
            done();
          })
          .catch(done);
    })
  })

  after(function(done) {
    db.close();
    done();
  });

})
