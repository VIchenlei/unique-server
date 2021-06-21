import mysql from './MysqlWraper.js'
import {channelconfig, ENTER_POWER} from './config/channelConfig.js'
import {testChannelMapping} from './ServiceUtils.js'

const channelMapping = {
  enter_channel: 'channels',
  obtain_cards: 'channelsCards'
}

// const timediff = 60 * 1000 // 人员进入通道后，检测时差
const timediff = 40 * 1000 // 人员进入通道后，检测时差

const event_type_id = 41 // 唯一性检测告警类型
const obj_type_id = 9 // 告警对象类型（标识卡）
const dis_type = 3 
// const dbname = 'his_event_data'
const dbname = 'his_unique_event_data'


// const irisMapping = {
//   DX001: 1
// }

export default class ChannelStore {
  constructor (io) {
    this.io = io

    this.channels = new Map() // 记录哪个通道有人进入
    this.channelsCards = new Map() // 记录各个通道的标识卡信息
    this.channelsIris = new Map() // 记录各个通道的虹膜检测信息
    this.timer = new Map() // 存储各个通道的计时器告警信息

    this.isIrises = new Map() // 各个通道是否正确收到虹膜数据
    this.isCardses = new Map() // 各通道是否正确收到标识卡数据

    this.isChannelTrue = new Map() // 各个通道是否检测正常

    this.isIris = false // 是否收到正确的虹膜数据
    this.isCards = false // 是否收到正确的标识卡数据
    this.isLbCards = false // 是否收到的是来宾卡
    this.alarm = new Map() // 各通道是否有闸机告警
    this.alarmRes = new Map() // 各通是否有报警器告警

    this.doInsertAlarm = new Map() // 存储已存库告警信息
  }

  emit (event, res) {
    this.io.emit(event, res)
  }

  stopTimeout (data) {
    const {channel} = data
    let timer = this.timer.get(channel)
    if (timer) {
      clearTimeout(timer)
      timer = null
      this.timer.delete(timer)
    }
  }

  startTimeout (channel) {
    const self = this
    self.stopTimeout({channel})
    
    const timer = setTimeout(() => {
      const isIris = self.isIrises.get(channel)
      const isCards = self.isCardses.get(channel)
      // console.log(isIris, isCards)
      if ((!isIris || !isCards) && !self.isLbCards) {
        let msg = null, userId = null, staff_id = null, card_id = null
        if (isCards) {
          msg = self.channelsCards.get(channel)
          userId = null
          card_id = msg[0] ? msg[0][0] : null
        } else if (isIris) {
          msg = self.channelsIris.get(channel)
          userId = msg.userId
          staff_id = userId
        }
        
        // 发给client端的告警信息
        const resMsg = self.alarmResMsg(channel, isIris ? '获取标识卡数据超时' : '获取虹膜数据超时', {channel, staff_id, card_id})

        self.storeAlarmDB(userId, channel, card_id, isIris ? '获取标识卡数据超时' : '获取虹膜数据超时', isIris ? '获取标识卡数据超时' : '获取虹膜数据超时')

        self.emit('PUSH', resMsg)
      } else {
        self.stopTimeout({channel})
      }
    }, timediff)

    this.timer.set(channel, timer)
  }

  parsingEnterData (data) {
    let {channel, code} = data
    channel = Number(channel)
    if (code === 1) { // 人员进入通道
      this.channels.set(channel, data)
      this.startTimeout(channel)
    } else if (code === 2) { // 人员离开通道
      this.channels.delete(channel)
    }
  }

