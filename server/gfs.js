const Gfs = require('gridfs-stream')
const Mongo = require('mongodb')
const sharp = require('sharp')
const stream = require('stream')
var o = {}

function init({mongourl}) {
  return Mongo.MongoClient.connect(mongourl).then(function(db){
    o.db = db
    o.gfs = Gfs(db, Mongo)
    db.on('close', function(e){
      console.log('db close connection', e)
    })
    return o
  }).catch(function(err){
    console.log('db connection error:', err)
  })
}

o.store_GFS = function(readStream, options) {
  if (o.gfs === undefined) {
    return Promise.reject('gfs is undefined')
  }
  // https://www.npmjs.com/package/gridfs-stream
  // streaming to gridfs
  var writestream = o.gfs.createWriteStream(options)
  readStream.pipe(writestream)
  return new Promise(function(resolve, reject){
    writestream.on('close', resolve)
    writestream.on('error', reject)
  })
}

o.retrieve__GFS = function(_id) {
  if (o.gfs === undefined) {
    return Promise.reject('gfs is undefined')
  }
  return new Promise(function(resolve, reject){
  o.gfs.findOne({_id}, function(err, info){
    if (err) {return reject(err)}
    resolve({
      stream: o.gfs.createReadStream({_id}),
      metadata: info
    })
  })})
}

o.imageUploadGfs = function(req,res){
  var file = req.files.image // from multer express-fileupload
  var _id = undefined

  const image = sharp(file.data)
  image.toBuffer(function(err, data, info){
    var bufferStream = new stream.PassThrough()
    bufferStream.end(data)
    var options = {
      // _id,
      filename: file.name,
      mode: 'w',
      chunkSize: 1024,
      content_type: file.mimetype,
      metadata: info
    }
    store_GFS(bufferStream, options)
    .then(function(){
      // DONE
    })
  })

}

module.exports = init
