const post = require('./api').post
const socket = require('./socket')

LogError = async (videoId ,msg,pin) => {
  try{   
      Analysis(msg);
          post(`Log/error`, { Pin: pin, VideoId: videoId, Msg: msg }, () => {})

  }catch (err) {
      Analysis(err);
  }
}

Analysis = (msg) => {
  socket.sendLog(msg);
}

module.exports = {LogError,Analysis}