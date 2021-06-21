import metadata from './meta_definition.js'
import mysql from './MysqlWraper.js'
import net from 'net'

const IP = '192.168.0.247'
const CLIENT_PORT = 9813
export default class Meta {
  constructor (metaMsg) {
    const { metaStore, io } = metaMsg || {}
    this.metaStore = metaStore
    this.io = io
  }

  emit (event, res) {
    // console.log('发送给client数据：', res)
    this.io.emit(event, res)
  }

  composeMetaMessage (def, rows, upMethod) {
    let message = null
    if (rows && rows.length > 0) {
      // JSON中，定义属性的方式有两种：一种是o.f，另外一种是o[f]。第一种f不能为变量，第二种f可以为变量.
      message = {
        code: 0,
        msg: 'OK',
        cmd: 'meta_data',
        upMethod: upMethod,
        data: {
          name: def && def.name,
          key: def && def.key,
          rows: rows
        }
      }
      // console.log(message)
    } else {
      message = {
        code: 0,
        msg: '没有符合条件的记录。',
        cmd: 'meta_data',
        data: {
          name: def.name
        }
      }
    }

    return message
  }

  async sendMetaData (socket, def) {
    // 这里需要等待 getMetaData 返回才能执行后续的逻辑，所以要使用 await
    const self = this
    let a = ''
    let tcpClient = new net.Socket()
    tcpClient.connect(CLIENT_PORT, IP, () => {
      tcpClient.write(`{"cmd" : "get_all_${def.name}"}\0`)
      a = ''
    })

    tcpClient.on('data', (tdata) => {
      let b = tdata.toString()
      a = a + b
      if (b.includes('}]}')) {
          let c = a.slice(0, -1)
          let result = JSON.parse(c)
          let rows = result.data
          this.metaStore.saveMetaData(def.name, rows)
          let message = this.composeMetaMessage(def, rows)
          if (socket === null && !this.io) {
            return message
          }
          this.sendMetaMessage(socket, message)
          // console.log('message', message)
          // console.log(`meta: ${def.name}, count: ${rows ? rows.length : 0}`)
          tcpClient.end()
      }  
    })

    tcpClient.on('end', () => {
      a = ''
      // console.log('连接结束')
    })
  }

  sendMetaMessage (socket, message) {
    socket ? socket.emit('META', message) : this.emit('META', message)
  }

  sendDataTable (socket) {
    const promises = []
    // const keys = Object.keys(metadata)
    const keys = [
      {name: 'staffs', key: 'staff_id'},
      {name: 'dept', key: 'id'},
      {name: 'area', key: 'id'},
      {name: 'map', key: 'id'}
    ]
    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i]
      const p = this.sendMetaData(socket, key)
    }

    return promises
  }

  getMetaCacheData () {
    let promises = this.sendDataTable(null) // 发送meta_dat中的数据，基础表更新或删除
    Promise.all(promises).then(() => {
      console.log(`>>>> Send all meta data DONE.`)
    }).catch((err) => {
      console.log(`>>>> Send all meta data FAILED.\n`, err)
    })
    // let resMsg = {
    //   cmd: 'meta_data',
    //   data: this.metaStore.data
    // }

    // this.emit('META', resMsg)
  }

  sendMetaDefinition (socket) {
    if (socket === null) {
      // console.log('metaDefinition is ' + JSON.stringify(metaDefinition))
      return metadata
    }

    let message = {
      cmd: 'meta_definition',
      data: metadata,
      length: Object.keys(metadata).length
    }
    console.log('>>>>>>>>>>>>' + message.length)
    // this.sendMetaMessage(socket, message)
  }
}