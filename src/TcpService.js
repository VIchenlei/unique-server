import net from 'net'

import {parsingData, handleBuffer, testChannelMapping} from './ServiceUtils.js'
import {channelconfig} from './config/channelConfig.js'

const port = 3000
const IP = '192.168.15.243'
const CLIENT_PORT = 9700

const storeCmd = ['enter_channel', 'obtain_cards']
const stayTimeOut = 40 * 1000
let Sequence = 0

export default class TcpService {
  constructor (channelStore) {
    this.tcpService = false
    this.channelStore = channelStore

    this.shcool = false
    this.schooleTimeing = null

    this.enterArray = [] // 人员进入通道数组，用于存储发送开始接收标识卡消息
    this.openChannels = [] // 存储开门的通道号，由client端控制
    this.alarmResOpenChannels = [] // 开门通道号，存储报警器解除报警信息，由于闸机和报警器是两个设备，报警器不需要判断人员是否在通道内

    this.closeFrontDore = new Map() // 存储定时关闭前门的计时器

    this.isSendTestReader = [] // 存储是否人员进入通道，发送获取标识卡信息

    this.readerCard = new Map() // 存储分站发送的标识卡数据，用于转发采集
    this.currentChannel = null // 当前正常出井的通道号
    this.sendCards = new Map() // 发送的升入井消息
    this.sendCardsTimer = new Map() // 发送的升入井定时器

  }

  startTimer (channel, sendMsg, self, tcpClient) {
    channel = +channel
    let msg = self.sendCards.get(channel)
    let count = (msg && msg.count) || 0

    if (!msg) {
      msg = {}
      self.sendCards.set(channel, msg)
    } else {
      let timer = msg.timer
      if (timer) clearInterval(timer)
    }

    msg.sendMsg = sendMsg

    if (count <= 3) {
      let timer = setInterval(() => {
        tcpClient.write(sendMsg)
        count ++
      }, 2000)
  
      msg.timer = timer
      msg.count = count
    } else {
      console.warn('发送采集失败：', channel)
      let timer = msg.timer
      if (timer) clearInterval(timer)
      self.sendCards.delete(channel)
    }
  }

  // 向采集发送标识卡信息
  startTcpClient (channel) {
    const self = this
    let tcpClient = new net.Socket()
    tcpClient.connect(CLIENT_PORT, IP, () => {
      // const channel = self.currentChannel
      const {test_reader} = channelconfig[+channel]
      const {device_id, state} = test_reader
      const cardMsg = self.channelStore.channelsCards.get(channel)
      const [card_ident] = cardMsg
      const [card, , power] = card_ident || []
      
      const sendMsg = handleBuffer('send_card_msg', {device_id, channel, state, card, power, Sequence})
      Sequence = Sequence + 1
      sendMsg && tcpClient.write(sendMsg)
      sendMsg && console.log('发送给采集数据：', sendMsg)

      self.startTimer(channel, sendMsg, self, tcpClient)
    })

    tcpClient.on('data', (tdata) => {
      let {parsingData: parsingResult, key} = parsingData(tdata) || {}
      if (key === 'send_card_msg' && parsingResult) {
        const {channel} = parsingResult
        const msg = self.sendCards.get(+channel)
        const {timer} = msg
        clearInterval(timer)
        self.sendCards.delete(+channel)
      }
    })

    tcpClient.on('error', (error) => {
      console.warn(error)
    })
  }

  deleteArrayData (data, channel) {
    const index = data.indexOf(channel)
    index >= 0 && data.splice(index, 1)
  }

  schoolDeviceTime () {
    this.schoolTime = true
    this.schooleTimeing = [1, 2, 3, 4]
  }

  startSchoolTime (test_reader, remoteAddress, channel) {
    const {ip, device_id, device_type} = test_reader
    let sendMsg = null
    if (ip === remoteAddress) {
      sendMsg = handleBuffer('school_time', {device_id, device_type})
    }
    return sendMsg
  }

  storeOpen (channel) {
    !this.openChannels.includes(channel) && this.openChannels.push(channel)
    !this.alarmResOpenChannels.includes(channel) && this.alarmResOpenChannels.push(channel)
    this.channelStore.removeAlarmDB(channel)
  }

  sendAlarm (key, alarm, alarm_unique, remoteAddress, type, alarmType) {
    // console.log('remoteaddress', remoteAddress)
    let sendMsg = null

    const {ip: a_ip, device_id: a_device_id, device_type: a_device_type} = alarm || {}
    const {ip: au_ip, device_id: au_device_id, device_type: au_device_type} = alarm_unique || {}

    if (a_ip === remoteAddress) {
      sendMsg = handleBuffer(type, {device_id: a_device_id, device_type: a_device_type, alarm_type: alarmType, channel: key})
    }
    if (au_ip === remoteAddress) {
      sendMsg = handleBuffer(type, {device_id: au_device_id, device_type: au_device_type, alarm_type: alarmType, channel: key})
    } 
    return sendMsg
  }

