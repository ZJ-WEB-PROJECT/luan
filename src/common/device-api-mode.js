import { DEVICE_API_ENDPOINTS } from '@/api/device/endpoints'

/** 设备相关接口版本 */
export const DEVICE_API_MODE = {
  LEGACY: 'legacy',
  FAMILY: 'family',
}

const STORAGE_KEY = 'deviceApiMode'
export const DEVICE_API_MODE_EVENT = 'deviceApiModeChanged'

export function getDeviceApiMode() {
  const mode = uni.getStorageSync(STORAGE_KEY)
  return mode === DEVICE_API_MODE.FAMILY ? DEVICE_API_MODE.FAMILY : DEVICE_API_MODE.LEGACY
}

export function setDeviceApiMode(mode) {
  const next = mode === DEVICE_API_MODE.FAMILY ? DEVICE_API_MODE.FAMILY : DEVICE_API_MODE.LEGACY
  uni.setStorageSync(STORAGE_KEY, next)
  uni.$emit(DEVICE_API_MODE_EVENT, next)
  return next
}

export function getDeviceApiModeLabel(mode = getDeviceApiMode()) {
  return mode === DEVICE_API_MODE.FAMILY ? '新版' : '旧版'
}

/** 根据当前版本解析设备接口路径 */
export function resolveDeviceEndpoint(key) {
  const routes = DEVICE_API_ENDPOINTS[key]
  if (!routes) {
    throw new Error(`[device-api] unknown endpoint key: ${key}`)
  }
  const mode = getDeviceApiMode()
  return routes[mode] || routes[DEVICE_API_MODE.LEGACY]
}

export function isFamilyDeviceApiMode() {
  return getDeviceApiMode() === DEVICE_API_MODE.FAMILY
}
