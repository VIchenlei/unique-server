let config = require('./bin/config/appconfig.js')
config.FileDir.root = __dirname || '/'

let server = require('./bin/main.js')
server.start()