import {channelconfig} from './config/channelConfig.js'

const CRCTABLE = [0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
  0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef,
  0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6,
  0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de,
  0x2462, 0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485,
  0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d,
  0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4,
  0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc,
  0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823,
  0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b,
  0x5af5, 0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12,
  0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a,
  0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41,
  0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49,
  0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70,
  0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78,
  0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f,
  0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067,
  0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e,
  0x02b1, 0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256,
  0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d,
  0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405,
  0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c,
  0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634,
  0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab,
  0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3,
  0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a,
  0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92,
  0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9,
  0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1,
  0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8,
  0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0x0ed1, 0x1ef0
]

const READER_COMMAND_WORD = {
  enter_channel: [0xa3, 0x00], // 人员进入通道
  obtain_cards: [0xa3, 0x01], // 通知检测分站获取检测到的标识卡数据
  alarm: [0xa3, 0x02], // 发送告警信息
  remove_alarm: [0xa3, 0x02], // 发送告警信息
  remove_voice_alarm: [0xa3, 0x02], // 解除声音告警
  school_time: [0x78, 0x3b], // 校时指令
  open_dore: [0xa3, 0x02], // 发送开门指令
  open_dore_front: [0xa3, 0x02], // 发送开前门指令
  close_dore_front: [0xa3, 0x02], // 发送关闭前门指令
  close_dore_back: [0xa3, 0x02], // 发送关闭后门指令
  send_card_msg: [0xa3, 0x06], // 向采集服务器发送升入井信息
}

const PARSING_DATA_MEAN = {
  enter_channel: {
    labels: ['设备地址', '设备类型', '通道号', '检测信息码'],
    names: ['device_id', 'device_type', 'channel', 'code'],
    nums: [4, 1, 1, 1]
  },
  obtain_cards: {
    labels: ['设备地址', '设备类型'],
    names: ['device_id', 'device_type'],
    nums: [4, 1]
  },
  alarm: {
    labels: ['设备地址', '设备类型', '通道号', '告警控制码'],
    names: ['device_id', 'device_type', 'channel', 'alarm_code'],
    nums: [4, 1, 1, 2]
  },
  send_card_msg: {
    labels: ['通道号'],
    names: ['channel'],
    nums: [1]
  }
}

function getCrc (data, len) {
  var crc = 0
  for (var i = 0; i < len; i++) {
    crc = (CRCTABLE[(crc >> 8) ^ data[i] & 0xff] ^ (crc << 8)) & 0xffff
  }
  return crc & 0xffff
} 

/**
 * 验证收到的消息是否正确
 * @param {*} data 命令字
 * @param {*} length 长度
 * @param {*} crcRes 验证crc
 */
function judgeCrc (data, length, crcRes) {
  let verificationCrc = getCrc(data, length)
  let crcResToJson = crcRes.toJSON().data
  let crc = crcResToJson[0] << 8 | crcResToJson[1]
  if (verificationCrc === crc) {
    return true
  }
  return false
}

// 获取数组前n项和
function getNumArrayTotal (n, arr) {
  var total = arr.reduce(function (pre, cur, index, arr) {
    if (index > n - 1) {
      return pre + 0
    }
    return pre + cur
  })
  return total
}

function parsingAlarmCode (data) {
  const code = data.readUInt16BE(0)
  switch (code) {
    case 257:
      return 'light_alarm'
    case 514:
      return 'voice_alarm'
    case 256:
      return 'remove_light_alarm'
    case 512:
      return 'remove_voice_alarm'
    case 40962:
      return 'open_dore_front'
    case 40963:
      return 'close_dore_front'
  }
}

// 解析buffer数据
function analyticalData (name, data) {
  const dataArray = data.toJSON().data

  // if (data.length <= 0) return
  switch (name) {
    case 'device_id':
    case 'card_ident':
      return data.readUInt32BE(0)
    case 'alarm_code':
      return parsingAlarmCode(data)
    default:
      return dataArray[0]
  }
}

