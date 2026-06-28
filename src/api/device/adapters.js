import dayjs from 'dayjs'
import { resolveDeviceEndpoint, isJt808DeviceApiMode } from '@/common/device-api-mode'
import { reverseGeocodeAddress } from '@/common/amap'
import { DEVICE_ICON_OPTIONS } from '@/common/device-icons'

const CURRENT_DEVICE_KEY = 'currentDevice'
const PAGE_CURSOR_PREFIX = '__page:'
const FENCE_COORD_SCALE = 1_000_000

function fromFenceCoord(value) {
  const num = Number(value)
  if (!num) return 0
  return num / FENCE_COORD_SCALE
}



/** sn / deviceId → la_device.id（内部映射，请求参数已统一为 sn） */

export function resolveDeviceId(data = {}) {

  if (data.deviceId != null && data.deviceId !== '') {

    return Number(data.deviceId)

  }

  const sn = String(data.sn || '').trim()

  if (!sn) return null



  const current = uni.getStorageSync(CURRENT_DEVICE_KEY)

  if (current) {

    if (String(current.sn) === sn && current.deviceId != null) {

      return Number(current.deviceId)

    }

    if (String(current.sn) === sn && current.raw?.deviceId != null) {

      return Number(current.raw.deviceId)

    }

    if (String(current.sn) === sn && current.raw?.id != null) {

      return Number(current.raw.id)

    }

  }

  return null

}



/** 解析设备 SN（路径参数 / 查询参数） */

export function resolveDeviceSn(data = {}) {

  const sn = String(data.sn || '').trim()

  if (sn) return sn



  const current = uni.getStorageSync(CURRENT_DEVICE_KEY)

  if (current?.sn) return String(current.sn).trim()



  return null

}



/** 替换路径中的 {sn} */

export function resolveDevicePath(key, params = {}) {

  const sn = resolveDeviceSn(params)

  if (!sn) {

    throw new Error('未找到设备 SN，请重新选择设备')

  }

  const path = resolveDeviceEndpoint(key)

  return path.replace('{sn}', encodeURIComponent(sn))

}



/** Unix 秒 → yyyy-MM-dd HH:mm:ss（JT808 查询参数） */

export function unixToDateTime(ts) {

  const n = Number(ts)

  if (!n) return ''

  return dayjs.unix(n).format('YYYY-MM-DD HH:mm:ss')

}



/** 后端时间字符串 → Unix 秒 */

export function dateTimeToUnix(value) {

  if (value == null || value === '') return 0

  if (typeof value === 'number') {

    return value > 1e12 ? Math.floor(value / 1000) : value

  }

  const d = dayjs(value)

  return d.isValid() ? d.unix() : 0

}



export function parsePageCursor(lastSimei) {

  const raw = String(lastSimei || '')

  if (!raw.startsWith(PAGE_CURSOR_PREFIX)) return 0

  const page = Number(raw.slice(PAGE_CURSOR_PREFIX.length))

  return Number.isFinite(page) && page >= 0 ? page : 0

}



export function buildPageCursor(page) {

  return `${PAGE_CURSOR_PREFIX}${page}`

}



/** Spring PageResult → 游标分页兼容结构 */

export function unwrapSpringPage(res, page = 0, size = 20) {

  let payload = res

  if (payload?.content == null && payload?.data?.content != null) {

    payload = payload.data

  }

  const list = payload?.content ?? payload?.items ?? payload?.records ?? (Array.isArray(payload) ? payload : [])

  const pageNum = payload?.number ?? page

  const pageSize = payload?.size ?? size

  const totalPages = payload?.totalPages

  const isLast =

    payload?.last === true ||

    (totalPages != null && pageNum >= totalPages - 1) ||

    (Array.isArray(list) && list.length < pageSize)



  return {

    list: Array.isArray(list) ? list : [],

    page: Number(pageNum) || 0,

    isLast,

  }

}



export function wrapCursorPageResponse(items, { page, isLast }) {

  return {

    data: items,

    errcode: 0,

    is_finish: isLast,

    last_simei: isLast ? '' : buildPageCursor(page + 1),

  }

}



