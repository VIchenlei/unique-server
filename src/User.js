import Utils from './Utils.js'
import mysql from './MysqlWraper.js'
import Meta from './Meta.js'

export default class User {
  constructor ({io, socket, userList, tcpService, channelStore, picStore, metaStore, meta}) {
    if (socket) {
      this.userList = userList
      this.io = io
      this.bind(socket)
      // this.meta = new Meta()
      this.tcpService = tcpService
      this.name = null
      this.channelStore = channelStore
      this.picStore = picStore
      this.metaStore = metaStore
      this.meta = meta
    }
  }

  bind (socket) {
    this.socket = socket
    this.registerEventHandler(this.socket)
  }

  registerEventHandler (socket) {
    if (!socket) {
      console.warn('注册事件处理器失败：没有可用的网络连接！')
      return
    }

    socket.on('USER', (req, cb) => {
      // console.log(`Got USER message : \n\t${JSON.stringify(req)}`)

      req = Utils.toJson(req)
      if (!req) {
        console.warn('Invalid request.', req)
        return
      }

      const {cmd} = req
      switch (cmd) {
        case 'login':
          this.login(req, cb)
          break
      }
    })

    socket.on('CHANNEL', (req, cb) => {
      req = Utils.toJson(req)
      if (!req) {
        console.warn('Invalid request.', req)
        return
      }

      const {cmd, data} = req
      switch (cmd) {
        case 'open_channel':
          this.openChannel(data)
          break
      }
    })

    socket.on('PUSH', (req) => {
      let self = this
      req = Utils.toJson(req)
      if (!req) {
        console.warn('Invalid request.')
        return
      }

      let datas = Utils.toJson(req.data)
      let cmd = req.cmd
      if (cmd === 'pos_map') {
        let sNumber = datas.s.detail.length;
        let vNumber = datas.v.detail.length;
        let sStat = datas.s.stat.glbl;
        let sDetail = datas.s.detail;
        if (sNumber !== 0 || vNumber !== 0) {
          self.io.emit('PUSH', {
            cmd: 'pos_map',
            code: 0,
            data: { sNumber, vNumber, sStat, sDetail }
          });
        }
      }

      if (cmd === 'leader_arrange' && datas) {
        let names = datas.map((item)=> {
          let staff = this.metaStore.staffs.get(item.card_id) ? this.metaStore.staffs.get(item.card_id) : false;
          let dealStaff = {}
          return staff ? Object.assign(dealStaff, staff, item) : staff;
        })
        self.io.emit('PUSH', {
          cmd,
          code: 0,
          data: {names}
        })
      }
    })
  }

  async login (req, callback) {
    const {data} = req
    const {user_name, user_pass} = data
    let sql = `select user_id, dept_id, role_id, access_id, obj_range, name, is_check from dat_user where user_id="${user_name}" and pwd="${user_pass}"`

    let rows = null, resMsg = null
    try {
      rows = await mysql.query(sql)
    } catch (err) {
      console.log('查询数据库失败')
      resMsg = {
        code: -1,
        msg: '服务器错误，请联系系统管理员！',
        data: {
          name: user_name
        }
      }
      this.doCallBack(callback, resMsg, 'User.login')
      return
    }

    if (rows && rows.length > 0) {
      const [result] = rows
      const {role_id, dept_id, access_id, obj_range, name} = result

      // this.initContext(user_name, req)

      resMsg = {
        code: 0,
        msg: '',
        data: {
          name: user_name,
          roleID: role_id,
          deptID: dept_id,
          accessID: access_id,
          objRange: obj_range,
          userCName: name
        }
      }
    } else {
      resMsg = {
        code: -1,
        msg: '用户名或密码错误，请确认后再试。'
      }
    }

    this.doCallBack(callback, resMsg, 'User.login')
    if (resMsg.code === 0) {
      await this.meta.getMetaCacheData()
      let startTime = new Date(new Date().setHours(new Date().getHours() -1)).format('yyyy-MM-dd hh:mm:ss') // 当前时间前1小时
      let endTime = new Date().format('yyyy-MM-dd hh:mm:ss') // 当期时间
      // startTime = '2021-01-02 00:00:00'
      // endTime = '2021-03-02 09:29:02'
      this.channelStore.getUniqueAlarm({startTime, endTime})
      // this.meta.emit('META', {
      //   cmd: 'meta_data_all',
      //   data: JSON.stringify(this.metaStore.data)
      // })

    }
  }

  doCallBack (fn, msg, remark) {
    if (fn && typeof fn === 'function') {
      fn(msg)
      // console.debug(`${remark} : callback is done. callback=${fn}, msg=${msg}`)
    } else {
      // console.warn(`${remark} : callback is invalid. callback=${fn}, msg=${msg}`)
    }
  }

  initContext (userName, req) {
    this.name = userName
    const promises = this.meta.sendDataTable(this.socket)
    Promise.all(promises).then(() => {
      console.log(`>>>> Send all meta data DONE for user ${this.name}.`)
    }).catch((err) => {
      console.log(`>>>> Send all meta data FAILED for user ${this.name}.\n`, err)
    })

    this.userList.add(this)
  }

  openChannel (data) {
    const {channel} = data
    this.tcpService.storeOpen(channel)
  }
  
}