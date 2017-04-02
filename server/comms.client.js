// const BSON = require('bson')
// const bson = new BSON()
// note commented out BSON code
const eventSystem = require('../app/lib/eventSystem.js')


// function BlobtoJSON(blob) {
//   return new Promise(function(resolve, reject){
//     var reader = new FileReader()
//     reader.readAsArrayBuffer(blob)
//     reader.on('loadend', function(){
//       var data = bson.deserialize( ArrayBuffertoBuffer(reader.result) )
//       resolve(data)
//     })
//   })
// }
// function ArrayBuffertoBuffer(ab) {
//   var buf = new Buffer(ab.byteLength)
//   var view = new Uint8Array(ab)
//   for (var i = 0; i < buf.length; ++i) {
//     buf[i] = view[i]
//   }
//   return buf
// }

module.exports = function(path) {
  var e = eventSystem()
  var o = {}
  function connect() {
    o.ws = new WebSocket(path) // 'ws://localhost:3000'
    o.ws.on('open', function() {
      e.emit('connection')
    })
    o.ws.on('close', function(){
      e.emit('close')
    })
    o.ws.on('message', function(ws_event) {
      var data = JSON.parse(ws_event.data)
      if (typeof data.req_res === 'string'){
        reqs_made[data.req_res].resolve(data.data)
        delete reqs_made[ws_event.data.req_res_rand]
        return
      }
      e.emit('message', data)
      // if (ws_event.data.toString() !== '[object Blob]') {return}
      // BlobtoJSON(ws_event.data).then(function(data){
      //   e.emit('message', data)
      // })
    })

  }
  o.reconnect = function() {
    if (o.ws) {o.ws.close()}
    connect()
  }
  o.send = function(data) {
    o.ws.send( JSON.stringify(data) )
    // o.ws.send( bson.serialize(data, {ignoreUndefined: false}) )
  }
  o.on = e.on
  o.off = e.off

  // req res http pattern
  var reqs_made = {}
  o.req = function(data) {
    return new Promise(function(resolve, reject){
      var rand = Date.now() + '-' + Math.random()
      reqs_made[rand] = {
        req_data: data,
        resolve: resolve,
        reject: reject,
        res_data: undefined
      }
      o.send({
        req_res: rand,
        data: data
      })
    })
  }
  connect()
  return o
}


// comms.send
// comms.on('connection')
// comms.on('message')
// comms.on('close')
// comms.reconnect()