  // async doInsert (now, userId, cardId, cardMessage, alarmDetail, channel) {
  async doInsert (now, userId,alarmDetail, channel) {
    let fields = 'staff_id, channel, detail, cur_time'
    let values = `${userId}, ${channel}, '${alarmDetail}', '${new Date(now).format('yyyy-MM-dd hh:mm:ss')}'`
    const sql = `INSERT INTO ${dbname} (${fields}) VALUES (${values});`
    // console.log('存储告警sql', sql)
    
    try {
      await mysql.query(sql)
      this.getUniqueAlarm()
    } catch (err) {
      console.log('更新数据库失败：', err)
    // cardId = cardId || '0'
    // let fields = 'event_id, id, stat, event_type_id, obj_type_id, obj_id, dis_type, map_id, cur_time'
    // let values = `${now}, ${id.toString()}, 0, ${event_type_id}, ${obj_type_id}, ${cardId}, 3, 5, '${new Date(now).format('yyyy-MM-dd hh:mm:ss')}'`

    // let removeValues = `${now}, ${id.toString()}, 100, ${event_type_id}, ${obj_type_id}, ${cardId}, 3, 5, '${new Date(now).format('yyyy-MM-dd hh:mm:ss')}'`

    // if (cardMessage) {
    //   fields += ', description'
    //   values += Array.isArray(cardMessage) ? `, '${cardMessage.join(',')}'` : `, '${cardMessage}'`
    //   removeValues += Array.isArray(cardMessage) ? `, '${cardMessage.join(',')}'` : `, '${cardMessage}'`
    // }

    // const sql = `INSERT INTO ${dbname} (${fields}) VALUES (${values});`
    // const removeSql = `INSERT INTO ${dbname} (${fields}) VALUES (${removeValues});`

    // console.log('sql====================', sql)

    // try {
    //   await mysql.query(sql)
    //   setTimeout(() => {
    //     mysql.query(removeSql)
    //   }, 10000)
    // } catch (err) {
    //   console.log('更新数据库失败：', err)
    }
  }

  // 获取通道低电量告警 并推送至client
  async getUniqueAlarm (msg) {
    let startTime = null, endTime = null
    if (msg) {
      startTime = msg.startTime 
      endTime = msg.endTime
    } else {
      startTime = new Date(new Date().setHours(new Date().getHours() -1)).format('yyyy-MM-dd hh:mm:ss') // 当前时间前1小时
      endTime = new Date().format('yyyy-MM-dd hh:mm:ss') // 当期时间
    }
    let sql = `SELECT hued.id, hued.staff_id,ds.name,dse.card_id,dd.name as dname,hued.channel,hued.detail,ifnull(date_format(hued.cur_time, "%Y-%m-%d %H:%i:%s"), " ") as cur_time FROM his_unique_event_data hued LEFT JOIN dat_staff ds ON ds.staff_id = hued.staff_id LEFT JOIN dat_staff_extend dse ON dse.staff_id = hued.staff_id LEFT JOIN dat_dept dd ON dd.dept_id = dse.dept_id WHERE 1=1 AND detail LIKE "%电量过低%"  AND hued.cur_time>= "${startTime}" AND hued.cur_time<= "${endTime}" ORDER BY hued.cur_time DESC`
    let rows = null, resMsg = null
    try {
      rows = await mysql.query(sql)
    } catch (err) {
      console.log('查询数据库失败')
      return
    }
    if (rows) {
      let resMsg = {
        cmd: 'unique_alarm_msg',
        code: 0,
        data: {
          rows: rows
        }
      }
      this.emit('PUSH', resMsg)
    }
  }

  alarmResMsg (channel, tips, data) {
    channel = Number(channel)
    this.alarm.set(channel, true)
    this.alarmRes.set(channel, true)

    let reqMsg = data || {}
    reqMsg['msg'] = tips

    return {
      cmd: 'channel_data',
      code: -1,
      msg: tips,
      data: reqMsg
    }
  }

  turnId (cardId) {
    const eventID = (BigInt(dis_type) << BigInt(58)) | (BigInt(event_type_id) <<  BigInt(48)) | (BigInt(obj_type_id) << BigInt(40)) | (BigInt(2) << BigInt(36)) | BigInt(cardId)
    return eventID
  }

  // async storeAlarmDB (userId, channel, cardId, cardMessage) {
  //   channel = Number(channel)
  //   if (!cardId) {
  //     const staffSql = `SELECT card_id FROM dat_staff_extend WHERE staff_id = ${userId};`
  //     try {
  //       const rows = await mysql.query(staffSql)
  //       if (rows && rows.length > 0) {
  //         const [row] = rows
  //         cardId = row.card_id || `001${userId.toString().padStart(10, 0)}`
  //       }
  //     } catch (err) {
  //       console.log('查询DB失败')
  //     }
  //   } 

