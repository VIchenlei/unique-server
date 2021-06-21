import dgram from 'dgram'

const port = 19991

export default class UdpService {
  constructor (channelStore) {
    this.channelStore = channelStore
  }

  startUpService () {
    console.log('开启udp服务')
    const channelStore = this.channelStore

    const server = dgram.createSocket('udp4')

    server.on('error', (err) => {
      console.log(`服务器异常：\n${err.stack}`)
      server.close()
    })

    server.on('message', (msg, rinfo) => {
      console.log(`监听到${rinfo.address}:${rinfo.port}的数据`)
      console.log('虹膜数据', msg.toString())

      const message = msg.toString()
      const parsingMsg = JSON.parse(message)

      // 设备序列号，员工id，体温，预警体温，异常体温，识别时间, 酒检标准值, 酒检实际值, 姓名, 请求ID
      const {deviceSn, workSn, temperature, warnTemperature, abnormalTemperature, recogTime, alcoholStandard, alcoholResult, name, requestId} = parsingMsg
      channelStore.add('channelsIris', {deviceSn, userId: workSn, temperature, warnTemperature, abnormalTemperature, recogTime, alcoholStandard, alcoholResult, name})
      // let buf = Buffer.from(JSON.stringify({ "requestId": requestId, "code": "200", "message": "结果信息" }))
      // console.log(JSON.stringify({ "requestId": requestId, "code": "200", "message": "success"}))
      server.send(JSON.stringify({ "requestId": requestId, "code": "200", "message": "success"}), 0, JSON.stringify({ "requestId": requestId, "code": "200", "message": "success"}).length, 19992, "localhost", function (err, bytes) {
        if (err) {
            console.log('发送数据失败');
        } else {
            console.log("已发送字节数据。", bytes);
        }
    })
      
      // server.send(JSON.stringify({ "requestId": requestId, "code": "200", "message": "结果信息" }), port)
    })

    server.bind(port)
  }
}