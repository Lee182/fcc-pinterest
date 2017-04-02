const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'//-._$~`
const l = alphabet.length

function n2arr(n) {
  let ans = []
  while (n > 0){
    let tmp = Math.ceil( (n/Math.pow(l, ans.length)) % l )
    if (tmp === 0) {tmp = l}
    n = n - tmp*Math.pow(l,ans.length)
    ans.unshift(tmp)
  }
  return ans
}

function arr2n(arr){
  return arr.reverse().reduce(function(ans, n, i){
    ans += n*Math.pow(l,i)
    return ans
  }, 0)
}

function encodearr(arr){
  return arr.reduce(function(str, n){
    return str + alphabet[n-1]
  }, '')
}

function decodestr(str){
  let fail = []
  let arr = str.split('').map(function(char){
    let i = alphabet.indexOf(char)
    if (i === -1) { fail.push(char) }
    return i+1
  })
  if (fail.length !== 0) {return false}
  return arr
}

module.exports = {
  forward: function(n){
    return encodearr( n2arr(n) )
  },
  reverse: function(str){
    var tmp = decodestr(str)
    if (tmp === false) {return Error('a character not part of alphabet')}
    return arr2n( tmp )
  }
}