  //   const id = this.turnId(cardId)
  //   const now = new Date().getTime()
  //   this.doInsertAlarm.set(channel, {id, now, cardId, cardMessage})

  //   this.doInsert(now, id, cardId, cardMessage)
  // }

  async storeAlarmDB (userId, channel, cardId, cardMessage, alarmDetail) {
    channel = Number(channel)
    if (!cardId && userId) {
      const staffSql = `SELECT card_id FROM dat_staff_extend WHERE staff_id = ${userId};`
      try {
        const rows = await mysql.query(staffSql)
        if (rows && rows.length > 0) {
          const [row] = rows
          cardId = row.card_id || `001${userId.toString().padStart(10, 0)}`
        }
      } catch (err) {
        console.log('查询DB失败')
      }
    } 

    if (!userId && cardId) {
      const cardSql = `SELECT staff_id FROM dat_staff_extend WHERE card_id = 001${cardId.toString().padStart(10, 0)};`
      try {
        const rows = await mysql.query(cardSql)
        if (rows && rows.length > 0) {
          const [row] = rows
          userId = row.staff_id
        }
      } catch (err) {
        console.log('根据卡号查询失败')
      }
    }
    const now = new Date().getTime()
    this.doInsertAlarm.set(channel, {userId, now, cardId, cardMessage, alarmDetail})

    this.doInsert(now, userId, alarmDetail, channel)
  }