function powerResult (data) {
  switch (data) {
    case 16:
      return 10
    case 32:
      return 20
    case 48:
      return 30
    case 64:
      return 40
    case 80:
      return 50
    case 96:
      return 60
    case 112:
      return 70
    case 128:
      return 80
    case 144:
      return 90
    case 160:
      return 100
  }
}

function typeResult (data) {
  switch (data) {
    case 145:
      return 1
    case 146:
      return 2
    case 147:
      return 3
    case 148:
      return 4
    case 149:
      return 5
    case 150:
      return 6
  }
}

function dealSliceData (nums, i, name, dataArray) {
  let num = nums[i]
  let sumNum = i === 0 ? 0 : getNumArrayTotal(i, nums)
  let sliceData = dataArray.slice(sumNum, sumNum + num)
  return analyticalData(name, sliceData)
}

// 解析获取到的标识卡数据
function parsingCards (data, msg) {
  if (data.length === 0) {
    msg['card_num'] = 0
    return
  }

  // 标识卡号4字节 + 标识卡类型1字节 + 电量1字节 + 时间7字节
  const length = data.length / (4 + 1 + 1 + 7)
  msg['card_num'] = length
  const cards = []
  while(data.length) {
    const cardIdent = data.slice(0, 4)
    const cardIdentResult = analyticalData('card_ident', cardIdent)

    const cardType = data.slice(4, 5)
    const cardTypeResult = analyticalData('card_type', cardType)
    const type = typeResult(cardTypeResult)

    const cardPower = data.slice(5, 6)
    const cardPowerResult = analyticalData('card_power', cardPower)
    const power = powerResult(cardPowerResult)
    // const power = cardPower.toJSON().data[0]

    cards.push([cardIdentResult, type, power])
    data = data.slice(13)
  }
  msg['cards'] = cards
}

function parsingResponse (key, data) {
  const def = PARSING_DATA_MEAN[key]
  if (!def) return
  
  const {names, nums} = def
  const msg = {}
  for (let i = 0, len = names.length; i < len; i++) {
    const name = names[i]
    msg[name] = dealSliceData(nums, i, name, data)
  }

  if (key === 'obtain_cards') {
    parsingCards(data.slice(5), msg)
  }
  return msg
}

// 解析接收到的数据
function parsingData (data) {
  const basicLength = 4
  const dataLength = data.length - basicLength

  const commandWord = data.slice(2, 4) // 命令字
  const command = data.slice(2, data.length - 2) // 校验数据
  // 返回的crc
  const crcResponce = data.slice(data.length - 2, data.length)
  // crc校验
  const isCorrect = judgeCrc(command, dataLength, crcResponce)
  // 用的假数据，暂时隐藏验证crc
  if (!isCorrect) return

  let parsingData = null, key = null
  for (key in READER_COMMAND_WORD) {
    if (commandWord.equals(Buffer.from(READER_COMMAND_WORD[key]))) {
      parsingData = parsingResponse(key, data.slice(basicLength, data.length - 2))
      break
    }
  }
  return {parsingData, key}
}

function turnBuf (data, size = 1) {
  // data = data.toString()
  const buf = Buffer.allocUnsafe(size)
  buf.writeUIntBE(data, 0, size)
  return buf
}

function obtainTimerCode () {
  const now = new Date()
  const millisSecond = now.getMilliseconds()
  const millisSecondBuf = turnBuf(millisSecond, 2)

  const seconds = now.getSeconds()
  const secondsBuf = turnBuf(seconds)

  const minutes = now.getMinutes()
  const minutesBuf = turnBuf(minutes)

  const hours = now.getHours()
  const hoursBuf = turnBuf(hours)

  const date = now.getDate()
  const datesBuf = turnBuf(date)

  const days = now.getDay()
  const daysBuf = turnBuf(days)

  const month = now.getMonth() + 1
  const monthBuf = turnBuf(month)

  const year = Number(now.getFullYear().toString().slice(2,4))
  const yearBuf = turnBuf(year)

  return Buffer.concat([millisSecondBuf, secondsBuf, minutesBuf, hoursBuf, datesBuf, daysBuf, monthBuf, yearBuf])
}

