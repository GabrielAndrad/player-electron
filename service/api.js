const request = require('request')
const api = require('../settings')
const localStorage = require('localStorage')

const post = (url,json,callback) => {
  token = localStorage.getItem('token')

  const req = {
    url:`${api.baseApi}${url}`,
    json,
    headers: {Authorization: "Bearer " + token,acceptRanges: false,Range: 'bytes=0-65536'}
  }
  request.post(req,(error,response,body) => {
    callback(error, response, body)
  })

}


const requestApi = (url,token,callback) => {
  const req = {
    url:`${api.baseApi}${url}`,
  }

  if(token){
    req.headers = {Authorization: "Bearer " + token,acceptRanges: false,Range: 'bytes=0-65536'}
  }
  request(req,(error,response,body) => {
    callback(error, response, body)
  })
} 

module.exports =  { post,requestApi }