  // 检测唯一性
  async uniquenessTest (channelData, obtainTimediff, name) {
    const {channel} = channelData
    let isIris = this.isIrises.get(channel)
    let isCards = this.isCardses.get(channel)

    let resMsg = null, notifyMsg = null, alarmTip = '', userId = '', card_id = '', cardMessage = null, alarmDetail = ''
    if (obtainTimediff > timediff) {
      resMsg = this.alarmResMsg(channel, name === 'iris' ? '获取虹膜信息超时' : '获取标识卡数据超时', {channel})
      this.stopTimeout({channel})
    } else if (isIris && isCards && name !== 'LbCards') {

      const iris = this.channelsIris.get(channel)
      const cardsMsg = this.channelsCards.get(channel)

      let {abnormalTemperature, warnTemperature, temperature, alcoholStandard, alcoholResult} = iris
      let irisName = iris.name
      warnTemperature = parseFloat(warnTemperature)
      temperature = parseFloat(temperature)
      alcoholStandard = alcoholStandard == undefined ? 0 : parseFloat(alcoholStandard)
      alcoholResult = alcoholResult == undefined ? 0 : parseFloat(alcoholResult)
      userId = iris.userId
      const card_num = cardsMsg.length
      const cards = cardsMsg
      const [card_ident] = cards
      const [card, type, power] = card_ident || []
      card_id = card
      const cardIdents = cards.reduce(
        (pre, cur) => {
          pre.push(cur[0])
          return pre
        },
        []
      )

      cardMessage = {
        card_id: cards
      }

      if (card_num !== 1) {
        alarmTip += `;${card_num === 0 ? '未带卡出入井' : '携带多卡'}`
        if (card_num > 1) {
          // const sqlCards = cards.reduce()
          const cardSql = `SELECT ds.name, dd.name as dname, dc.ident as card_id FROM dat_staff_extend dse, dat_staff ds, dat_card dc, dat_dept dd WHERE dse.card_id = dc.card_id AND dse.staff_id = ds.staff_id AND dd.dept_id = dse.dept_id AND dc.card_type_id = 1 AND dc.ident IN (${cardIdents.join(',')});`
          try {
            const cardRows = await mysql.query(cardSql)
            cardMessage = cardRows.length > 0 ? cardRows : {card_id: cardIdents.join(';')}

            alarmDetail ? alarmDetail += `;携带多卡:` : alarmDetail += `携带多卡:`
            if (cardRows.length > 0) {
              cardRows.forEach(item => {
                alarmDetail +=`${item.name},${item.dname},${item.card_id};`
              });
            } else {
              alarmDetail += `${cardMessage.card_id}`
            }
          } catch (error) {
            console.log('查询数据库失败')
          }
        } else {
          cardMessage  = {
            card_id: [['未带卡出入井']]
          }
          alarmDetail ? alarmDetail += `;未带卡出入井:` : alarmDetail += `未带卡出入井`
        }
      }

      // if (temperature && temperature > warnTemperature) {
      //   alarmTip += `;温度过高`
      //   abnormalTemperature = -1
      //   warnTemperature = -1
      // } else if (!temperature) {
      //   return
      // }

      if (power < ENTER_POWER) {
        alarmTip += `;电量过低(${power})`
        alarmDetail ? alarmDetail += `;电量过低:${power}` : alarmDetail += `电量过低:${power}`
      }

      if (alcoholResult && alcoholResult > 0 &&(alcoholResult > alcoholStandard)) {
        alarmTip += `;酒精过高`
        alarmDetail ? alarmDetail += `;酒精过高:${alcoholResult}` : alarmDetail += `酒精过高:${alcoholResult}`
      }

      if (alcoholResult == -3) {
        alarmTip += `;未吹酒精`
        alarmDetail ? alarmDetail += `;未吹酒精` : alarmDetail += `未吹酒精`
      }

      const sql = `SELECT dse.staff_id, ds.name, dc.ident, dse.card_id, pic, dd.name AS dname FROM dat_staff_extend dse, dat_staff ds, dat_dept dd, dat_card dc WHERE dse.staff_id = ds.staff_id AND dse.dept_id = dd.dept_id AND dse.card_id = dc.card_id AND dse.staff_id = ${Number(userId)};`
      try {
        const rows = await mysql.query(sql)
        
        if (rows && rows.length > 0) {
          const [row] = rows
          const {ident, staff_id, name, pic, dname} = row
          card_id = row.card_id
          if (ident !== card && card_num !== 0) {
            alarmTip += ';人卡不符'
            alarmDetail ? alarmDetail += `;人卡不符:${ident}与${card}不符` : alarmDetail += `人卡不符:${ident}与${card}不符`
          }
          notifyMsg = {
            staff_id: userId,
            name,
            card_id: card_id,
            pic,
            dname,
            temperature,
            abnormalTemperature,
            warnTemperature,
            channel,
            cards: cardMessage,
            power,
            alcoholResult,
            alcoholStandard
          }
        } else {
          alarmTip += ';人卡未注册'
          alarmDetail ? alarmDetail += `;人卡未注册` :alarmDetail += `人卡未注册`
          notifyMsg = {
            staff_id: userId,
            name: irisName,
            dname: '',
            temperature,
            abnormalTemperature,
            warnTemperature,
            channel,
            cards: cardMessage,
            alcoholResult,
            alcoholStandard
          }
        }
      } catch (err) {
        alarmTip += ';没有获取到人员信息'
        alarmDetail ? alarmDetail += `;没有获取到人员信息` :alarmDetail += `没有获取到人员信息`
        notifyMsg = {
          staff_id: userId,
          temperature,
          abnormalTemperature,
          warnTemperature,
          channel,
          cards: cardMessage,
          alcoholResult,
          alcoholStandard
        }
      }

      alarmTip = alarmTip.replace(';', '')
      resMsg = alarmTip 
                ? this.alarmResMsg(channel, alarmTip, notifyMsg) 
                : {
                  cmd: 'channel_data',
                  code: 0,
                  msg: '',
                  data: notifyMsg
                }

      if (!alarmTip) {
        this.isChannelTrue.set(channel, true)
      }
    } else if (isCards && name === 'LbCards') {
      alarmTip = ''
      resMsg = {
        cmd: 'channel_data',
        code: 0,
        msg: '',
        data: notifyMsg
      }
      this.isChannelTrue.set(channel, true)
    }

    this.emit('PUSH', resMsg)

    if (alarmTip) {
      this.storeAlarmDB(userId, channel, card_id, cardMessage, alarmDetail)
      this.isChannelTrue.delete(channel)
      this.stopTimeout({channel})
    }
  }