function obtainData (cmd, data) {
  const {device_id, device_type, alarm_type, channel} = data
  // const deviceIDBuf = turnBuf(device_id, 4)
  // const deviceTypeBuf = turnBuf(device_type)
  const baseBuf = device_type && Buffer.concat([Buffer.from(device_id), Buffer.from(device_type)])
  const channelBuf = channel && turnBuf(channel)
  switch (cmd) {
    case 'obtain_cards':
      return baseBuf
    case 'alarm':
      // 红光快闪，声音低报警
      const alarmBuf = alarm_type === 'light' ? Buffer.from([0x01, 0x01]) : Buffer.from([0x02, 0x02])
      return Buffer.concat([baseBuf, channelBuf, alarmBuf])
    case 'remove_alarm':
      // 解除灯光、声音报警
      // const removeAlarmBuf = alarm_type === 'light' ? Buffer.from([0x01, 0x00]) : Buffer.from([0x02, 0x00])
      const removeAlarmBuf = Buffer.from([0x01, 0x00])
      return Buffer.concat([baseBuf, channelBuf, removeAlarmBuf])
    case 'school_time':
      const time = obtainTimerCode()
      return Buffer.concat([baseBuf, time])
    case 'open_dore': // 开启闸机后通道
      return Buffer.concat([baseBuf, channelBuf, Buffer.from([0xa0, 0x00])])
    case 'open_dore_front': // 解除告警，开启闸机前通道
      return Buffer.concat([baseBuf, channelBuf, Buffer.from([0xa0, 0x02])])
    case 'close_dore_front': // 关闭通道前闸机
      return Buffer.concat([baseBuf, channelBuf, Buffer.from([0xa0, 0x03])])
    case 'close_dore_back': // 关闭通道后闸机
      return Buffer.concat([baseBuf, channelBuf, Buffer.from([0xa0, 0x01])])
    case 'remove_voice_alarm':
      return Buffer.concat([baseBuf, channelBuf, Buffer.from([0x02, 0x00])])
    case 'send_card_msg':
      const {state, card, power, Sequence} = data
      const cardBuf = turnBuf(card, 4)
      const typeBuf = Buffer.from([0x10])
      const powerBuf = turnBuf(power)
      return Buffer.concat([Buffer.from([Sequence]), channelBuf, Buffer.from(device_id), cardBuf, typeBuf, Buffer.from([state]), powerBuf])
  }
}

function getCrcBuffer (commandWordBuffer, dataBuffer) {
  // 校验字节包括2个字节的命令字， N个字节的数据区
  let crc = getCrc(Buffer.concat([commandWordBuffer, dataBuffer]), commandWordBuffer.length + dataBuffer.length)
  // crc校验
  let crcData = [(crc >> 8) & 0xFF, crc & 0xFF]
  let crcBuffer = Buffer.from(crcData)
  return crcBuffer
}

function handleBuffer (commandWord, data) {
  // 命令字
  let commandWordBuffer = Buffer.from(READER_COMMAND_WORD[commandWord])
  // 数据区
  // let dataBuffer = data ? Buffer.from(data) : Buffer.from([])
  let dataBuffer = obtainData(commandWord, data)
  let crcBuffer = getCrcBuffer(commandWordBuffer, dataBuffer)
  let dataTotalLength = READER_COMMAND_WORD[commandWord].length + dataBuffer.length + 2
  let dataTotalLengthBuffer = Buffer.from([(dataTotalLength >> 8) & 0xFF, dataTotalLength & 0xFF])
  // 2个字节长度+2个字节命令字+n个字节数据区+2个字节校验码
  return Buffer.concat([dataTotalLengthBuffer, commandWordBuffer, dataBuffer, crcBuffer])
}

// 通过检测分站id号找到对应的通道号
function testChannelMapping (deviceID) {
  const channelKeys = Object.keys(channelconfig)
  for (let i = 0; i < channelKeys.length; i++) {
    const key = channelKeys[i] || {}
    const {test_reader} = channelconfig[key]
    const {device_id} = test_reader
    const testDeviceID = analyticalData('device_id', Buffer.from(device_id))
    if (testDeviceID === deviceID) {
      return key
    }
  }
}

export {parsingData, handleBuffer, analyticalData, testChannelMapping}