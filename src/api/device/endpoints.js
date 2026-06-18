/**
 * 设备相关接口路径表（与 gps/luan 后端对齐）
 *
 * - legacy: iotdoc 通道 → /f/la/iotdoc/**（第三方代理）
 * - family: JT808 自建通道 → /f/la/device/**、/f/la/location/** 等
 *
 * 绑定/列表等会员设备接口两通道共用 /f/la/device/**。
 * 含 {deviceId} 的路径需在 adapters.resolveDevicePath 中替换。
 *
 * key 与 device-api-mode.js 中 DEVICE_API_MODE 的值一致，勿 import 常量以免循环依赖。
 */
export const DEVICE_API_ENDPOINTS = {
  /** 设备列表：legacy 不分页 /all，family 分页 GET /device */
  list: {
    legacy: '/f/la/device/all',
    family: '/f/la/device',
  },
  bind: {
    legacy: '/f/la/device/bind',
    family: '/f/la/device/bind',
  },
  unbind: {
    legacy: '/f/la/device/unbind',
    family: '/f/la/device/unbind',
  },
  /** legacy: GET ?sn=  |  family: GET /{deviceId} */
  detail: {
    legacy: '/f/la/iotdoc/device/detail',
    family: '/f/la/device/{deviceId}',
  },
  runInfo: {
    legacy: '/f/la/device/run-info',
    family: '/f/la/device/run-info',
  },
  simGet: {
    legacy: '/f/la/iotdoc/sim/get',
    family: '/f/la/iotdoc/sim/get',
  },
  simRemoteSwitch: {
    legacy: '/f/la/iotdoc/sim/remote-switch',
    family: '/f/la/iotdoc/sim/remote-switch',
  },
  /** legacy: POST query  |  family: GET /location */
  trackQuery: {
    legacy: '/f/la/iotdoc/location/query',
    family: '/f/la/location',
  },
  staySummary: {
    legacy: '/f/la/iotdoc/location/ppoint-summary',
    family: '/f/la/analytics/stops',
  },
  tripSummary: {
    legacy: '/f/la/iotdoc/location/pdistance',
    family: '/f/la/analytics/trips',
  },
  deviceConfigGet: {
    legacy: '/f/la/iotdoc/device/get-config',
    family: '/f/la/device/{deviceId}/profile',
  },
  deviceConfigSet: {
    legacy: '/f/la/iotdoc/device/set-config',
    family: '/f/la/device/{deviceId}/profile',
  },
  locationTracking: {
    legacy: '/f/la/iotdoc/location/tracking',
    family: '/f/la/device/{deviceId}/tracking',
  },
  deviceCmd: {
    legacy: '/f/la/iotdoc/device/cmd',
    family: '/f/la/device/cmd',
  },
  deviceLog: {
    legacy: '/f/la/iotdoc/device/get-log',
    family: '/f/la/device/op-logs',
  },
  locationMode: {
    legacy: '/f/la/iotdoc/loc/get-loc-mode',
    family: '/f/la/device/{deviceId}/loc-mode',
  },
  fenceGet: {
    legacy: '/f/la/iotdoc/fence/get',
    family: '/f/la/fence/get',
  },
  fenceAdd: {
    legacy: '/f/la/iotdoc/fence/add',
    family: '/f/la/fence/add',
  },
}
