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
