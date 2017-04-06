const ws_user_authentication = require('./ws_user_authentication.js')
const Pinterest = require('./pinterest.js')
const Comms = require('./comms.server.js')

module.exports = function({app, server, cookie_parser, tw, dao}) {
  const pinterest = Pinterest({app, tw, dao})
  const comms = Comms(server)
  var users_online = []
  function get_user(ws, user_id) {
    return users_online.find(function(a){
      return a.ws === ws
    })
  }
  function user_auth(o, user_id) {
    return user_id !== undefined && user_id !== null &&
      o.user_id !== undefined && o.user_id !== null &&
      o.user_id === user_id
  }
  ws_user_authentication({
    comms,
    cookie_parser,
    tw,
    users_online
  })


  // used for live updating browser tabs when login or login
  tw.events.on('logout', function(){
    comms.sendAll({reconnect: true})
  })
  tw.events.on('login', function(){
    setTimeout(function(){
      comms.sendAll({reconnect: true})
      // give
      // 1s for twitter
      // 1s for browsers to set cookies
    }, 2000)
  })

  pinterest.on('post__update', function(post){
    // console.log('post__update', post)
    post._id = post._id.toString()
    comms.sendAll({post})
  })
  comms.on('request', function({data, ws}){
    // console.log('comms.request', data)
    var user = get_user(ws)
    var a = data.data
    if (a.cmd === 'post__get') {
      dao.post__get(a)
      .then(function(post){
        comms.send({ws, data: {req_res: data.req_res,
          data: post
        }})
      })
    }
    if (a.cmd === 'posts__feed') {
      dao.posts__feed({
        page_n: a.page_n,
        user_id: a.user_id
      })
      .then(function(result){
        comms.send({ws, data: {req_res: data.req_res,
          data: result
        }})
      })
    }
    if (a.cmd === 'post__remove' && user_auth(user, a.user_id)){
      dao.post__remove({_id: a._id}).then(function(res){
        comms.send({ws, data: {req_res: data.req_res,
          data: res
        }})
        comms.sendAllExcept({ws, data: {
          cmd: 'post__remove',
          _id: res._id
        }})
      })
    }
  })

  comms.on('message', function({data, ws}){
    console.log('data', data)
    var user = get_user(ws)
    if (data.cmd === 'post__update' && user_auth(user, data.post.user_id)) {
      dao.post__update(data.post)
    }

    if ( (data.cmd === 'post__heart' || data.cmd === 'post__heart_remove') &&
        user_auth(user, data.user_id) ) {
      dao[data.cmd]({
        _id: data.post_id,
        user_id: data.user_id
      })
    }
  })
}
