import { staticUrl } from '@/common/assets.js'

export const DEVICE_ICON_OPTIONS = [
  { key: 'default', label: '默认', src: staticUrl('/static/device-icons/default.png') },
  { key: 'car', label: '汽车', src: staticUrl('/static/device-icons/car.png') },
  { key: 'motorcycle', label: '摩托车', src: staticUrl('/static/device-icons/motorcycle.png') },
  { key: 'cow', label: '牛', src: staticUrl('/static/device-icons/cow.png') },
  { key: 'horse', label: '马', src: staticUrl('/static/device-icons/horse.png') },
  { key: 'sheep', label: '羊', src: staticUrl('/static/device-icons/sheep.png') },
  { key: 'man', label: '男人', src: staticUrl('/static/device-icons/man.png') },
  { key: 'woman', label: '女人', src: staticUrl('/static/device-icons/woman.png') },
  { key: 'pet', label: '宠物', src: staticUrl('/static/device-icons/pet.png') },
]

const ICON_SRC_MAP = Object.fromEntries(
  DEVICE_ICON_OPTIONS.map((item) => [item.key, item.src]),
)

export function getDeviceInfoStorageKey(sn) {
  return `device_info_${sn}`
}

/** 根据 icon / iconKey 解析地图标记图标 URL */
export function resolveDeviceIconSrc(iconKey) {
  const key = String(iconKey || 'default').trim() || 'default'
  return ICON_SRC_MAP[key] || ICON_SRC_MAP.default
}

/** 从设备详情或本地缓存解析 iconKey */
export function resolveDeviceIconKey(device = {}) {
  const sn = device.sn || device.imei || device.deviceNo
  const fromDevice = device.icon || device.iconKey
  if (fromDevice) return String(fromDevice).trim()

  if (sn) {
    const saved = uni.getStorageSync(getDeviceInfoStorageKey(sn))
    if (saved?.iconKey) return saved.iconKey
  }
  return 'default'
}