  sendCardObtain (test_reader, remoteAddress) {
    const {ip, device_id, device_type} = test_reader
    let sendMsg = null
    if (ip === remoteAddress) {
      sendMsg = handleBuffer('obtain_cards', {device_id, device_type})
    }
    return sendMsg
  }

  startCloseTimer (channel, timerStore, socket, self, alarm_unique, remoteAddress) {
    let timer = timerStore.get(channel)
    if (timer) {
      clearTimeout(timer)
      timerStore.delete(channel)
    }

    timer = setTimeout(() => {
      const sendMsg = self.sendAlarm(channel, null, alarm_unique, remoteAddress, 'close_dore_front')
      sendMsg && socket.write(sendMsg)
    }, 10000)

    timerStore.set(channel, timer)
  }

  // 发送开始获取接收标识卡消息 或 告警信息
  sendDeviceMsg (remoteAddress, self, channelStore, socket) {
    let sendMsg = null, alarmMsg = null, openMsg = null
    const channelKeys = Object.keys(channelconfig)

    for (let i = 0; i < channelKeys.length; i++) {
      const key = Number(channelKeys[i])

      const {test_reader, alarm, alarm_unique} = channelconfig[key] || {}

      // 校时
      if (self.schoolTime && self.schooleTimeing.includes(key)) {
        sendMsg = self.startSchoolTime(test_reader, remoteAddress)
        if (sendMsg) {
          self.deleteArrayData(self.schooleTimeing, key)
        }
      }

      // 报警器不需要判断人员是否在通道内，只要有解除告警，就发送解除告警消息
      if (this.alarmResOpenChannels.includes(key)) {
        sendMsg = self.sendAlarm(key, alarm, null, remoteAddress, 'remove_voice_alarm')
      }

      if (sendMsg) break

      if (self.openChannels.includes(key)) {
        // 只有闸机不需要判断人员是否在通道内，防止操作人员误触开门
        sendMsg = self.sendAlarm(key, null, alarm_unique, remoteAddress, 'open_dore_front')
      }

      if (sendMsg) break

      // if (self.enterArray.length <= 0) break

      // 首先需要判断人员是否进入通道，如果该通道没有人员进入，则以下逻辑都不需要判断
      if (self.enterArray.includes(key)) {
        const alarmChannel = channelStore.alarm.get(key)
        const alarmResChannel = channelStore.alarmRes.get(key)
        const channelData = channelStore.channels.get(key)
        const channelTrue = channelStore.isChannelTrue.get(key)

        // 判断顺序：
        // 1、该通道是否有告警，如果有告警则向闸机 和 告警器分别发送告警；
        // 2、人员在通道停留时长 >= 25s，需要发送：人员没有离开通道告警
        // 3、通道检测正常，发送开启闸机后通道，删除开启通道中该通道信息
        // 4、否则才发送获取标识卡数据信息
        if (alarmChannel) {
          sendMsg = self.sendAlarm(key, null, alarm_unique, remoteAddress, 'alarm', 'light')
          alarmMsg = self.sendAlarm(key, null, alarm_unique, remoteAddress, 'alarm', 'voice')
          if ([3,4].includes(key)){
            openMsg = self.sendAlarm(key, null, alarm_unique, remoteAddress, 'open_dore')
          }
        } else if (alarmResChannel) {
          sendMsg = self.sendAlarm(key, alarm, null, remoteAddress, 'alarm', 'light')
          alarmMsg = self.sendAlarm(key, alarm, null, remoteAddress, 'alarm', 'voice')
          // if (alarmResChannel.tips.includes('电量过低')){
          //   openMsg = self.sendAlarm(key, null, alarm_unique, remoteAddress, 'open_dore')
          // }
        } else if (channelData) {
          const {time} = channelData
          const difftime = new Date().getTime() - time
          // 判断是否超时，超时发送告警；否则，发送获取卡数据
          if (difftime >= stayTimeOut) {
            sendMsg = self.sendAlarm(key, alarm, alarm_unique, remoteAddress, 'alarm', 'light')
            // alarmMsg = self.sendAlarm(key, alarm, alarm_unique, remoteAddress, 'alarm', 'voice')
            // 只给闸机发送关后门
            alarmMsg = self.sendAlarm(key, null, alarm_unique, remoteAddress, 'close_dore_back')
            if (alarmMsg) {
              const cardMsg = self.channelStore.channelsCards.get(key)
              const [[card]] = cardMsg

              const iris = self.channelStore.channelsIris.get(key)
              const {userId} = iris
              console.log(cardMsg, iris)
              self.channelStore.storeAlarmDB(userId, key, card, '人员停留超时', '人员停留超时')
              const clientMsg = self.channelStore.alarmResMsg(key, '人员停留超时', {
                name: iris.name,
                dname: '',
                cards: {
                  card_id: cardMsg
                },
                channel: key
              })
              self.channelStore.emit('PUSH', clientMsg)
            }
          } else if (channelTrue) {
            sendMsg = self.sendAlarm(key, null, alarm_unique, remoteAddress, 'open_dore')
            if (sendMsg) channelStore.isChannelTrue.delete(key)
          } else if (self.isSendTestReader.includes(key)) {
            sendMsg = self.sendCardObtain(test_reader, remoteAddress)
            if (sendMsg) {
              const openIndex = self.isSendTestReader.indexOf(key)
              openIndex >= 0 && self.isSendTestReader.splice(openIndex, 1)
            }
          }
        }
      }

      if (sendMsg) {
        break
      }
    }
    if (sendMsg || alarmMsg) return {sendMsg, alarmMsg, openMsg}
  }

