import { AMAP_KEY, AMAP_SECURITY_CODE, AMAP_WEB_SERVICE_KEY } from './amap-config'

const reverseGeoCache = new Map()

// #ifdef H5
let loadPromise = null

function canUseJsApi() {
  return typeof window !== 'undefined' && !!AMAP_KEY && !!AMAP_SECURITY_CODE
}
// #endif

/** 须在加载地图脚本之前设置（高德 2.0 强制要求，仅 H5） */
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
 * 加载高德 JS API 2.0（仅 H5 / App WebView）
 * @see https://lbs.amap.com/api/javascript-api-v2/guide/abc/load
 */
export function loadAmap() {
  // #ifdef H5
  if (!canUseJsApi()) {
    return Promise.reject(new Error('当前环境无法使用高德 JS API'))
  }
  if (window.AMap) {
    return Promise.resolve(window.AMap)
  }

  ensureAmapSecurityConfig()

  if (!loadPromise) {
    loadPromise = import('@amap/amap-jsapi-loader')
      .then(({ default: AMapLoader }) =>
        AMapLoader.load({
          key: AMAP_KEY,
          version: '2.0',
          plugins: ['AMap.Geocoder'],
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
            : `高德地图加载失败：${msg}。请确认 Referer 白名单已添加当前域名`
        )
      })
  }
  return loadPromise
  // #endif

  // #ifndef H5
  return Promise.reject(new Error('当前环境无法使用高德 JS API'))
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

function parseRegeoRestResponse(res) {
  const body = res?.data
  if (!body || body.status !== '1') {
    const info = body?.info || ''
    if (info === 'USERKEY_PLAT_NOMATCH') {
      console.warn(
        '[amap] REST 逆地理编码 Key 平台不匹配：请在控制台申请「Web服务」类型 Key，'
        + '配置 VITE_AMAP_WEB_SERVICE_KEY（不可使用 JS API Key 调用 restapi.amap.com）',
      )
    } else if (info) {
      console.warn('[amap] REST 逆地理编码失败:', info, body?.infocode || '')
    }
    return ''
  }
  return body.regeocode?.formatted_address || ''
}

/** REST 逆地理（小程序 / App 等场景，须 Web服务 Key） */
function reverseGeocodeByRest(lat, lng) {
  const key = AMAP_WEB_SERVICE_KEY
  if (!key) {
    return Promise.resolve('')
  }
  return new Promise((resolve) => {
    uni.request({
      url: 'https://restapi.amap.com/v3/geocode/regeo',
      method: 'GET',
      data: {
        key,
        location: `${lng},${lat}`,
        extensions: 'base',
      },
      success: (res) => {
        resolve(parseRegeoRestResponse(res))
      },
      fail: (err) => {
        console.warn('[amap] reverseGeocode REST failed:', err)
        resolve('')
      },
    })
  })
}

// #ifdef H5
async function reverseGeocodeByJsApi(lat, lng) {
  if (!canUseJsApi()) return ''
  try {
    const AMap = await loadAmap()
    return await new Promise((resolve) => {
      const geocoder = new AMap.Geocoder()
      geocoder.getAddress([lng, lat], (status, result) => {
        if (status === 'complete' && result?.regeocode?.formattedAddress) {
          resolve(result.regeocode.formattedAddress)
        } else {
          const info = result?.info || status
          if (info && info !== 'no_data') {
            console.warn('[amap] JS API 逆地理编码失败:', info)
          }
          resolve('')
        }
      })
    })
  } catch (e) {
    console.warn('[amap] reverseGeocode JS API failed:', e)
    return ''
  }
}
// #endif

/** 坐标 → 地址（GCJ-02，高德逆地理编码） */
export async function reverseGeocodeAddress(latitude, longitude) {
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return ''

  const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`
  if (reverseGeoCache.has(cacheKey)) {
    return reverseGeoCache.get(cacheKey)
  }

  let address = ''
  // #ifdef H5
  address = await reverseGeocodeByJsApi(lat, lng)
  // #endif
  if (!address) {
    address = await reverseGeocodeByRest(lat, lng)
  }

  if (address) reverseGeoCache.set(cacheKey, address)
  return address
}
