/**

 * 设备相关接口路径表（与 gps/luan 后端对齐）

 *

 * - iotdoc: 旧版 iotdoc 通道 → /f/la/iotdoc/**（第三方代理）

 * - jt808: 新版 JT808 自建通道 → /f/la/device/**、/f/la/location/** 等

 *

 * 绑定/列表等会员设备接口两通道共用 /f/la/device/**。

 * 含 {sn} 的路径需在 adapters.resolveDevicePath 中替换。

 *

 * key 与 device-api-mode.js 中 DEVICE_API_MODE 的值一致，勿 import 常量以免循环依赖。

 */

export const DEVICE_API_ENDPOINTS = {

  /** 设备列表：统一 /all，通过 dataChannel 区分 iotdoc / jt808 */

  list: {

    iotdoc: '/f/la/device/all',

    jt808: '/f/la/device/all',

  },

  bind: {

    iotdoc: '/f/la/device/bind',

    jt808: '/f/la/device/bind',

  },

  unbind: {

    iotdoc: '/f/la/device/unbind',

    jt808: '/f/la/device/unbind',

  },

  /** iotdoc: GET ?sn=  |  jt808: GET /{sn} */

  detail: {

    iotdoc: '/f/la/iotdoc/device/detail',

    jt808: '/f/la/device/{sn}',

  },

  runInfo: {

    iotdoc: '/f/la/device/run-info',

    jt808: '/f/la/device/run-info',

  },

  simGet: {

    iotdoc: '/f/la/iotdoc/sim/get',

    jt808: '/f/la/iotdoc/sim/get',

  },

  simRemoteSwitch: {

    iotdoc: '/f/la/iotdoc/sim/remote-switch',

    jt808: '/f/la/iotdoc/sim/remote-switch',

  },

  /** iotdoc: POST query  |  jt808: GET /location */

  trackQuery: {

    iotdoc: '/f/la/iotdoc/location/query',

    jt808: '/f/la/location',

  },

  staySummary: {

    iotdoc: '/f/la/iotdoc/location/ppoint-summary',

    jt808: '/f/la/analytics/stops',

  },

  tripSummary: {

    iotdoc: '/f/la/iotdoc/location/pdistance',

    jt808: '/f/la/analytics/trips',

  },

  deviceConfigGet: {

    iotdoc: '/f/la/iotdoc/device/get-config',

    jt808: '/f/la/device/{sn}/profile',

  },

  deviceConfigSet: {

    iotdoc: '/f/la/iotdoc/device/set-config',

    jt808: '/f/la/device/{sn}/profile',

  },

  /** iotdoc: POST set-detail  |  jt808: PUT /{sn}/detail */

  deviceDetailSet: {

    iotdoc: '/f/la/iotdoc/device/set-detail',

    jt808: '/f/la/device/{sn}/detail',

  },

  locationTracking: {

    iotdoc: '/f/la/iotdoc/location/tracking',

    jt808: '/f/la/device/{sn}/tracking',

  },

  deviceCmd: {

    iotdoc: '/f/la/iotdoc/device/cmd',

    jt808: '/f/la/device/cmd',

  },

  deviceLog: {

    iotdoc: '/f/la/iotdoc/device/get-log',

    jt808: '/f/la/device/op-logs',

  },

  locationMode: {

    iotdoc: '/f/la/iotdoc/loc/get-loc-mode',

    jt808: '/f/la/device/{sn}/loc-mode',

  },

  locationModeSet: {

    iotdoc: '/f/la/iotdoc/loc/set-loc-mode',

    jt808: '/f/la/device/{sn}/loc-mode',

  },

  timerSwitch: {

    iotdoc: '/f/la/iotdoc/timerswitch/get',

    jt808: '/f/la/device/{sn}/timer-switch',

  },

  terminalParams: {

    iotdoc: '/f/la/iotdoc/device/detail',

    jt808: '/f/la/device/{sn}/terminal-params',

  },

  trackDates: {

    iotdoc: '/f/la/iotdoc/location/track-dates',

    jt808: '/f/la/location/dates',

  },

  analyticsDistance: {

    iotdoc: '/f/la/iotdoc/location/pdistance',

    jt808: '/f/la/analytics/distance',

  },

  analyticsOverspeed: {

    iotdoc: '/f/la/iotdoc/location/pdistance',

    jt808: '/f/la/analytics/overspeed',

  },

  alarmList: {

    iotdoc: '/f/la/iotdoc/alarm/get',

    jt808: '/f/la/alarm',

  },

  fenceModify: {

    iotdoc: '/f/la/iotdoc/fence/modify',

    jt808: '/f/la/fence/modify',

  },

  fenceDel: {

    iotdoc: '/f/la/iotdoc/fence/del',

    jt808: '/f/la/fence/del',

  },

  fenceGet: {

    iotdoc: '/f/la/iotdoc/fence/get',

    jt808: '/f/la/fence/get',

  },

  fenceAdd: {

    iotdoc: '/f/la/iotdoc/fence/add',

    jt808: '/f/la/fence/add',

  },

}


