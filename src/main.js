import User from './User.js'
import UserList from './UserList.js'
import TcpService from './TcpService.js'
import UdpService from './UdpService.js'
import ChannelStore from './ChannelStore.js'
import PicStore from './PicStore.js'
import Meta from './Meta.js'
import MetaStore from './MetaStore.js'
import config from './config/appConfig'

const Koa = require('koa')
const app = new Koa()
const http = require('http')
const server = http.createServer(app.callback())
const io = require('socket.io')(server)
const cluster = require('cluster')
const channelStore = new ChannelStore(io)
const userList = new UserList()
const tcpService = new TcpService(channelStore)
const udpService = new UdpService(channelStore)
const picStore = new PicStore()
const metaStore = new MetaStore()
const meta = new Meta({metaStore, io})
app.use(require('koa-static')(`${config.CLIENT_STATIC_DIR}`))

const serverIP = '0.0.0.0'
const serverPort = 9000
io.on('connection', socket => {
  const userObj = new User({io, socket, userList, tcpService, channelStore, picStore, metaStore, meta})
})

function onWorkersMessage (msg) {
  tcpService.schoolDeviceTime()
}

function schoolTime () {
  process.send({
    cmd: 'school_time',
    code: 0
  })
}

function checkPic () {
  picStore.checkPic()
}

function getStaffs () {
  picStore.getStaffs()
}

function getMetaData () {
  meta.getMetaCacheData()
}

exports.start = () => {
  if (cluster.isMaster) {
    server.listen(serverPort, serverIP, () => {
      console.log(`Web server started at ${serverIP}:${serverPort}`)
    })
  
    tcpService.startUpService(channelStore)
    udpService.startUpService(channelStore)

    cluster.fork()

    for (let id in cluster.workers) {
      cluster.workers[id].on('message', (msg) => {
        if (msg.cmd === 'school_time') {
          onWorkersMessage(msg)
        }
      })
    }

    cluster.on('exit', (worker) => {
      console.log(`工作进程 ${worker.process.pid} 已退出`)
    })

    // getStaffs()
    // setInterval(getStaffs, 30 * 60 * 1000)

    getMetaData()
    setInterval(getMetaData,  30 * 10 * 1000)
  } else {
    schoolTime()
    setInterval(schoolTime, 24 * 60 * 60 * 1000)

    checkPic()
    setInterval(checkPic, 24 * 60 * 60 * 1000)
  }
}
