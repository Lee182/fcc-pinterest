const Mongo = require('mongodb')
const short_url = require('./short_url')


module.exports = function({mongourl}) {

let o = {
  db: undefined,
  post_count: undefined,
  ObjectId: Mongo.ObjectId
}

function ensureConnected(fn) {return function() {
  if (o.db === undefined) {return Promise.resolve({err: 'db disconnected'})}
  return fn.apply(o, arguments)
}}

o.connect = function() {
  console.log('mongo connnecting...')
  return Mongo.MongoClient.connect(mongourl).then(function(db){
    return db.collection('pinterest_posts').count().then(function(n){
      o.post_count = n
      o.db = db
      console.log('mongo connected') // setup db
    })
  }).catch(function(err){
    console.log('mongo connection error:', err)
    o.db = undefined
  })
}

return o

}
