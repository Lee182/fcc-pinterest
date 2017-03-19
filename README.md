# fcc pinterest clone

Tasks TODO.
  - feature boostrap copy from bookclub project
  - feature login  with twitter
    - DO copy from bookclub
  - feature upload images
    - DO set up ws backend
    - DO set up ws send binary data
    - DO fs.createReadStream for binary data
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
