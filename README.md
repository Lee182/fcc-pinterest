# fcc pinterest clone

Tasks TODO.
  - feature boostrap copy from bookclub project
  - feature login  with twitter
    - DO copy from bookclub
  - feature upload images
    - DO set up ws backend
    - DO set up ws send binary data
    - DO use browser file api, base64 encoding?
    - DO sever fs.createWriteStream for binary data
    - or use an express libary like multer
    - then
    - DO only accept upto 2MB of image
    - DO compress image with sharp libary
  - feature path /image/:_id
    - DO copy router code from bookclub
      - html header
      - html stage
      - modules/router.js
      - single_book view ie with loader.
  - menu to delete image, closed position relative
    - open option delete image
      - option opens up a confirm prompt
    - optional undo delete
  - feature pininterest style wall
    - search and learn howto use masonryjs
  - DO image can be liked
    - images have structure
      ```{
        _id: mongo_generated id,

      }```
    - likes are kept in another monogdb collection
    - likes have structure
      ```{
        _id: image_id
          [ user_id, creation_date ...]
        count: 3
      }```
    - use monogodb lookup to get the likes
    -
  - DO image can be unliked
  - DO image can be shared via twitter
  - DO image can have comments from others users



changed
  modules/home.pug
  modules/home.js
  modules/home.styl

  server/upload_image
  server/short_url
  images/

  html 'Choose a image file' to accept multiple images.
  html add save button to unfinished post.
  store notifications in user db
