var image_post = {
  _id: 'image_post1'
  user_id: 'JonoLee1'
  upload_complete: false
  short_url: 'abc',
  title: '', // 80 chars limit
  description: '', // 1000 chars limit
  tags: [''],
  mentions: ['']
}

var comment = {
  _id: 'comment_post1'
  image_id: 'image_post1',
  comment_id: []
  user_id: 'JessBerry',
  short_url: 'abc',
  message: 'That image is so cool', // 140 chars limit
  tags: [''],
  mentions: ['']
  replyLvl: 0
}

var commentReply = {
  image_id: 'image_post1',
  user_id: 'JonoLee1',
  comment_id: ['comment_post1']
  short_url: 'abd',
  message: 'All Just a bit of photoshop',
  tags: [''],
  mentions: ['']
  replyLvl: 1
}


var post_client = {
  // server stuff +
  creation_date: 'client gets timestamp from _id'
  // https://steveridout.github.io/mongo-object-time/
  img_src: 'img/ + post.shorturl'
  browser_loaded_src: false,
  // client use loadImageUrl and then set true if no error
}
