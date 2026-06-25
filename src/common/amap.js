import { AMAP_KEY, AMAP_SECURITY_CODE } from './amap-config'
console.log(AMAP_KEY, AMAP_SECURITY_CODE)
let loadPromise = null

/** 须在加载地图脚本之前设置（高德 2.0 强制要求） */
export function ensureAmapSecurityConfig() {
  // #ifdef H5
  if (typeof window === 'undefined') return
  if (!AMAP_SECURITY_CODE) return
  window._AMapSecurityConfig = {
    securityJsCode: AMAP_SECURITY_CODE,
  }
  // #endif
}

/**
 * 加载高德 JS API 2.0（仅 H5，使用官方 Loader）
 * @see https://lbs.amap.com/api/javascript-api-v2/guide/abc/load
 */
export function loadAmap() {
  // #ifndef H5
  // return Promise.reject(new Error('AMap JS API only available on H5'))
  // #endif

  // #ifdef H5
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window unavailable'))
  }
  if (window.AMap) {
    return Promise.resolve(window.AMap)
  }
  if (!AMAP_KEY) {
    return Promise.reject(
      new Error('请配置 .env.production 中的 VITE_AMAP_KEY，并重启 dev 服务')
    )
  }
  if (!AMAP_SECURITY_CODE) {
    return Promise.reject(
      new Error('请配置 .env.production 中的 VITE_AMAP_SECURITY_CODE（高德 2.0 必填）')
    )
  }

  ensureAmapSecurityConfig()

  if (!loadPromise) {
    loadPromise = import('@amap/amap-jsapi-loader')
      .then(({ default: AMapLoader }) =>
        AMapLoader.load({
          key: AMAP_KEY,
          version: '2.0',
          plugins: [],
        })
      )
      .then((AMap) => {
        if (!AMap) {
          throw new Error('AMap 对象未就绪')
        }
        return AMap
      })
      .catch((err) => {
        loadPromise = null
        const msg = err?.message || err?.info || String(err)
        if (/USER_DAILY_QUERY_OVER_LIMIT|DAILY_QUERY_OVER_LIMIT|10044/i.test(msg)) {
          throw new Error('高德 Key 当日配额已用完（USER_DAILY_QUERY_OVER_LIMIT），请更换 Key 或次日再试')
        }
        if (/INVALID_USER_KEY|USERKEY_PLAT_NOMATCH/i.test(msg)) {
          throw new Error('Key 无效或平台不匹配，请使用 Web端(JS API) 类型 Key')
        }
        if (/INVALID_USER_SCODE|security/i.test(msg)) {
          throw new Error('安全密钥错误，请检查 VITE_AMAP_SECURITY_CODE')
        }
        throw new Error(
          msg.includes('fetch') || msg.includes('加载')
            ? msg
            : `高德地图加载失败：${msg}。请确认 Referer 白名单已添加 http://127.0.0.1:5174`
        )
      })
  }
  return loadPromise
  // #endif
}

/** 打开高德导航（H5 跳转 URI，App/小程序走 openLocation） */
export function openAmapNavigation({ longitude, latitude, name = '', address = '' }) {
  const lng = Number(longitude)
  const lat = Number(latitude)
  if (!lng || !lat) {
    uni.$u?.toast?.('暂无有效坐标') || uni.showToast({ title: '暂无有效坐标', icon: 'none' })
    return
  }

  // #ifdef H5
  const label = encodeURIComponent(name || address || '目的地')
  window.location.href = `https://uri.amap.com/marker?position=${lng},${lat}&name=${label}&coordinate=gaode&callnative=1`
  return
  // #endif

  uni.openLocation({
    longitude: lng,
    latitude: lat,
    name: name || address || '设备位置',
    address: address || name || '',
    scale: 16,
  })
}

/** 获取当前位置（GCJ-02，与高德一致） */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    uni.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: (res) => {
        console.log('res',res)
        resolve({ longitude: res.longitude, latitude: res.latitude })
      },
      fail: (err) => reject(err),
    })
  })
}

/** 计算两点距离（米） */
export function getDistanceMeters(lng1, lat1, lng2, lat2) {
  const toRad = (d) => (d * Math.PI) / 180
  const R = 6378137
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(meters) {
  if (meters == null || Number.isNaN(meters)) return '--'
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(3)}km`
}