  // 获取虹膜对应的通道
  obtainIrisChannel (deviceSn) {
    const keys = Object.keys(channelconfig)
    let irisChannel = null
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const {iris} = channelconfig[key]
      if (iris.deviceSn === deviceSn) {
        irisChannel = key
        break
      }
    }
    return irisChannel
  }

  // 解析虹膜数据
  parsingIrisData (data) {
    const {deviceSn, recogTime} = data
    const iris = this.obtainIrisChannel(deviceSn)
    this.channelsIris.set(Number(iris), data)
    const channel = this.channels.get(Number(iris))
    this.isIrises.set(Number(iris), false)
    this.isIris = false
    if (channel) {
      const {time} = channel
      const irisTiemDiff = new Date().getTime() - time

      this.isIrises.set(Number(iris), true)
      this.uniquenessTest(channel, irisTiemDiff, 'iris')
    }
  }

  async parsingCardsData (data) {
    const {device_id, time: obtainTime, cards} = data
    let isLb = false
    if (cards && cards[0]) {
      let card_ident = cards[0][0]
      const sql = `SELECT ds.name, dd.name as dname, dc.ident as card_id FROM dat_staff_extend dse, dat_staff ds, dat_card dc, dat_dept dd WHERE dse.card_id = dc.card_id AND dse.staff_id = ds.staff_id AND dd.dept_id = dse.dept_id AND dc.card_type_id = 1 AND dc.ident = ${card_ident};`
      try {
        const rows = await mysql.query(sql)
        
        if (rows && rows.length > 0) {
          const [row] = rows
          const {dname} = row
          if (dname.includes('宾')) isLb = true
        }
      } catch (err) {
        console.log('标识卡查询错误')
      }
    }
    let channelID = testChannelMapping(device_id)
    channelID = Number(channelID)
    this.channelsCards.set(channelID, cards || [])

    const channel = this.channels.get(channelID)
    this.isCardses.set(channelID, false)
    this.isCards = false
    this.isLbCards = false
    if (channel) {
      const {time} = channel
      const cardsTimediff = obtainTime - time

      this.isCards = true
      this.isCardses.set(channelID, true)
      let keyWords = isLb ? 'LbCards' : 'cards'
      this.isLbCards = isLb
      this.uniquenessTest(channel, cardsTimediff, keyWords)
    }
  }

  add (key, data) {
    switch (key) {
      case 'enter_channel': //进入通道数据
        this.parsingEnterData(data)
        break
      case 'channelsIris': //虹膜数据
        this.parsingIrisData(data)
        break
      case 'obtain_cards': // 通知检测分站获取检测到的标识卡数据
        this.parsingCardsData(data)
        break
      case 'alarm': // 发送告警信息
        this.stopTimeout(data)
        break
    }
  }

  emitAlarmMsg (channel, alarm_code) {
    let resMsg = {
      cmd: 'alarm_msg',
      code: alarm_code && alarm_code.includes('remove') ? 0 : -1,
      data: {
        channel,
        alarm_code
      }
    }

    this.emit('PUSH', resMsg)
  }

  checkAlarmChannel (channel) {
    const alarmRes = this.alarmRes.get(channel)
    const alarm = this.alarm.get(channel)
    if (!alarmRes && !alarm) {
      this.channels.delete(channel)
    }
  }

  storeAlarmRes (data, ip) {
    const {device_id, device_type, channel, alarm_code} = data

    if (!alarm_code) return
    
    this.emitAlarmMsg(channel, alarm_code)

    // 解除告警
    if (['open_dore_front', 'remove_light_alarm', 'close_dore_front'].includes(alarm_code)) return

    const channelData = channelconfig[channel]
    const {alarm, alarm_unique} = channelData

    const {ip: a_ip} = alarm
    const {ip: au_ip} = alarm_unique

    if (a_ip === ip) {
      this.alarmRes.delete(channel)
      this.checkAlarmChannel(channel)
    } else if (au_ip === ip) {
      // 告警确认消息回复，清空通道和告警信息，防止继续发送告警
      this.alarm.delete(channel)
      this.checkAlarmChannel(channel)
    }
  }

  removeAlarmDB (channel) {
    const event = this.doInsertAlarm.get(channel)
    if (event) {
      const {id, now, cardId} = event
      // this.doInsert(now, id, cardId)
      this.doInsertAlarm.delete(channel)
    }
  }

  clear (channel) {
    channel = +channel
    this.channelsCards.delete(channel)
    this.channelsIris.delete(channel)
    this.isIrises.delete(channel)
    this.isCardses.delete(channel)
    this.alarm.delete(channel)
    this.alarmRes.delete(channel)
  }
}