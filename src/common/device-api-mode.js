import { DEVICE_API_ENDPOINTS } from '@/api/device/endpoints'

/** 设备相关接口版本 */
export const DEVICE_API_MODE = {
  /** 旧版：iotdoc 第三方代理通道 */
  IOTDOC: 'iotdoc',
  /** 新版：JT808 自建通道 */
  JT808: 'jt808',
}

const STORAGE_KEY = 'deviceApiMode'
export const DEVICE_API_MODE_EVENT = 'deviceApiModeChanged'

function normalizeDeviceApiMode(mode) {
  if (mode === DEVICE_API_MODE.JT808 || mode === 'family') {
    return DEVICE_API_MODE.JT808
  }
  if (mode === DEVICE_API_MODE.IOTDOC || mode === 'legacy') {
    return DEVICE_API_MODE.IOTDOC
  }
  return DEVICE_API_MODE.IOTDOC
}

export function getDeviceApiMode() {
  const mode = uni.getStorageSync(STORAGE_KEY)
  return normalizeDeviceApiMode(mode)
}

export function setDeviceApiMode(mode) {
  const next = normalizeDeviceApiMode(mode)
  uni.setStorageSync(STORAGE_KEY, next)
  uni.$emit(DEVICE_API_MODE_EVENT, next)
  return next
}

export function getDeviceApiModeLabel(mode = getDeviceApiMode()) {
  return mode === DEVICE_API_MODE.JT808 ? '新版' : '旧版'
}

/** 根据当前版本解析设备接口路径 */
export function resolveDeviceEndpoint(key) {
  const routes = DEVICE_API_ENDPOINTS[key]
  if (!routes) {
    throw new Error(`[device-api] unknown endpoint key: ${key}`)
  }
  const mode = getDeviceApiMode()
  return routes[mode] || routes[DEVICE_API_MODE.IOTDOC]
}

export function isJt808DeviceApiMode() {
  return getDeviceApiMode() === DEVICE_API_MODE.JT808
}