/** App iconKey → iotdoc SetDetail.params.car_image（number，按 DEVICE_ICON_OPTIONS 顺序） */
export function mapIconKeyToIotdocCarImage(iconKey) {
  const key = String(iconKey ?? '').trim()
  if (!key) return 0
  const num = Number(key)
  if (Number.isFinite(num) && String(num) === key) return num
  const idx = DEVICE_ICON_OPTIONS.findIndex((item) => item.key === key)
  return idx >= 0 ? idx : 0
}

/** iotdoc car_image → App iconKey */
export function mapIotdocCarImageToIconKey(carImage) {
  const idx = Number(carImage)
  if (!Number.isFinite(idx)) return 'default'
  return DEVICE_ICON_OPTIONS[idx]?.key || 'default'
}

function hasNativeIotdocDetailFields(params) {
  if (!params || typeof params !== 'object') return false
  return [
    'car_image', 'car_number', 'user_name', 'user_phone', 'user_image',
    'car_type', 'user_addr', 'user_cer', 'user_mail',
  ].some((key) => params[key] !== undefined)
}

/**
 * 页面字段 → iotdoc 三方 SetDetail.params
 * @see device.SetDetail（func/module 由后端代理注入，前端只传 params）
 */
export function buildIotdocSetDetailParams(data = {}) {
  if (hasNativeIotdocDetailFields(data.params)) {
    const { simei, ...rest } = data.params
    return rest
  }

  const src = data.detail ?? data
  const params = {}

  const carNumber = src.car_number ?? src.alias ?? src.deviceName
  if (carNumber != null && String(carNumber).trim()) {
    params.car_number = String(carNumber).trim()
  }

  const userName = src.user_name ?? src.contactName ?? src.contact
  if (userName != null && String(userName).trim()) {
    params.user_name = String(userName).trim()
  }

  const userPhone = src.user_phone ?? src.contactPhone
  if (userPhone != null && String(userPhone).trim()) {
    params.user_phone = String(userPhone).trim()
  }

  const iconRaw = src.car_image ?? src.icon ?? src.iconKey
  if (iconRaw != null && iconRaw !== '') {
    params.car_image = mapIconKeyToIotdocCarImage(iconRaw)
  }

  return params
}

/** 解包详情响应（兼容 data / detail 嵌套） */
function unwrapDeviceDetailResponse(res) {
  if (!res || typeof res !== 'object') return res
  let raw = { ...res }
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
    raw = { ...raw, ...raw.data }
  }
  if (raw.detail && typeof raw.detail === 'object') {
    raw = { ...raw, ...raw.detail }
  }
  return raw
}

function parseLastPos(lastPosRaw) {
  let lastPos = lastPosRaw
  if (typeof lastPos === 'string') {
    try {
      lastPos = JSON.parse(lastPos)
    } catch {
      lastPos = null
    }
  }
  return lastPos && typeof lastPos === 'object' ? lastPos : null
}

function parseLastComTime(raw) {
  const lastComRaw = raw.last_com_time ?? raw.lastSeenTime ?? raw.updateTime
  if (lastComRaw == null || lastComRaw === '') return 0
  if (typeof lastComRaw === 'number') {
    return lastComRaw > 1e12 ? Math.floor(lastComRaw / 1000) : lastComRaw
  }
  return dateTimeToUnix(lastComRaw)
}

function mapIotdocStatus(state) {
  if (state === 'e_line_sleep') return { status: '静止', statusType: 'static', state }
  if (state === 'e_line_down') return { status: '离线', statusType: 'offline', state }
  if (state === 'e_line_on') return { status: '在线', statusType: 'static', state }
  return { status: '在线', statusType: 'static', state: state || 'e_line_on' }
}

/**
 * iotdoc GetDetail → 页面统一结构
 * 三方字段见 device.SetDetail / GetDetail（car_image、user_name 等）
 */
