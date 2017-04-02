const MB = 1000000

const fileUpload = require('express-fileupload')
const file2MBUpload = fileUpload({
  limits: {
    fileSize: 2*MB
  }
})
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const short_url = require('./short_url')

const es = require('../app/lib/eventSystem.js')
const extractTags = require('../app/browser+node/extractTagsNMentions.js')

function userIsOwner(req,res,next) {
  if (req.twuser !== req.body.user_id) {
    return res.json({err: 'not your image'})
  }
  next()
}
function getPath(_id) {
  return path.join(__dirname, '../', 'images', _id)
}

module.exports = function({app, tw, dao}) {
  const events = es()
  // event list
  allevents = [
    'post__blank',
    'post__store_metadata',
    'post__update',
    'post__remove',
    'comment',
    'comment__remove',
    'post__heart',
    'poll__heart_remove',
    'post__heart_remove_all',
    'user__add',
    'user__remove',
    'user__permantly_remove'
  ]
  var o = dao
  var imageUploadPipe = [tw.is_logged_in, file2MBUpload, imageUploadFs]

  app.post('/upload_image', imageUploadPipe)

  app.get('/img/:short_url', function(req, res){
    o.post__get({
      short_url: req.params.short_url
    })
    .then(function(post){
      if (post === undefined) {
        return res.status(404).send(null)
      }
      res.redirect('/img_id/'+post._id+'/'+post.metadata.format)
    })
  })
  app.get('/img_id/:_id/:format', function(req,res){
    res.set('Content-Type', 'image/'+req.params.format)
    return o.retrieve__FS_data(req.params._id)
    .then(function(stream){
      stream.pipe(res)
    })
  })


  function imageUploadFs(req,res){
    const file = req.files.image
    const image = sharp(file.data)
    var _id = undefined
    o.post__blank({user_id: req.twuser, title: file.name, type: 'image'})
    .then(function(post){
      _id = post._id.toString()
      return o.store_FS_sharp_image({image, filename: _id})
    })
    .then(function(metadata){
      return o.post__store_metadata({_id, metadata})
    })
    .then(function(result){
      res.json(result)
    })
  }

  o.is_user__post_owner = function({_id, user_id}) {
    o.db.collection('pinterest_posts')
    .findOne({_id, user_id}, {_id: 1, user_id: 1})
    .then(function(post){
      return post ? true : false
    })
  }
  o.post__get = function({_id, short_url}) {
    console.log("post_get...", _id, short_url)
    var q = {}
    if (short_url) {q.short_url = short_url}
    if (_id) {q._id = _id}
    if (_id === undefined && short_url === undefined){
      return Promise.resovle(undefined)
    }
    console.log(q)

    return o.db.collection('pinterest_posts')
    .findOne(q)
    .then(function(res){
      console.log("herer", res)
      return res ? res : undefined
    })
  }
  o.post__blank = function({user_id, title, type}){
    if (title === undefined) {title = ''}
    o.post_count++
    console.log('upload_image__start', title, o.post_count)
    var rand_id = short_url.forward( ( Math.floor(Date.now() / 1000)*100 ) + ( Math.floor(Math.random()*100) ) )
    return o.db.collection('pinterest_posts')
    .insert({
        user_id,
        file_upload_complete: false,
        upload_complete: false,
        short_url: rand_id,
        title: title.substr(0,80), // 80 chars limit
        description: '', // 1000 chars limit
        tags: [],
        mentions: [],
        hearts: []
      },
      {returnOriginal: false})
    .then(function(res){
      events.emit('post__blank', res.ops[0])
      return res.ops[0]
    })
  }

  o.store_FS_sharp_image = function({image, filename}) {
    return image.toFile( getPath(filename) )
  }
  o.retrieve__FS_data = function(_id) {
    return new Promise(function(resolve, reject){
      resolve(  fs.createReadStream( getPath(_id) ) )
    })
  }
  o.post__store_metadata = function({_id, metadata}) {
    return o.db.collection('pinterest_posts')
    .findOneAndUpdate(
      {_id: o.ObjectId(_id)},
      {$set: {metadata, file_upload_complete: true}},
      {returnOriginal: false})
    .then(function(result){
      events.emit('post__store_metadata', result)
      return result.value
    })
  }


  function db_paging({db, coll, query, project, limit, page_n, sort}) {
    if (limit === undefined) {limit = 30}
    if (page_n === undefined) {page_n = 1}
    if (sort === undefined) {sort = {_id: -1}} // most recent
    if (project === undefined) {project = {}}
    var skip = (page_n - 1) * limit

    return db.collection(coll)
    .find(query, project)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .toArray()
    .then(function(docs){
      return {
        docs,
        limit,
        page_n,
        query
      }
    })
  }
  o.posts__feed = function({page_n, user_id}){
    var q = {upload_complete: true}
    if (user_id) {q.user_id = user_id}
    return db_paging({
      db: o.db,
      coll: 'pinterest_posts',
      query: q,
      page_n: 1,
      limit: 30
    })
  }

  o.post__update = function(post){
    var $set = {upload_complete: true}
    if (typeof post.title === 'string') {
      $set.title = post.title.substr(0, 80).trim()
    }
    if (typeof post.description === 'string') {
      var b = post.description.substr(0, 1000)
      var a = extractTags.toObj(b)

      $set.description = a.description.trim()
      $set.mentions = a.mentions
      $set.tags = a.tags
    }
    return o.db.collection('pinterest_posts')
    .findOneAndUpdate(
      {_id: dao.ObjectId(post._id), user_id: post.user_id},
      {$set},
      {returnOriginal: false, upsert: false}
    )
    .then(function(result){
      events.emit('post__update', result.value)
      return result.value
    })
  }

  o.post__remove_file = function({_id}) {
    return new Promise(function(resolve, reject){
      fs.unlink(getPath(_id), function(err, removed){
        resolve({_id, removed: true})
      })
    })
  }
  o.post__remove_post = function({_id}) {
    return o.db.collection('pinterest_posts')
    .remove({_id})
    .then(function(){
      return {_id, removed: true}
    })
  }
  o.post__remove_all_comments = function({post_id}) {
    return o.db.collection('pinterest_comments')
    .remove({post_id})
    .then(function(){
      return {_id: post_id, removed: true}
    })
  }
  o.post__remove = function({_id}){
    return Promise.all([
      o.post__remove_post({_id: o.ObjectId(_id)}),
      o.post__remove_all_comments({post_id: _id}),
      o.post__remove_file({_id}),
    ]).then(function(result){
      events.emit('post__remove', {_id, result})
      return {_id, result}
    })
  }

  o.post__comment = function({comment}){
    // TODO validate comment
    /*
      _id: 'Non existant'
      post_id,
      user_id: 'JessBerry',
      short_url: 'abc',
      message: 'That image is so cool', // 140 chars limit
      replyLvl: 0
    */
    comment.message = comment.message.substr(0, 140)
    var a = extractTags.toObj(comment.message)
    comment.tags = a.tags
    comment.mentions = a.mentions
    return o.db.collection('pinterest_comments')
    .insert(comment, {returnOriginal: false})
    .then(function(res){
      events.emit('comment', {comment})
      return res.ops[0]
    })
  }
  o.post__comment__get = function({_id}) {
    return o.db.collection('pinterest_comments')
    .findOne({_id: comment_replyingto_id})
    .then(function(result){
      if (!result) {return undefined}
      return result
    })
  }
  o.post__comment__reply = function({reply_comment_id, comment}) {
    return o.post__comment_get(reply_comment_id)
    .then(function(res){
      if (res === undefined) {
        return Promise.reject({err: 'comment does not exists'})
      }
      comment.comment_id = res.comment_id.push(res._id)
      comment.replyLvl = res.replyLvl+1
      return o.post__comment(comment)
    })
  }
  o.post__comment__remove = function({_id}) {
    return o.db.collection('pinterest_comments')
    .remove({_id: o.ObjectId(_id)})
    .then(function(result){
      events.emit('comment__remove', {_id})
    })
  }

  o.post__comments__get = function({post_id, page_n}) {
    return db_paging({
      db: o.db,
      coll: 'pinterest_comments',
      query: {post_id},
      limit: 30,
      page_n
    })
  }
  o.post__comments__expand = function({comment_id}) {
    return o.post__comments__get({comment_id}, 0)
  }

  o.post__heart = function({_id, user_id}) {
    var heart = {user_id, creation_date: new Date()}
    return o.db.collection('pinterest_posts')
    .findOneAndUpdate(
      {_id: o.ObjectId(_id), 'hearts.user_id': {$ne: user_id} },
      {$push: {hearts: heart } },
      {returnOriginal: false})
    .then(function(result){
      console.log('post__heart', result.value)
      events.emit('post__update', result.value)
      return result.value
    })
  }
  o.post__heart_remove = function({_id, user_id}) {
    return o.db.collection('pinterest_posts')
    .findOneAndUpdate(
      {_id: o.ObjectId(_id)},
      {$pull: {hearts: {user_id} } },
      {returnOriginal: false})
    .then(function(result){
      console.log('post__heart_remove', result.value)
      events.emit('post__update', result.value)
      return result.value
    })
  }
  o.post__heart_remove_all = function({user_id}) {
    return o.db.collection('pinterest_posts')
    .update(
      {},
      {$pull: {'hearts.user_id': user_id} }
    )
    .then(function(result){
      events.emit('post__heart_remove_all', user_id)
      console.log('poll__heart_remove_all', {user_id})
      return result
    })
  }
  o.post__hearts__get_posts = function({user_id, page_n}){
    return db_paging({
      db: o.db,
      coll: 'pinterest_comments',
      query: {'hearts.user_id': user_id},
      limit: 30,
      page_n
    })
  }

  o.user__findOne = function({user_id}){
    return o.db.collection('pinterest_users').findOne({_id:user_id})
    .then(function(user){
      return (user === null) ? undefined : user
    })
  }
  o.user__add = function({user_id}) {
    // TODO make sure user_id valid
    return o.db.collection('pinterest_users').insert(
      {_id: user_id},
      {returnOriginal: false}
    ).then(function(res){
      events.emit('user__add', res.ops[0])
      return res.ops[0]
    })
  }
  o.user__remove = function({user_id}) {
    return o.db.collection('pinterest_users')
    .remove({_id: user_id})
    .then(function(res){
      console.log('user__remove', res)
      events.emit('user__remove', {_id: user_id})
      return res
    })
  }
  o.user__permantly_remove = function({user_id}) {
    // remove all files
    o.db.collection('pinterest_posts')
    .find({user_id}, {_id:1})
    .toArray(function(_ids){
      var proms = _ids.map(function(_id){
        return o.post__remove_file(_id)
      })
      // TODO promise batch
      return Promise.all(proms)
    }).then(function(){
      // remove all posts
      return o.db.collection('pinterest_posts')
      .remove({user_id})
    }).then(function(){
      // remove all comments
      return o.db.collection('pinterest_comments')
      .remove({user_id})
    }).then(function(){
      // remove hearts on posts
      return o.post__heart_remove_all({user_id})
    }).then(function(){
      // then remove user_account
      return o.user_remove({user_id})
    })
    .then(function(){
      events.emit('user__permantly_remove', {user_id})
    })
  }

  return events
}
