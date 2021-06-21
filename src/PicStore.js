import mysql from './MysqlWraper.js'

const fs = require('fs')
const path = require('path')
const config = require('./config/appconfig.js')
const request = require('request')

const pcIp = 'http://192.168.15.243:8086'
const PIC_IP = 'http://192.168.15.243:8086/resource/staff'
// const PIC_IP = 'http://192.168.0.247:8086/resource/staff'
// const pcIp = 'http://192.168.0.247:8086'

const LOCAL_PATH = config['FileDir']['staff']
const PIC_PATH = '../../../yaloc/gis-client/dist/resource/staff'

export default class PicStore {
  constructor () {
    this.localPath = path.resolve(LOCAL_PATH)
    this.picPath = path.resolve(PIC_PATH)
    this.staffs = new Map()
  }

  async getStaffPic () {
    const sql = `SELECT pic FROM dat_staff WHERE pic != '';`
    try {
      const rows = await mysql.query(sql);
      return rows
    } catch (err) {
      console.warn('查询数据库失败：', err)
    }
  }

  getFileState (file) {
    const isExist = fs.existsSync(file)
    if (isExist) {
      const state = fs.statSync(file)
      return state
    }
    return null
  }

  downloadPicFile (localPic, pic) {
    const self = this
    const serverPic = `${PIC_IP}/${pic}`
    const stream = fs.createWriteStream(localPic)
    request(serverPic).pipe(stream).on('close', function (err) {
      // console.log(`下载${pic}成功`)
      const [staffPic] = self.staffPics.splice(0, 1)
      staffPic && self.doDownload(staffPic)
    })
  }

  doDownload (staffPic) {
    const {pic} = staffPic
    const localPic = `${LOCAL_PATH}/${pic}`
    // const serverPicPath = `/home/yaxt/web_restart/gis-client/dist/resource/staff/${pic}`
    const localPicStat = this.getFileState(localPic)
    const serverPicStat = this.getFileState(`${PIC_IP}/${pic}`)

    if (!localPicStat) return this.downloadPicFile(localPic, pic)

    const {ctime: localCtime} = localPicStat || {}
    const {ctime: serverCtime} = serverPicStat || {}

    if (new Date(localCtime).getTime() !== new Date(serverCtime).getTime()) {
      return this.downloadPicFile(localPic, pic)
    }
  }

  async checkPic () {
    const staffPics = await this.getStaffPic()
    if (!staffPics) return
    this.staffPics = staffPics
    const [staffPic] = this.staffPics.splice(0, 1)
    this.doDownload(staffPic)
  }

  async getStaffs () {
    console.log('get staff')
    const sql = `SELECT ds.staff_id, ds.name, ds.pic, dc.ident FROM dat_staff ds INNER JOIN dat_staff_extend dse ON ds.staff_id = dse.staff_id INNER JOIN dat_card dc ON dse.card_id = dc.card_id`
    try {
      const rows = await mysql.query(sql);
      if (rows && rows.length > 0) {
        for (const row of rows) {
          const key = row.ident
          row.pic = row.pic && row.pic !== 'null' ? `${PIC_IP}/${row.pic}` : `${pcIp}/img/picstaff.png`
          this.staffs.set(key, row)
        }
      }
    } catch (err) {
      console.warn('查询数据库失败：', err)
    }
  }
}