export function normalizeIotdocDeviceDetail(res) {
  const raw = unwrapDeviceDetailResponse(res)
  const lastPos = parseLastPos(raw.last_pos ?? raw.lastPos)
  const lastComTime = parseLastComTime(raw)
  const wgs = typeof lastPos?.wgs === 'string' ? String(lastPos.wgs) : ''
  const [latStr, lngStr] = wgs.split(',')
  const latitude = Number.isFinite(Number(latStr)) ? Number(latStr) : raw.latitude
  const longitude = Number.isFinite(Number(lngStr)) ? Number(lngStr) : raw.longitude
  const statusInfo = mapIotdocStatus(raw.state)

  const iconKey = raw.icon ?? raw.iconKey
    ?? (raw.car_image != null && raw.car_image !== ''
      ? mapIotdocCarImageToIconKey(raw.car_image)
      : 'default')
  const userImageKey = raw.user_image != null && raw.user_image !== ''
    ? mapIotdocCarImageToIconKey(raw.user_image)
    : ''

  const sn = String(raw.sn ?? raw.simei ?? raw.imei ?? '').trim()
  const alias = raw.alias ?? raw.car_number ?? ''
  const contactName = raw.contactName ?? raw.user_name ?? ''
  const contactPhone = raw.contactPhone ?? raw.bck_phone ?? ''

  return {
    ...raw,
    sn,
    imei: sn || raw.imei || raw.simei || '',
    simei: raw.simei ?? sn,
    alias,
    deviceName: alias,
    name: raw.name ?? (alias || sn),
    contactName,
    contact: contactName,
    contactPhone,
    icon: iconKey,
    iconKey,
    userImageKey,
    carNumber: raw.car_number ?? '',
    carType: raw.car_type ?? '',
    carImage: raw.car_image ?? null,
    engineNum: raw.engine_num ?? '',
    frameNum: raw.frame_num ?? '',
    centerPhone: raw.center_phone ?? '',
    insuranceDate: raw.scar_safe_time ?? '',
    annualCheckDate: raw.scar_year_check ?? '',
    userName: raw.user_name ?? '',
    userPhone: raw.user_phone ?? '',
    userAddr: raw.user_addr ?? '',
    userCer: raw.user_cer ?? '',
    userMail: raw.user_mail ?? '',
    userSex: raw.user_sex ?? '',
    userImage: raw.user_image ?? null,
    imgPos: raw.img_pos ?? '',
    imgOther: raw.img_other ?? '',
    model: raw.model ?? raw.car_type ?? raw.ver ?? '',
    ver: raw.ver ?? raw.car_type ?? '',
    last_pos: lastPos,
    last_com_time: lastComTime || raw.last_com_time,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    address: (lastPos && lastPos.addr) || raw.address || raw.user_addr || '',
    power: raw.power ?? raw.battery ?? 0,
    ...statusInfo,
  }
}

/** JT808 LaDeviceItemDto → 页面统一结构 */
export function normalizeJt808DeviceDetail(res) {
  const raw = unwrapDeviceDetailResponse(res)
  const lat = raw.lastLat ?? raw.latitude
  const lng = raw.lastLng ?? raw.longitude
  const online = raw.onlineStatus === 1
  const lastPos = {
    wgs: lat != null && lng != null ? `${lat},${lng}` : '',
    addr: raw.address || '',
  }
  const lastComTime = parseLastComTime(raw)
  const status = online ? '在线' : '离线'
  const sn = String(raw.sn ?? raw.imei ?? '').trim()

  return {
    ...raw,
    sn,
    deviceId: raw.deviceId ?? raw.id,
    imei: sn || raw.imei,
    alias: raw.alias ?? '',
    deviceName: raw.alias ?? raw.name ?? sn,
    name: raw.name ?? raw.alias ?? sn,
    contactName: raw.contactName ?? '',
    contact: raw.contactName ?? '',
    contactPhone: raw.contactPhone ?? '',
    icon: raw.icon ?? raw.iconKey ?? '',
    iconKey: raw.iconKey ?? raw.icon ?? '',
    lbsSwitch: raw.lbsSwitch,
    lbsOn: raw.lbsSwitch === 1 || raw.lbsSwitch === true,
    state: online ? 'e_line_on' : 'e_line_down',
    status,
    statusType: online ? 'static' : 'offline',
    power: raw.batteryPercent ?? raw.power ?? 0,
    latitude: lat,
    longitude: lng,
    address: raw.address || lastPos.addr || '',
    last_com_time: lastComTime,
    last_pos: lastPos,
    model: raw.model ?? raw.jtDeviceModel ?? raw.ver ?? '',
  }
}

