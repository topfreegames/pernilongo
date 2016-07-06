var assert = require('chai').assert
var expect = require('chai').expect
var password = require('../../lib/password')

describe('Password', function(){

  it('should generate a valid password for using with mosquitto auth plugin', function(done){
    var generatedPassword = password.getPBKDF2Hash('admin')
    assert.equal(generatedPassword.length, 67)
    expect(generatedPassword).to.match(/PBKDF2\$sha256\$901\$.{16}\$.{32}/)
    done()
  })

})