  storeChannel (data, self) {
    const {channel, code} = data
    if (code === 1) { // 人员进入通道
      !self.enterArray.includes(channel) && self.enterArray.push(channel)
      !self.isSendTestReader.includes(channel) && self.isSendTestReader.push(channel)
      // 当通道重新打开时，清空上次通道存储的虹膜、卡信息
      self.channelStore.clear(channel)
    } else if (code === 2) { // 
      self.currentChannel = channel
      if (channel == 3 || channel == 4) {
        self.startTcpClient(channel)
      }

      self.deleteArrayData(self.enterArray, channel)
      self.deleteArrayData(self.isSendTestReader, channel)

      // 人员出通道，清空从进门开始计算的定时器
      self.channelStore.stopTimeout({channel})
    }
  }

  sendDeviceData (self, remoteAddress, channelStore, socket) {
    const {sendMsg, alarmMsg, openMsg} = self.sendDeviceMsg(remoteAddress, self, channelStore, socket) || {}
    if (sendMsg || alarmMsg) {
      console.log('发送数据', remoteAddress, sendMsg, alarmMsg, openMsg)
    }
    openMsg && socket.write(openMsg)
    setTimeout(() => {
      alarmMsg && socket.write(alarmMsg)
    }, 100)
    setTimeout(() => {
      sendMsg && socket.write(sendMsg)
    }, 150)
    // sendMsg && socket.write(sendMsg)
    // alarmMsg && socket.write(alarmMsg)
    // openMsg && socket.write(openMsg)
  }

  startUpService () {
    const self = this
    if (self.tcpService) return
    const channelStore = self.channelStore

    const server = net.createServer((socket) => {
      const {remoteAddress, remotePort} = socket
      const client = remoteAddress + ':' + remotePort
      console.log('Connected to ' + client)
      self.tcpService = true

      self.sendDeviceData(self, remoteAddress, channelStore, socket)

      socket.on('data', (tdata) => {
        // 239 控制板 心跳 [0, 10, 121, 58, 0, 0, 192, 4, 11, 4, 176, 220]
        // 235 检卡分站 心跳 [0, 4, 163, 1, 88, 12]
        // console.log('心跳数据', new Date().format('yyyy-MM-dd hh:mm:ss'), remoteAddress, tdata)
        const dataArea = tdata.slice(4, tdata.length - 2)
        if (dataArea.length <= 0) return self.sendDeviceData(self, remoteAddress, channelStore, socket)

        let {parsingData: parsingResult, key} = parsingData(tdata) || {}

        if (!parsingResult) return self.sendDeviceData(self, remoteAddress, channelStore, socket)
        // console.log('接收数据', new Date().format('yyyy-MM-dd hh:mm:ss'), remoteAddress, tdata)
        if (parsingResult) console.log('解析数据源数据：', tdata)
        // console.log('解析后数据', key, parsingResult)
        const now = Date.now()
        parsingResult['time'] = now

        storeCmd.includes(key) && self.channelStore.add(key, parsingResult)
        if (key === 'enter_channel') { // 人员进入通道
          self.storeChannel(parsingResult, self) 
          // console.log('返还开前后门数据', tdata)
          socket.write(tdata)
        } else if (key === 'obtain_cards') { // 获取到分站发送的标识卡数据，直接保存
          const {device_id} = parsingResult
          const channelID = testChannelMapping(device_id)
        } else if (key === 'alarm') { // 发送告警信息
          self.channelStore.storeAlarmRes(parsingResult, remoteAddress)
          const {channel, alarm_code} = parsingResult

          if (alarm_code === 'remove_voice_alarm') {
            self.deleteArrayData(self.alarmResOpenChannels, Number(channel))
          }

          // 解除告警 或 client端控制开前门，才把通道清空
          if (['open_dore_front', 'remove_light_alarm'].includes(alarm_code)) {
            if (alarm_code === 'open_dore_front') {
              const {alarm_unique} = channelconfig[channel] || {}
              const {ip: au_ip} = alarm_unique || {}
              if (au_ip === remoteAddress) {
                self.startCloseTimer(Number(channel), self.closeFrontDore, socket, self, alarm_unique, remoteAddress)
              }
            }
            self.deleteArrayData(self.openChannels, Number(channel))
            self.deleteArrayData(self.enterArray, Number(channel))
          }
        }
      })

      // 监听连接断开事件
      socket.on('end', function () {
        console.log('Client disconnected.')
      })

      socket.on('error', function (error) {
        console.log(error)
      })
    })

    server.listen(port, '0.0.0.0')

    server.on('error', (error) => {
      console.warn(error)
    })
  }
}