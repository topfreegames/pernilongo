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

  var MongoClient = require('mongodb').MongoClient;

  it("Should save user into database after registration", function(done) {
    var self = this;
    helper.registerPlayer(self.pomeloClient, 'testslayer', 'testpass', res => {

      var setAccessData = function() {
        MongoClient.connect('mongodb://localhost:27017/mqtt', function(err, db) {
            if (err) throw err;
            db.collection('mqtt_user').findOne({username: "testslayer"})
            .then(function(result) {
                db.close(test(result.username))
            });
        });
      }

      var test = function(username) {
        expect(username).to.eql("testslayer");
        done();
      }

      setAccessData();
    })
  })

  it("Should store a hashed password into database", function(done) {
    var self = this;
    helper.registerPlayer(self.pomeloClient, 'testslayer2', 'newpass', res => {
      
      var setAccessData = function() {
        MongoClient.connect('mongodb://localhost:27017/mqtt', function(err, db) {
            if (err) throw err;
            db.collection('mqtt_user').findOne({username: "testslayer2"})
            .then(function(result) {
                db.close(test(result.password, result.salt))
            });
        });
      }

      var test = function(password, salt) {
        var crypto = require('crypto');
        var hash = crypto.pbkdf2Sync("newpass", salt, 1000, 20, 'sha256').toString('hex');
        expect(password).to.eql(hash);
        done();
      }

      setAccessData();
    })
  })

})
