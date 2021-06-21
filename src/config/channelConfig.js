const ENTER_POWER = 31
const channelconfig = {
  1: {
    test_reader: {
      ip: '192.168.15.232',
      device_id: [0x00, 0x00, 0xa0, 0x01],
      port: 3000,
      device_type: [0x10],
      state: [0x01] // 升入井标识：0x01(入井)；0x02(升井)
    },
    alarm: { // 报警器（室内）
      ip: '192.168.15.231',
      device_id: [0x00, 0x00, 0xb0, 0x01],
      port: 3000,
      device_type: [0x0b]
    },
    alarm_unique: { // 报警装置（唯一性检测）：闸机
      ip: '192.168.15.236',
      device_id: [0x00, 0x00, 0xc0, 0x01],
      port: 3000,
      device_type: [0x0b]
    },
    iris: {
      ip: '192.168.15.250',
      device_id: [0x00, 0x00, 0xd0, 0x01],
      port: 8989,
      deviceSn: 'C105EX2012080001'
    },
    terminal: {
      ip: '192.168.1.50',
      device_id: [0x00, 0x00, 0xe0, 0x01],
      port: 3000
    }
  },
  2: {
    test_reader: {
      ip: '192.168.15.233',
      device_id: [0x00, 0x00, 0xa0, 0x02],
      port: 3000,
      device_type: [0x10],
      state: [0x01] // 升入井标识：0x01(入井)；0x02(升井)
    },
    alarm: { // 报警器（室内）
      ip: '192.168.15.231',
      device_id: [0x00, 0x00, 0xb0, 0x01],
      port: 3000,
      device_type: [0x0b]
    },
    alarm_unique: { // 报警装置（唯一性检测）：闸机
      ip: '192.168.15.237',
      device_id: [0x00, 0x00, 0xc0, 0x02],
      port: 3000,
      device_type: [0x0b]
    },
    iris: {
      ip: '192.168.15.251',
      device_id: [0x00, 0x00, 0xd0, 0x02],
      port: 8989,
      deviceSn: 'HC300A2010260001'
    },
    terminal: {
      ip: '192.168.1.50',
      device_id: [0x00, 0x00, 0xe0, 0x01],
      port: 3000
    }
  },
  3: {
    test_reader: {
      ip: '192.168.15.234',
      device_id: [0x00, 0x00, 0xa0, 0x03],
      port: 3000,
      device_type: [0x10],
      state: [0x02] // 升入井标识：0x01(入井)；0x02(升井)
    },
    alarm: { // 报警器（室内）
      ip: '192.168.15.231',
      device_id: [0x00, 0x00, 0xb0, 0x01],
      port: 3000,
      device_type: [0x0b]
    },
    alarm_unique: { // 报警装置（唯一性检测）：闸机
      ip: '192.168.15.238',
      device_id: [0x00, 0x00, 0xc0, 0x03],
      port: 3000,
      device_type: [0x0b]
    },
    iris: {
      ip: '192.168.15.252',
      device_id: [0x00, 0x00, 0xd0, 0x03],
      port: 8989,
      deviceSn: 'C105DX2012080002'
    },
    terminal: {
      ip: '192.168.1.50',
      device_id: [0x00, 0x00, 0xe0, 0x01],
      port: 3000
    }
  },
  4: {
    test_reader: {
      ip: '192.168.15.235',
      device_id: [0x00, 0x00, 0xa0, 0x04],
      port: 3000,
      device_type: [0x10],
      state: [0x02] // 升入井标识：0x01(入井)；0x02(升井)
    },
    alarm: { // 报警器（室内）
      ip: '192.168.15.231',
      device_id: [0x00, 0x00, 0xb0, 0x01],
      port: 3000,
      device_type: [0x0b]
    },
    alarm_unique: { // 报警装置（唯一性检测）：闸机
      ip: '192.168.15.239',
      device_id: [0x00, 0x00, 0xc0, 0x04],
      port: 3000,
      device_type: [0x0b]
    },
    iris: {
      ip: '192.168.15.253',
      device_id: [0x00, 0x00, 0xd0, 0x03],
      port: 8989,
      // deviceSn: 'C105DX2012080001'
      deviceSn: 'C105GX2006230001'
    },
    terminal: {
      ip: '192.168.1.50',
      device_id: [0x00, 0x00, 0xe0, 0x01],
      port: 3000
    }
  }
}

export {ENTER_POWER, channelconfig}