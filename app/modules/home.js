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
      return heart.user_id === vm.user_id
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
