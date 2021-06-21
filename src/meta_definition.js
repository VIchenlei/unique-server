const metadata = {
  staff: {
    name: 'staff',
    label: '员工',
    table: 'dat_staff',
    keyIndex: 0, // table中key值在 field 中的位置
    fields: {
      names: ['staff_id', 'name', 'rank', 'sex_id', 'certification', 'birthday', 'pic', 'blood', 'height', 'weight', 'marry_id', 'education_id', 'medicine', 'telephone', 'relative_telephone', 'address'], // 字段
      types: ['NUMBER', 'STRING', 'NUMBER', 'SELECT', 'STRING', 'STRING', 'FILE', 'STRING', 'NUMBER', 'NUMBER', 'SELECT', 'SELECT', 'STRING', 'STRING', 'STRING', 'STRING'], // 字段类型
      labels: ['员工编号', '姓名', '序号', '员工性别', '身份证', '出生日期', '照片', '血型', '身高(cm)', '体重(kg)', '婚姻状况', '学历', '药物过敏史', '联系方式', '亲属电话', '地址'],
      enableNull: [false, false, true, false, false, true, true, true, true, true, true, true, true, true, true, true]
    }
  },
  staff_extend: {
    name: 'staff_extend',
    label: '人员业务表',
    table: 'dat_staff_extend',
    keyIndex: 0,
    fields: {
      names: ['staff_id', 'dept_id', 'dept_id_ck', 'card_id', 'lampNo', 'occupation_id', 'worktype_id', 'shift_type_id', 'min_work_time', 'need_display'], // 字段
      types: ['NUMBER', 'SELECT', 'SELECT', 'NUMBER', 'STRING', 'SELECT', 'SELECT', 'SELECT', 'NUMBER', 'NUMBER'], // 字段类型
      labels: ['员工', '部门', '虚拟部门', '卡号', '矿灯号', '职务', '工种', '班制', '最小下井时长', '是否显示(0:不显示;1:显示)'],
      enableNull: [false, true, true, false, true, true, true, true, true, true, true, true, true, true]
    }
  },
  dept: {
    name: 'dept',
    label: '部门',
    table: 'dat_dept',
    keyIndex: 0, // table中key值在 field 中的位置
    fields: {
      names: ['dept_id', 'hm_dept_id', 'name', 'abbr', 'address', 'phone', 'rank', 'dept_info'], // 字段
      types: ['NUMBER', 'NUMBER', 'STRING', 'STRING', 'STRING', 'STRING', 'NUMBER', 'STRING'], // 字段类型
      labels: ['部门编号', '虹膜部门编号', '部门名称', '部门缩写', '部门地址', '部门电话', '部门排序', '备注'],
      enableNull: [false, false, false, true, true, true, true, true]
    }
  },
  map: {
    name: 'map',
    label: '地图',
    table: 'dat_map',
    keyIndex: 0, // table中key值在 field 中的位置
    fields: {
      names: ['map_id', 'name', 'url', 'check_layers', 'layers', 'map_type', 'scale', 'detail', 'state_id', 'default_map', 'judge_id', 'x', 'y', 'width', 'height', 'minX', 'minY', 'maxX', 'maxY'], // 字段, md5用于更新地图
      types: ['NUMBER', 'STRING', 'STRING', 'STRING', 'STRING', 'STRING', 'NUMBER', 'STRING', 'SELECT', 'SELECT', 'SELECT', 'NUMBER', 'NUMBER', 'NUMBER', 'NUMBER', 'NUMBER', 'NUMBER', 'NUMBER', 'NUMBER'], // 字段类型
      labels: ['地图编号', '地图名称', '地图网址', '检查图层', '图层', '类型',  '伸缩比例', '详细描述', '是否有效', '是否默认地图', '是否平铺', '中心x', '中心y', '地图宽', '地图高', '左边界', '上边界', '右边界', '下边界'],
      enableNull: [false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
    }
  },
  area: {
    name: 'area',
    label: '区域',
    table: 'dat_area',
    keyIndex: 0, // table中key值在 field 中的位置
    fields: {
      names: ['area_id', 'name', 'area_type_id', 'business_type', 'map_id', 'over_count_person', 'over_count_vehicle', 'over_time_person', 'over_speed_vehicle', 'path', 'angle', 'is_work_area', 'over_count_person_rp', 'need_display'], // 字段
      types: ['NUMBER', 'STRING', 'SELECT', 'NUMBER', 'SELECT', 'NUMBER', 'NUMBER', 'NUMBER', 'STRING', 'STRING', 'NUMBER', 'SELECT', 'NUMBER', 'SELECT'], // 字段类型
      labels: ['区域编号', '区域名称', '区域类型', '区域业务', '所属地图', '人数上限', '车辆上限', '人停留时长上限(分钟)', '车速上限(Km/h)', '区域定义', '车辆角度', '是否是工作区域', '区域核对人数上限', '是否对外展示'],
      enableNull: [false, false, false, false, false, false, false, false, false, false, true, true, true, false]
    }
  },
}

module.exports = metadata