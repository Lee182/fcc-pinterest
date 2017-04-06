module.exports = function({comms, tw, cookie_parser, users_online}){

  const cook_p = function(req) {
    return new Promise(function(resolve){
      // req.headers.cookies
      cookie_parser(req, {}, function(){
        resolve(req.cookies)
      })
    })
  }

  comms.on('connection', function(ws){
    console.log('comm.connection', ws._socket.remotePort)
    // ip ws._socket.remoteAddress
    users_online.push({ws, user_id: undefined})
    var headers = ws.upgradeReq.headers
    cook_p(ws.upgradeReq).then(function(cookies){
      if (cookies.twitter === undefined) {
        return comms.send({ws, data: {user_id: null}})
      }
      return tw.is_logged_in_prom(cookies.twitter).then(function(a){
        console.log(a)
        if (a === undefined) {
          return comms.send({ws, data: {user_id: null}})
        }
        var i = users_online.findIndex(function(o){
          return ws === o.ws
        })
        if (i > -1) {
          users_online[i].user_id = user_id
        }
        comms.send({ws, data: {user_id}})
      })
    })
  })


  comms.on('close', function(ws){
    var i = users_online.findIndex(function(o){
      return ws === o.ws
    })
    console.log('comm.closed',users_online[i].user_id)
    users_online.splice(i,1)
  })

}
