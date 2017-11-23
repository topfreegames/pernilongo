var assert = require('chai').assert
var expect = require('chai').expect
var password = require('../../lib/password')

describe('Password', function(){

  it('should generate a valid password for using with the emqtt mongo auth plugin', function(done){
    var generatedPassword = password.getPBKDF2Hash('admin')
    assert.equal(generatedPassword.length, 76)
    expect(generatedPassword).to.match(/PBKDF2\$sha256\$1000\$.{16}\$.{40}/)
    done()
  })

})
