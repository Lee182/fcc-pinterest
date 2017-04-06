(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// tools loading
require('./lib/jonoShortcuts.js')
w.wait = require('./lib/wait.js')
w.req = require('./lib/request.js')
w.loadImg = require('./lib/loadImage.js')

w.modules = {
  header: require('./modules/header.js'),

  user: require('./modules/user.js'),
  router: require('./modules/router.js'),
  upload: require('./modules/upload.js'),
  comms: require('./modules/comms.js'),
  home: require('./modules/home.js'),
  singe_post: require('./modules/single_post.js')
}

vueobj = {
  el: '#app',
  data: {},
  computed: {},
  watch: {},
  methods: {},
  filters: {},

  // https://vuejs.org/v2/guide/instance.html#Lifecycle-Diagram
  beforeCreate: function(){},
  created: function(){
    let vm = this
    vm.comms_init()
  },
  beforeMount: function(){},
  mounted: function(){},
  beforeUpdate: function(){},
  updated: function(){},
  beforeDestroy: function(){},
  destroyed: function(){}
}

Object.keys(modules).forEach(function(name){
  if (typeof modules[name] !== 'function') {return}
  modules[name](vueobj)
})

w.vm = new Vue(vueobj)

},{"./lib/jonoShortcuts.js":3,"./lib/loadImage.js":4,"./lib/request.js":5,"./lib/wait.js":6,"./modules/comms.js":7,"./modules/header.js":8,"./modules/home.js":9,"./modules/router.js":10,"./modules/single_post.js":11,"./modules/upload.js":12,"./modules/user.js":13}],2:[function(require,module,exports){
module.exports = function(){
  var events = {}
  var eventsystem = {
    on: function (id, fn) {
      events[id] = events[id] || []
      events[id].push(fn)
    },
    off: function(id, fn) {
      if (events[id] === undefined) {return}
      var i = events[id].findIndex(function(g){
        return g = fn
      })
      if (i !== -1) {
        events[id].splice(i, 1)
      }
    },
    emit: function (id, data) {
      if (events[id]) {
        events[id].forEach(function(fn) {
          fn(data)
        })
      }
    }
  }
  eventsystem.events = events
  return eventsystem
}

},{}],3:[function(require,module,exports){
// Base Browser stuff
window.w = window
w.D = Document
w.d = document

Element.prototype.qs = Element.prototype.querySelector
Element.prototype.qsa = Element.prototype.querySelectorAll
D.prototype.qs = Document.prototype.querySelector
D.prototype.qsa = Document.prototype.querySelectorAll

EventTarget.prototype.on = EventTarget.prototype.addEventListener
EventTarget.prototype.off = EventTarget.prototype.removeEventListener
EventTarget.prototype.emit = EventTarget.prototype.dispatchEvent

// http://stackoverflow.com/questions/11761881/javascript-dom-find-element-index-in-container
Element.prototype.getNodeIndex = function() {
  var node = this
  var index = 0;
  while ( (node = node.previousSibling) ) {
    if (node.nodeType != 3 || !/^\s*$/.test(node.data)) {
        index++;
    }
  }
  return index;
}

NodeList.prototype.toArray = function() {
  return Array.prototype.map.call(this, function(item){
    return item
  })
}

HTMLCollection.prototype.toArray = function() {
  return NodeList.prototype.toArray.call(this)
}

Node.prototype.prependChild = function(el) {
  var parentNode = this
  parentNode.insertBefore(el, parentNode.firstChild)
}



Element.prototype.qsP = function(query) {
  // qsP: querySelectorParent
  var el = this
  var do_break = false
  while (do_break === false) {
    parent = el.parentElement
    do_break = parent === null || parent.matches(query)
    // parentElement of html is null
  }
  if (parent === null) {return undefined}
  return parent
}

},{}],4:[function(require,module,exports){
module.exports = function(src) {
  return new Promise(function(resolve, reject) {
    var img = document.createElement('img')
    img.onload = function() {
      resolve(img)
    }
    img.onerror = function(e) {
      reject(e)
    }
    img.src = src
  })
}

},{}],5:[function(require,module,exports){
module.exports = function({
  method,  // get, post, put, delete
  url,     // relative url or full path
  data,    // if post req sets body as data
  formData,    // if file setRequestHeader('X-FileName', file.name)
  cookies,
  timeout,
  json,
  json_req,
  json_res,
  cb_progress,
  cb_readystate
}) {
  if (method === undefined) {method = 'get'}
  if (json === true) {
    json_req = true
    json_res = true
  }
  var req = new XMLHttpRequest()
  var p = new Promise(function(resolve, reject){
    var timer
    req.addEventListener('readystatechange', function(e){
      if (typeof cb_readystate === 'function') {
        cb_readystate(e)
      }
      if (req.readyState === 4) {
        clearTimeout(timer)
        if (json_res) {
          try {
            var res = JSON.parse(req.response)
          } catch(e) {
            // unable to parse res
            return reject({e, req})
          }
          return resolve(res)
        }
        return resolve(req.response)
      }
    })
    if (typeof cb_progress === 'function') {
      req.upload.addEventListener('progress', cb_progress)
    }
    req.addEventListener('error', function(e) {
      reject(e)
    })
    req.open(method, url, true)
    req.withCredentials = Boolean(cookies)
    if (json_req === true) {
      req.setRequestHeader('Content-Type', 'application/json')
    }

    if (isNaN(timeout) === false) {
      timer = setTimeout(function(){
        req.abort()
        reject(timeout+'ms timeout')
      },timeout)
    }
    if (formData) {
      return req.send(formData)
    }
    if (data === undefined || data === null) {
      return req.send()
    }
    var d = (typeof data === 'string')? data : JSON.stringify(data)
    req.send(d)
  })
  p.req = req
  p.cancel = req.abort
  return p
}

},{}],6:[function(require,module,exports){
module.exports = function(ms){
  return new Promise(function(resolve){
    setTimeout(resolve, ms)
  })
}

},{}],7:[function(require,module,exports){
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
      if (comms.ws.readyState === comms.ws.CLOSED) {
        comms.reconnect()
      }
    })
  })

  comms.on('message', function(o){
    l('message')(o)
    vm.comms__new_message(o)
  })
}


}

},{"../../server/comms.client.js":14}],8:[function(require,module,exports){
module.exports = function({data, methods}) {
  data.header = {menu: {open: false}}
  data.header.show = undefined // '/'

  methods.header__elipsis_tog = function(menu){
    menu.open = !menu.open
  }
  methods.ellipsis_clickaway = function(e, menu){
    const clickOutSideMenu = e.target.matches('.ellipsis-fullscreen.show')
    if (clickOutSideMenu) {
      menu.open = false
    }
  }

}

},{}],9:[function(require,module,exports){
function openInNewTab(url) {
  var win = window.open(url, '_blank')
  win.focus()
}
module.exports = function({data, methods, computed}) {
  data.feed__page_n = 1
  data.posts__feed = []
  data.home_loaded = false

  computed.home_title = function(){
    let vm = this
    if (vm.router.path === '/') {
      return 'fcc-pinterest'
    }
    if (vm.home_loaded === false){
      return `Getting @${vm.router.params.user_id} Posts`
    }
    return `fcc-pinterest @${vm.router.params.user_id}`
  }
  methods.home__enter = function(){
    console.log('home__enter')
    let vm = this
    vm.home__get()
  }
  methods.home__leave = function(){
    console.log('home__leave')
  }
  methods.home__get = function() {
    let vm = this
    console.log('home__get')
    var q = {
      cmd: 'posts__feed',
      page_n: vm.feed__page_n
    }
    if (vm.router.path === '/user/:user_id'){
      q.user_id = vm.router.params.user_id
    }
    console.log(q)
    comms.req(q)
    .then(function(res){
      console.log('home__get', res)
      var posts = res.docs.map(map_post)
      vm.posts__feed = posts
      vm.home_loaded = true
    })
  }
  methods.home__clear = function(){
    let vm = this
    vm.home_loaded = false
  }
  methods.has_user_hearted = function(post) {
    let vm = this
    var cond = post.hearts.find(function(heart){
      return heart.user_id = vm.user_id
    }) !== undefined
    return cond
  }
  methods.post__heart = function(post) {
    let vm = this
    if (vm.has_user_hearted(post) === false) {
      comms.send({
        cmd: 'post__heart',
        user_id: vm.user_id,
        post_id: post._id
      })
    } else {
      comms.send({
        cmd: 'post__heart_remove',
        user_id: vm.user_id,
        post_id: post._id
      })
    }
  }
  methods.ellipsis = function(text, n) {
    if (text.length > n) {
      return text.substr(0,n-3) + '...'
    }
    return text
  }
  methods.post__share_link = function(post) {
    // https://dev.twitter.com/web/tweet-button
    var url = `http//:${location.host}/img/${post.short_url}`
    var msg = `Check out @${post.user_id} image post "${post.title}" #fcc-pinterest`
    var share = `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}&url=${encodeURIComponent(url)}`
    escape(msg)
    console.log('share tick', post.title)

    openInNewTab(share)
  }

}

},{}],10:[function(require,module,exports){
module.exports = function({data, methods}){
  data.router = {}
  data.router.path = undefined
  data.router.params = {}
  data.router.paths = [
    { path: '/' },
    { path: '/user/:user_id', dynamic: true, afterCreated: function(){
      let vm = this
      vm.home__clear()
      vm.home__get()
    }},
    {
      path: '/my-account',
      loginRequired: true,
      afterCreated: function(){
        let vm = this
      }
    },
    { path: '/upload' },
    { path: '/post/:post_id', dynamic: true }
  ]

  var router__inited = false
  methods.router__init = function(){
    if (router__inited) {return}
    let vm = this
    w.on('popstate', vm.route__listener)
    vm.route__go(location.pathname, 'replaceState')
    router__inited = true
  }

  function dynamicPath_getParams(pathpattern, path) {
    var obj = {match: true, params: {}}
    function strNotEmpty(str){
      return str !== ''
    }
    var pathArr = path.split('/').filter(strNotEmpty)
    var patternArr = pathpattern.split('/').filter(strNotEmpty)

    if (pathArr.length !== patternArr.length) {
      obj.match = false
      return obj
    }
    return patternArr.reduce(function(obj, str, i){
      if (obj.match === false) {return obj}
      if (patternArr[i][0] === ':') {
        obj.params[ patternArr[i].substring(1) ] = pathArr[i]
      }
      else if (patternArr[i] !== pathArr[i]) {
        obj.match = false
      }
      return obj
    }, obj)
  }

  function path_mark(path, pathname) {
    path.tmpPath = path.path
    if (path.dynamic === true) {
      path.tmpPath = pathname
    }
    return path
  }

  methods.router_direct_path = function(pathname) {
    let vm = this
    let path = vm.router.paths.find(function(item){
      if (item.dynamic === true) {
        return dynamicPath_getParams(item.path, pathname).match === true
      }
      return pathname === item.path
    })
    if (path === undefined) {
      // redirect to '/'
      path = vm.router.paths[0]
    }
    if (path.loginRequired === true) {
      // redirect root
      if (vm.user_id === undefined){
        path = vm.router.paths[0]
      }
    }
    return Promise.resolve( path_mark(path, pathname) )
  }

  methods.route__set_path = function(item){
    let vm = this
    vm.header.show = item.path
    vm.router.path = item.path
    if (item.dynamic) {
      vm.router.params = dynamicPath_getParams(item.path, item.tmpPath).params
    } else {
      vm.router.params = {}
    }
    if (typeof item.afterCreated === 'function') {
      vm.$nextTick(function(){
        let vm = this
        item.afterCreated.call(vm)
      })
    }
  }

  methods.route__go = function(path, hist) {
    let vm = this
    return vm.router_direct_path(path).then(function(item){
      if (hist === 'pushState' && item.tmpPath === location.pathname) {
        hist = 'replaceState'
      }
      if (hist === 'pushState' || hist === 'replaceState'){
        history[hist](
          {path: item.tmpPath},
          '#booktrade '+item.tmpPath,
          item.tmpPath
        )
      }
      console.log('route__go', item.tmpPath)
      vm.route__set_path(item)
    })
  }

  methods.route__back = function() {
    var a = history.state.path
    history.go(-1)
    wait(400).then(function(){
      if (history.state === null) {
        vm.route__go('/', 'pushState')
      }
      var b = history.state.path
      if (a === b) {
        console.log('last path')
        vm.route__go('/', 'pushState')
      }
    })
  }

  methods.route__listener = function(popstate){
    let vm = this
    if (popstate.state === null) {return}
    vm.route__go(popstate.state.path)
  }

}

},{}],11:[function(require,module,exports){
module.exports = function({data, methods, computed}){
  data.sp = undefined
  data.sp_loaded = false
  data.editpen_t = true
  data.editpen_d = true
  data.sp_notfound = false

  methods.edit_focus = function(letter, bool) {
    this['editpen_'+letter] = bool
  }

  computed.sp_title = function(){
    let vm = this
    if (vm.sp_notfound === true) {
      return '404 Post /'+vm.router.params.post_id+' Not Found'
    }
    if (vm.sp_loaded === false) {
      return 'loading post...'
    }
    return `Post: "${vm.sp.title}"`
  }

  methods.sp__set = function(post) {
    let vm = this
    if (post === undefined) {
      vm.sp_notfound = true
      return
    }
    vm.sp = post
    vm.sp_loaded = true
  }

  methods.sp__enter = function() {
    let vm = this
    // load from the server
    // TODO image checking
    comms.req({cmd: 'post__get', short_url: vm.router.params.post_id}).then(function(post){
      console.log('sp_enter' ,post)
      if (vm.router.path === '/post/:post_id' &&
      post.short_url === vm.router.params.post_id) {
        vm.sp__set(post)
      }
    })
  }
  methods.post__delete = function(post) {
    let vm = this
    var a = confirm(`Are you sure you want to delete "${post.title}"`)
    if (a === true) {
      comms.req({
        cmd: 'post__remove',
        _id: post._id,
        user_id: vm.user_id
      }).then(function(res){
        console.log('post__remove', res)
        // rm from posts__feed
        // rm from posts
        // rm from sb
        vm.post__remove(res._id)
        vm.route__back()
      })
    }
  }
  methods.post__remove = function(_id) {
    function abe(o){
      return o._id === _id
    }
    var a = vm.posts__feed.findIndex(abe)
    var b = vm.posts.findIndex(abe)
    var c = vm.sp._id = _id
    if (a > -1) {
      vm.posts__feed.splice(a, 1)
    }
    if (b > -1) {
      vm.posts.splice(b, 1)
    }
    if (c) {vm.sp_notfound = true}
  }

  methods.sp__img_styl = function(post){
    var a = post.metadata
    var ratio = a.height / a.width
    var styl = {
      width: a.width,
      height: a.height
    }
    if (styl.width > 600) {
      styl.width = 600
      styl.height = 600 * ratio
    }
    styl.width = styl.width+ 'px'
    styl.height = styl.height+ 'px'
    console.log(styl)
    return styl
  }

  methods.sp__leave = function(){
    let vm = this
    vm.sp__clear()
  }
  methods.sp__clear = function(){
    let vm = this
    vm.sp_loaded = false
    vm.sp_notfound = false
  }
}

},{}],12:[function(require,module,exports){
var comms = require('../../server/comms.client.js')
module.exports = function({data, methods, computed}) {
  data.iup = {dragging_file: false}
  data.posts = []
  computed.post_uploads = function(){
    let vm = this
    return vm.posts.filter(function(post){
      return post.upload_complete === false && post.user_id === vm.user_id
    })
  }


  methods.upload_image = function({file, post}) {
    let vm = this
    var formData = new FormData()
    formData.append('user_id', vm.user_id)
    formData.append('image', file)
    req({
      method: 'post',
      url: '/upload_image',
      cookies: true,
      formData,
      json_res: true,
      cb_progress: function(e) {
        vm.upload_set_progress(e, post)
      }
    }).then(function(res){
      vm.upload_complete({
        server_post: res,
        client_post: post
      })
    })
  }

  methods.upload_set_progress = function(e, post){
    let vm = this
    post.uploaded.bytes = e.loaded
  }

  methods.upload_complete = function({server_post, client_post}) {
    vm.loadImageSrc('/img/'+server_post.short_url).then(function(){
      server_post.src = '/img/'+server_post.short_url
    }).then(function(){
      var i = vm.posts.findIndex(function(o){
        return o === client_post
      })
      Vue.set(vm.posts, i, server_post)
      console.log('upload_image res', server_post)
    })
  }


  methods.is_fileuploaded = function(post) {
    return post.file_upload_complete || post.uploaded.bytes >= post.metadata.size
  }

  methods.preload__files = function(e) {
    let vm = this
    Array.prototype.forEach.call(e.target.files, function(file){
      return vm.preload__file(file)
    })
  }
  methods.preload__file = function(file) {
    var post = {
      title: file.name,
      user_id: vm.user_id,
      file_upload_complete: false,
      upload_complete: false,
      metadata: {
        size: file.size
      },
      uploaded: {}
    }
    var src = undefined
    vm.loadImageFile(file)
    .then(function(e){
      src = e.target.result
      post.metadata.height = e.target.height
      post.metadata.width = e.target.width
      return vm.loadImageSrc(src)
    })
    .then(function(e){
      post.src = src
      post.uploaded.bytes = 0
      post.uploaded.percent = 0
      vm.posts.push(post)
      vm.upload_image({file, post})
    })
    .catch(function(err){
      // not a image, or image loading error
    })
  }


  methods.loadImageFile = function(file) {
    // http://stackoverflow.com/questions/4459379/preview-an-image-before-it-is-uploaded
    var reader = new FileReader()
    return new Promise(function(resolve, reject){
      reader.onload = function(e){
        resolve(e)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  methods.loadImageSrc = function(src) {
    var img = document.createElement('img')
    return new Promise(function(resolve, reject){
      img.onload = resolve
      img.onerror = reject
      img.src = src
    })
  }
  methods.filesize = function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    var n = bytes
    var i = 0

    while (n > 1000 && i < sizes.length -1) {
      n = n / 1000
      i++
    }
    var dp = (i === 0) ? 0 : 1
    return n.toFixed(dp)+' '+sizes[i]
  }
  methods.toPercentString = function(a,b) {
    var n = a / b
    var n = (n * 100).toFixed(1)
    if (n >= 100) {n = '100'}
    return n + '%'
  }
  methods.post__percent = function(post) {
    if (post.uploaded === undefined) {
      return '100%'
    }
    return vm.toPercentString(post.uploaded.bytes, post.metadata.size)
  }

  methods.upload__dragenter = function(e){
    console.log('drag')
    let vm = this
    vm.iup.dragging_file = true
  }
  methods.upload__dragleave = function(e){
    console.log('drag leave')
    let vm = this
    vm.iup.dragging_file = false
  }

  methods.gif__freeze = function(el) {
    var c = document.createElement('canvas')
    var w = c.width = el.width
    var h = c.height = el.height
    c.getContext('2d').drawImage(el, 0, 0, w, h)

    el.dataset.giff_src = el.src
    el.src = c.toDataURL('image/gif')

    for (var j = 0, a; a = el.attributes[j]; j++) {
      c.setAttribute(a.name, a.value)
    }
  }
  methods.gif__unfreeze = function(el) {
    el.src = el.dataset.giff_src
  }


  methods.post__update = function(post) {
    w.comms.send({cmd: 'post__update', post})
  }
  // function randRange(min, max) {
  //   return Math.floor( Math.random() * (max+1 - min) + min )
  // }
  // methods.fake_upload = function(post) {
  //   var a = post.upload
  //   a.bytes_uploaded += randRange(25000, 1024000)
  //   if (a.bytes_uploaded > a.file.bytes) {
  //     a.bytes_uploaded = a.file.bytes
  //   }
  //   return wait(randRange(200, 500))
  // }
  // methods.loopPromise = function(prom, breakFn) {
  //   let vm = this
  //   return prom().then(function(res){
  //     var cond = breakFn.call(vm, res)
  //     if (cond === true) {return}
  //     return vm.loopPromise(prom, breakFn)
  //   })
  // }


}

},{"../../server/comms.client.js":14}],13:[function(require,module,exports){
module.exports = function({data, methods}) {
  data.user_id = undefined
  data.user__got_login = false

  methods.user__logout = function() {
    let vm = this
    return req({
      method: 'post',
      url: '/tw.logout',
      json: true
    }).then(function(res){
      if (res.logout === true) {
        vm.user_id = undefined
        vm.route__go('/', 'pushState')
      }
    })
  }


  methods.user__settings_click = function(){
    let vm = this
    vm.header.menu.open = false
    vm.route__go('/my-account', 'pushState')
  }
  methods.user__logout_btn = function() {
    let vm = this
    vm.header.menu.open = false
    vm.user__logout()
  }
}

},{}],14:[function(require,module,exports){
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

},{"../app/lib/eventSystem.js":2}]},{},[1]);
