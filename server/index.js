const express = require('express')
const app = express()
const http = require('http')
const path = require('path')
const server = http.Server(app)
const port = process.env.PORT || 3000
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
  var cookie_parser = cookieParser()

const k = require('./keys.js')
var dao = require('./db.js')({ mongourl: k.mongourl })
var handle_comms = require('./handle_comms.js')

app.use( cookie_parser )
app.use( bodyParser.json() )
app.use('/', express.static(path.resolve(__dirname + '/../dist')))


var tw = require('./twitter_session')({
  dao,
  port,
  coll_name: 'pinterest_sessions',
  consumerKey: k.twitter.consumerKey,
  consumerSecret: k.twitter.consumerSecret,
  callbackUrl: 'http://fcc-pin.blogjono.com/tw.login-cb'
})
app.get('/tw.login', tw.login)
app.get('/tw.login_cb', tw.login_cb, function(req,res,next){
  if (req.twuser === undefined) {
    return res.redirect('/')
  }
  dao.user__findOne({user_id: req.twuser})
  .then(function(user){
    if (user === undefined) {
      return dao.user__add({user_id: req.twuser})
    }
    return user
  })
  .then(function(user){
    console.log(user)
    tw.events.emit('login', {user_id: req.twuser, req: req})
    res.redirect('/')
  })
})
app.post('/tw.logout', tw.is_logged_in, tw.logout)


handle_comms({app, server, tw, dao, cookie_parser})


app.get('*', function(req,res,next){
  res.sendFile(path.resolve(__dirname + '/../dist/index.html') )
})

dao.connect().then(function(){
  server.listen(port, function(){
    console.log('server listening at http://localhost:'+port)
  })
})
