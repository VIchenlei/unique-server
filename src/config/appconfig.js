const path = require('path')

const APP_ROOT = path.resolve(__dirname, '../../..')
const SERVER_ROOT = path.resolve(APP_ROOT, `./unique-server`)

const CLIENT_ROOT = path.resolve(APP_ROOT, `./unique-client`)

const CLIENT_STATIC_ROOT = path.resolve(CLIENT_ROOT, `./dist`); // 静态资源目录
const RESOURCE_ROOT = path.resolve(CLIENT_STATIC_ROOT, './resource')

const config = {
  port: 9000,
  CLIENT_STATIC_DIR: CLIENT_STATIC_ROOT, // 静态资源目录
  FileDir: {
    staff: `${RESOURCE_ROOT}/staff`
  }
}

module.exports = config