// https://apps.twitter.com/app/new
const logtwit = require('login-with-twitter')
const es = require('../app/lib/eventSystem.js')

module.exports = function({dao, port, coll_name, consumerKey, consumerSecret, callbackUrl}) {

const events = es()

const tw = new logtwit({
  consumerKey,
  consumerSecret,
  callbackUrl
})

_tw_tokens = {}
function login(req,res,next){
  tw.login(function(err, tokenSecret, url){
    // console.log('tw.login', err, tokenSecret, url)
    if (err) {
      return res.redirect('/')
    }
    var oauth_token = url.split('oauth_token=')[1]
    _tw_tokens[oauth_token] = tokenSecret
    res.redirect(url)
  })
}

function login_cb(req, res, next){
  var oauth_token = req.query.oauth_token
  var oauth_token_secret = _tw_tokens[oauth_token]
  if (oauth_token_secret === undefined) {
    req.twerr = 'no oauth_token_secret'
    return next()
  }
  tw.callback({
    oauth_token,
    oauth_verifier: req.query.oauth_verifier
  },
  oauth_token_secret,
  function(err, user){
    // console.log('tw.callback', err, user)
    if (err) {return next(err)}
    delete _tw_tokens[oauth_token]
    res.cookie('twitter', user.userToken,
      {expires: new Date(Date.now()+(1000*60*60*24*360)), httpOnly: true})
    dao.db.collection(coll_name)
    .findOneAndUpdate(
      {_id: user.userToken},
      {$set: {
        creation_date: new Date(),
        user_id: user.userName
      }},
      {upsert: true, returnOriginal: false})
    .then(function(result){
      console.log('tw', result)
      req.twuser = user.userName
      next()
    })
    .catch(function(err){
      // console.log(err.message)
      return next(err)
    })
  })
}

function logout(req, res, next){
  // console.log('tw.logout',req.cookies)
  events.emit('logout', {user_id: req.twuser, req: req})
  dao.db.collection(coll_name).remove({
    _id: req.cookies.twitter
  }).then(function(a){
    // console.log(a.result.n, 'removed session')
  })
  res.clearCookie('twitter', { path: '/' })
  res.json({logout: true})
}

function is_logged_in(req, res, next){
  if (req.cookies === undefined || req.cookies.twitter === undefined) {
    return res.sendStatus(400)
  }
  is_logged_in_prom(req.cookies.twitter)
  .then(function(result){
    if (result === undefined) {
      return res.clearCookie('twitter', { path: '/' })
    }
    req.twuser = result.user_id
    next()
  })
  .catch(function(err){
    next()
  })
}

function is_logged_in_prom(cookie) {
  return dao.db.collection(coll_name).findOne({
    _id: cookie,
  }).then(function(result){
    return result === null ? undefined : result
  })
}

return {
  login,
  login_cb,
  logout,
  is_logged_in,
  is_logged_in_prom,
  events
}


}

/* Usage
app.get('/twitter', tw.login)
  // populates req.twerr
  // redirects user to twitter.com
app.get('/twitter-callback', tw.login_cb)
  // populates req.twuser or req.twerr
  // stores data in mongodb collection
app.post('/twitter-logout')
  // clears the twitter cookie
*/
