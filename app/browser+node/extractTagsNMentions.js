function extractTagsNMentions(str) {
  var type = 'plain' // current tag
  return str.split('').reduce(function(arr, char, i){
    if (char === '#') {
      if (type === 'tag') {
        arr.push({
          type, text: ''
        })
      }
      type = 'tag'
    }

    if (char === '@') {
      if (type === 'mention') {
        arr.push({
          type, text: ''
        })
      }
      type = 'mention'
    }

    if (char === ' ' && type !== 'plain') {
      type = 'plain'
    }
    if (arr.length === 0) {
      arr.push({
        type, text: ''
      })
    }
    if ( arr[arr.length-1].type === type) {
      arr[arr.length-1].text += char
    } else {
      arr.push({
        type, text: char
      })
    }
    return arr
  }, [])
}

function extractAsObject(arr) {
  var o = {
    description: '',
    tags: [],
    mentions: []
  }
  o.description = arr.reduce(function(str, item){
    return str += item.text
  },'')

  arr.filter(function(item){
    if (item.type !== 'plain') {
      var a = item.text.substr(1)
      if (a !== '')
      o[item.type + 's'].push( a )
    }
  })
  return o
}


module.exports = {
  toArray: extractTagsNMentions,
  toObj: function(str) {
    return extractAsObject( extractTagsNMentions(str) )
  }
}