/** 设备详情统一格式化（iotdoc / JT808） */
export function normalizeDeviceDetail(res) {
  if (!res || typeof res !== 'object') return res
  if (isJt808DeviceApiMode()) {
    return normalizeJt808DeviceDetail(res)
  }
  return normalizeIotdocDeviceDetail(res)
}


/** LaAlarmItemDto → iotdoc 告警列表字段（message 页兼容） */
export async function enrichDeviceDetailAddress(detail) {
  if (!detail || typeof detail !== 'object' || !isJt808DeviceApiMode()) {
    return detail
  }

  const existing = String(detail.address || detail.last_pos?.addr || '').trim()
  if (existing) return detail

  const lat = detail.latitude ?? detail.lastLat
  const lng = detail.longitude ?? detail.lastLng
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    return detail
  }

  const address = await reverseGeocodeAddress(lat, lng)
  if (!address) return detail

  const lastPos = {
    ...(detail.last_pos || {}),
    wgs: detail.last_pos?.wgs || `${lat},${lng}`,
    addr: address,
  }
  return { ...detail, address, last_pos: lastPos }
}


/** LaAlarmItemDto → iotdoc 告警列表字段（message 页兼容） */
export function mapAlarmToIotdoc(item) {
  const raw = item || {}
  let time = 0
  const ts = raw.deviceTime ?? raw.time ?? raw.alarm_time
  if (ts != null) {
    time = typeof ts === 'number'
      ? (ts > 1e12 ? Math.floor(ts / 1000) : ts)
      : dateTimeToUnix(ts)
  }
  return {
    id: raw.id,
    alarm_name: raw.alarm_name ?? raw.alarmType ?? raw.alarm_type ?? '告警',
    time,
    imei: raw.imei ?? raw.sn ?? '',
    raw,
  }
}


export function mapStopToIotdoc(item) {

  const start = dateTimeToUnix(item?.startTime)

  const end = dateTimeToUnix(item?.endTime)

  const durationSec = Number(item?.durationSec) || (end && start ? end - start : 0)

  const lat = item?.lat

  const lng = item?.lng

  const wgs = item?.wgs || (lat != null && lng != null ? `${lat},${lng}` : '')

  return {

    start_time: start,

    end_time: end,

    stop_time: durationSec,

    wgs,

    lat,

    lon: lng,

    longitude: lng,

    latitude: lat,

    items: [{ start_time: start, cos_time: durationSec }],

  }

}



/** LaTripDto → iotdoc 行程报表字段 */

export function mapTripToIotdoc(item) {

  const start = dateTimeToUnix(item?.startTime)

  const end = dateTimeToUnix(item?.endTime)

  const durationSec = Number(item?.durationSec) || (end && start ? end - start : 0)

  return {

    start_time: start,

    stop_time: end,

    end_time: end,

    cos_time: durationSec,

    start_wgs: item?.startWgs || (item?.startLat != null ? `${item.startLat},${item.startLng}` : ''),

    stop_wgs: item?.endWgs || (item?.endLat != null ? `${item.endLat},${item.endLng}` : ''),

    end_wgs: item?.endWgs,

    distance: item?.distanceM,

  }

}



/** LaTrackPointDto → iotdoc 轨迹点 */

export function mapTrackPointToIotdoc(item) {

  let wgs = item?.wgs

  if (!wgs && item?.lat != null && item?.lng != null) {

    wgs = `${item.lat},${item.lng}`

  }

  return {

    wgs,

    time: dateTimeToUnix(item?.deviceTime),

    speed: item?.speed != null ? Number(item.speed) : 0,

    direction: item?.direction ?? 0,

    type: 1,

    distance: 0,

    duration: 0,

    ptype: 0,

    ptype_all: 0,

  }

}



