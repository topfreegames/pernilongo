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

  it('Should unauthorize user', function(done){
    var self = this   
    helper.unauthorizePlayer(self.pomeloClient, 'testplayer', ['testroom1', 'testroom2'], res => {
      assert.equal(res, 'player unauthorized!')
      done()
    })
   
  })

})
