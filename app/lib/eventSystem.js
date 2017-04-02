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
