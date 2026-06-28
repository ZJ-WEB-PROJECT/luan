/**
 * 高德地图配置（H5 开发/打包均读取 .env.production）
 * - JS API Key：https://console.amap.com/dev/key/app（类型：Web端 JS API）
 * - Web 服务 Key：同控制台申请「Web服务」类型，供 App 端 REST 逆地理编码兜底
 * Referer 示例：http://127.0.0.1:5174/*、https://dtdw-eight.vercel.app/*
 */
export const AMAP_KEY = (import.meta.env.VITE_AMAP_KEY || '').trim()
export const AMAP_SECURITY_CODE = (import.meta.env.VITE_AMAP_SECURITY_CODE || '').trim()
/** REST API（逆地理编码等）专用，须为「Web服务」类型 Key，不可与 JS API Key 混用 */
export const AMAP_WEB_SERVICE_KEY = (import.meta.env.VITE_AMAP_WEB_SERVICE_KEY || '').trim()

/** 默认中心：九江市濂溪区（与演示设备地址一致） */
export const DEFAULT_MAP_CENTER = {
  longitude: 118.6,
  latitude: 24.9,
}

export const DEFAULT_MAP_SCALE = 16
