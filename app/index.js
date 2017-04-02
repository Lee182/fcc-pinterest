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
