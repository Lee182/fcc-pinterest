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
