const crypto = require('crypto')
const e = module.exports

const SALT_LENGTH = 12
const ITERATIONS = 901
const KEYLEN = 24

e.getPBKDF2Hash = function(password){
  var password64 = new Buffer(password).toString('base64')
  var salt64 = crypto.randomBytes(SALT_LENGTH).toString('base64') 
  var hash = crypto.pbkdf2Sync(password, salt64, ITERATIONS, KEYLEN, 'sha256')
  var hash64 = hash.toString('base64')
  return "PBKDF2$sha256$" + ITERATIONS + "$" + salt64 + "$" + hash64
}