const WebSocket = require('uws')
// const BSON = require('bson')
// const bson = new BSON()

const eve = require('../app/lib/eventSystem.js')
// http://stackoverflow.com/questions/8609289/convert-a-binary-nodejs-buffer-to-javascript-arraybuffer
// function ArrayBuffertoBuffer(ab) {
//   var buf = new Buffer(ab.byteLength)
//   var view = new Uint8Array(ab)
//   for (var i = 0; i < buf.length; ++i) {
//     buf[i] = view[i]
//   }
//   return buf
// }

// ws code
function sendBSON({ws, data}) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send( JSON.stringify(data) )
    // ws.send( bson.serialize(data, {ignoreUndefined: false}))
  }
}
module.exports = function(server) {
  var e = eve()
  var o = {}
  const wss = new WebSocket.Server({ server })
  wss.on('connection', function(ws){
    e.emit('connection', ws)
    ws.on('message', function incoming(data, flags) {
      var ws = this
      try {
        data = JSON.parse(data)
        if (typeof data.req_res === 'string') {
          e.emit('request', {data, ws})
          return
        }
        // data = bson.deserialize(ArrayBuffertoBuffer(data))
        e.emit('message', {data, ws})
      } catch (err){}
    })

    ws.on('close', function(){
      e.emit('close', ws)
    })
  })

  o.send = sendBSON
  o.sendAll = function(data){
    wss.clients.forEach(function(ws){
      sendBSON({ws, data})
    })
  }
  o.sendAllExcept = function({ws, data}){
    wss.clients.forEach(function(client){
      if (client === ws) {return}
      sendBSON({ws: client, data})
    })
  }
  o.wss = wss
  o.on = e.on
  o.off = e.off
  return o
}

/*
comms.on('connection', ws)
comms.on('close', ws)
comms.on("message", {data, ws})

comms.send({ws, data})
comms.sendAll(data)
comms.sendAllBut({ws, data})
*/
