var wsClient = require('../../server/comms.client.js')
w.l = function(str) {
  return function(data){
    console.log('comms.'+str, data)
  }
}
w._Id2Date = function(_id) {
  return new Date(parseInt(_id.substring(0, 8), 16) * 1000)
}
w.map_post = function(post) {
  post.creation_date = _Id2Date(post._id)
  post.src = '/img/'+post.short_url
  return post
}

var patterns = [
  {
    name: 'user_id',
    test: function(o){
      var keys = Object.keys(o)
      return keys.length === 1 && keys[0] === 'user_id'
    },
    method: function(o){
      let vm = this
      if (o.user_id === null) {o.user_id = undefined}
      vm.user_id = o.user_id
      vm.user__got_login = true
      vm.router__init()
    }
  },
  {
    name: 'reconnect',
    test: function(o) {
      // reconnect incase of logout from another tab within the browser
      return Object.keys(o).length === 1 && o.reconnect === true
    },
    method: function() {
      // TODO logout route away mabe
      comms.reconnect()
    }
  },
  {
    name: 'post',
    test: function(o){
      return o.post !== undefined
    },
    method: function(o) {
      let vm = this
      console.log('hererre', o)
      var a = vm.posts.findIndex(function(post){
        return post._id === o.post._id
      })
      var b = vm.posts__feed.findIndex(function(post){
        return post._id === o.post._id
      })
      var c = vm.sp !== undefined && vm.sp._id === o.post._id
      map_post(o.post)
      if (a > -1) {
        Vue.set(vm.posts, a, o.post)
      }
      if (b > -1) {
        Vue.set(vm.posts__feed, b, o.post)
      }
      if (c) {
        vm.sp = o.post
      }
    }
  },
  {
    name: 'post__remove',
    test: function(o) {
      return o.cmd === 'post__remove'
    },
    method: function(o) {
      vm.post__remove(o._id)
    }
  }
]

module.exports = function({data, methods}) {


methods.comms__new_message = function(o) {
  let vm = this
  var pattern = patterns.reduce(function(out, pattern){
    if (typeof out === 'object'){ return out }
    if (pattern.test(o) === true) { out = pattern }
    return out
  }, undefined)
  if (pattern === undefined) {
    console.log('comms: no matches')
    return
  }
  pattern.method.call(vm, o)
}

methods.comms_init = function(){
  let vm = this
  var i = 0

  var is_secure = location.href.match('^https://') !== null
  var method = 'ws://'
  if (is_secure) {method = 'wss://'}

  w.comms = wsClient(method+location.host)

  comms.on('connection', l('connection'))

  comms.on('close', function(){
    w.wait(500).then(function(){
      comms.reconnect()
    })
  })

  comms.on('message', function(o){
    l('message')(o)
    vm.comms__new_message(o)
  })
}


}
