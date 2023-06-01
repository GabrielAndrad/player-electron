const socket  = require('./socket');

Track = (msg) => {
    socket.sendLog(msg);
}

module.exports = Track