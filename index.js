let config = require('./src/config/appconfig.js')
config.FileDir.root = __dirname || '/'

let server = require('./src/main.js')
server.start()