/** LaDeviceOpLogDto → iotdoc 操作日志字段 */

export function mapOpLogToIotdoc(item) {

  const ts = dateTimeToUnix(item?.createTime)

  return {

    time: ts,

    create_time: ts,

    imei: item?.deviceId ?? 0,

    type: item?.opType ?? '',

    content: item?.opSummary ?? item?.opDetail ?? '',

    raw: item,

  }

}



const JT_FENCE_TYPE_TO_IOTDOC = {

  circle: 'e_type_circle',

  polygon: 'e_type_polygon',

  rectangle: 'e_type_polygon',

}



/** LaFenceDto → iotdoc 围栏列表项 */

export function mapJtFenceToIotdoc(dto) {

  const type = JT_FENCE_TYPE_TO_IOTDOC[dto?.fenceType] || dto?.fenceType || ''

  const ofence = parseJtGeoJson(dto?.fenceType, dto?.geoJson)

  let alarm = ''

  if (dto?.alarmIn && dto?.alarmOut) alarm = 'e_fence_in_out'

  else if (dto?.alarmIn) alarm = 'e_fence_in'

  else if (dto?.alarmOut) alarm = 'e_fence_out'



  return {

    sfid: String(dto?.id ?? ''),

    id: dto?.id,

    name: dto?.name ?? '',

    type,

    fence_type: dto?.fenceType,

    alarm,

    ofence,

    raw: dto,

  }

}



function parseJtGeoJson(fenceType, geoJson) {

  if (!geoJson) return {}

  let geo

  try {

    geo = typeof geoJson === 'string' ? JSON.parse(geoJson) : geoJson

  } catch {

    return {}

  }

  if (fenceType === 'circle') {

    return {

      circle: {

        lat: Math.round(Number(geo.centerLat) * 1_000_000),

        lon: Math.round(Number(geo.centerLng) * 1_000_000),

        radius: Number(geo.radiusM) || 0,

      },

    }

  }

  if (fenceType === 'polygon' && Array.isArray(geo.points)) {

    return {

      polygon: {

        poit: geo.points.map((p) => ({

          lat: Math.round(Number(p.lat) * 1_000_000),

          lon: Math.round(Number(p.lng) * 1_000_000),

        })),

      },

    }

  }

  return {}

}



const IOTDOC_FENCE_TYPE_TO_JT = {

  e_type_circle: 'circle',

  e_type_polygon: 'polygon',

  e_type_city: 'polygon',

}



/** iotdoc 围栏创建参数 → JT808 FenceSaveReq */

export function buildJtFenceSaveBody(payload = {}) {

  const sn = resolveDeviceSn(payload)

  const params = payload.params || payload

  const type = params.type || ''

  const fenceType = IOTDOC_FENCE_TYPE_TO_JT[type] || 'circle'

  const ofence = params.ofence || {}

  let geoJson = {}



  if (fenceType === 'circle' && ofence.circle) {

    geoJson = {

      centerLat: fromFenceCoord(ofence.circle.lat),

      centerLng: fromFenceCoord(ofence.circle.lon),

      radiusM: Number(ofence.circle.radius) || 0,

    }

  } else if (fenceType === 'polygon' && ofence.polygon?.poit) {

    geoJson = {

      points: (ofence.polygon.poit || []).map((p) => ({

        lat: fromFenceCoord(p.lat),

        lng: fromFenceCoord(p.lon),

      })),

    }

  }



  const alarm = params.alarm || ''

  const alarmIn = alarm === 'e_fence_in' || alarm === 'e_fence_in_out' ? 1 : 0

  const alarmOut = alarm === 'e_fence_out' || alarm === 'e_fence_in_out' ? 1 : 0



  return {

    sn,

    fence: {

      ...(payload.fenceId != null || payload.editId != null

        ? { id: Number(payload.fenceId ?? payload.editId) }

        : {}),

      name: String(params.name || '').trim(),

      fenceType,

      geoJson: JSON.stringify(geoJson),

      alarmIn,

      alarmOut,

    },

  }

}


