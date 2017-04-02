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
