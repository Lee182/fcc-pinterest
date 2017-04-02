var k = require('./keys.js')
var dao = require('./db.js')({
  mongourl: k.mongourl,
})
const fs = require('fs')
const path = require('path')

var exit = (function(n) {
  var i = 0
  return function(){
    i++
    if (i === n) {
      console.log('exit')
      process.exit()
    }
  }
})(2)

dao.connect()
.then(function(){
  dao.db.collection('pinterest_posts').remove({}).then(function(){
    console.log('removed pinterest_posts')
    exit()
  })
})

var a = path.join(__dirname, '../', 'images')
fs.readdir(a, function(err, images){
  if (err) {
    console.log(err)
    return exit()
  }
  if (images.length === 0) {
    return exit()
  }
  count = 0
  images.map(function(image){
    fs.unlink(path.join(__dirname, '../', 'images', image), function(){
      count++
      if (count === images.length) {console.log('removed image files')
        exit()
      }
    })
  })
})
