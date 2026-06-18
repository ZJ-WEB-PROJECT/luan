import dayjs from 'dayjs'
import http from '@/common/request'
import {
  isFamilyDeviceApiMode,
  resolveDeviceEndpoint,
  DEVICE_API_MODE,
} from '@/common/device-api-mode'
import {
  resolveDeviceSn,
  resolveDevicePath,
  unixToDateTime,
  parsePageCursor,
  unwrapSpringPage,
  wrapCursorPageResponse,
  mapStopToIotdoc,
  mapTripToIotdoc,
  mapTrackPointToIotdoc,
  mapOpLogToIotdoc,
  mapJtFenceToIotdoc,
  buildJtFenceSaveBody,
  normalizeDeviceDetail,
} from '@/api/device/adapters'

const httpOpts = { auth: true }

/** 获取设备列表 */
export function getDeviceList(data = {}) {
  if (isFamilyDeviceApiMode()) {
    return http.get(resolveDeviceEndpoint('list'), {
      page: data.page ?? 0,
      size: data.size ?? 200,
      groupId: data.groupId,
      sn: data.sn,
    }, { ...httpOpts, loading: false })
  }
  return http.get(resolveDeviceEndpoint('list'), data, {
    ...httpOpts,
    loading: false,
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

/** 批量刷新设备运行状态（JT808） */
export function refreshDeviceRunInfo(sns) {
  const list = (Array.isArray(sns) ? sns : [sns]).filter(Boolean)
  return http.post(resolveDeviceEndpoint('runInfo'), { sns: list }, { ...httpOpts, loading: true })
}

/** 绑定设备 */
export function bindDevice(data) {
  return http.post(resolveDeviceEndpoint('bind'), data, { ...httpOpts, loading: true })
}

/** 解绑设备 */
export function unbindDevice(data) {
  return http.post(resolveDeviceEndpoint('unbind'), data, { ...httpOpts, loading: true })
}

/** 设备详情 */
export async function getDeviceDetail(data) {
  let res
  if (isFamilyDeviceApiMode()) {
    const url = resolveDevicePath('detail', data)
    res = await http.get(url, {}, { ...httpOpts, loading: true })
  } else {
    res = await http.get(resolveDeviceEndpoint('detail'), { sn: resolveDeviceSn(data) }, { ...httpOpts, loading: true })
  }
  return normalizeDeviceDetail(res)
}

/** 获取SIM卡信息（仅 iotdoc 通道） */
export function getSimDetail(data) {
  return http.post(resolveDeviceEndpoint('simGet'), data, { ...httpOpts, loading: true })
}

/** 远程开关机（仅 iotdoc 通道） */
export function simRemoteSwitch(data) {
  return http.post(resolveDeviceEndpoint('simRemoteSwitch'), data, { ...httpOpts, loading: true })
}

/** 设备轨迹（单页） */
export async function getDeviceTrack(data) {
  if (!isFamilyDeviceApiMode()) {
    return http.post(resolveDeviceEndpoint('trackQuery'), data, { ...httpOpts, loading: true })
  }
  const sn = resolveDeviceSn(data)
  const page = Number(data._trackPage) || 0
  const size = Number(data.limitSize) || 100
  const res = await http.get(resolveDeviceEndpoint('trackQuery'), {
    sn,
    timeBegin: unixToDateTime(data.timeBegin),
    timeEnd: unixToDateTime(data.timeEnd),
    page,
    size,
  }, { ...httpOpts, loading: true })
  const wrapped = unwrapSpringPage(res, page, size)
  const points = wrapped.list.map(mapTrackPointToIotdoc)
  return {
    data: points,
    errcode: 0,
    is_finish: wrapped.isLast,
    _trackPage: page,
  }
}

/** 停留报表（PPoint / PPointSummary） */
export async function getDeviceStay(data) {
  if (!isFamilyDeviceApiMode()) {
    return http.post(resolveDeviceEndpoint('staySummary'), data, { ...httpOpts, loading: false })
  }
  const sn = resolveDeviceSn(data)
  const page = parsePageCursor(data.lastSimei)
  const size = Number(data.limitSize) || 20
  const res = await http.get(resolveDeviceEndpoint('staySummary'), {
    sn,
    timeBegin: unixToDateTime(data.timeBegin),
    timeEnd: unixToDateTime(data.timeEnd),
    page,
    size,
  }, { ...httpOpts, loading: false })
  const wrapped = unwrapSpringPage(res, page, size)
  return wrapCursorPageResponse(wrapped.list.map(mapStopToIotdoc), wrapped)
}

/** 行程报表（PDistance） */
export async function getDeviceTrip(data) {
  if (!isFamilyDeviceApiMode()) {
    return http.post(resolveDeviceEndpoint('tripSummary'), data, { ...httpOpts, loading: false })
  }
  const sn = resolveDeviceSn(data)
  const page = parsePageCursor(data.lastSimei)
  const size = Number(data.limitSize) || 20
  const res = await http.get(resolveDeviceEndpoint('tripSummary'), {
    sn,
    timeBegin: unixToDateTime(data.timeBegin),
    timeEnd: unixToDateTime(data.timeEnd),
    page,
    size,
  }, { ...httpOpts, loading: false })
  const wrapped = unwrapSpringPage(res, page, size)
  return wrapCursorPageResponse(wrapped.list.map(mapTripToIotdoc), wrapped)
}

/** 获取设备配置 */
export async function getDeviceConfig(data) {
  if (isFamilyDeviceApiMode()) {
    const url = resolveDevicePath('deviceConfigGet', data)
    return http.get(url, {}, { ...httpOpts, loading: false })
  }
  return http.post(resolveDeviceEndpoint('deviceConfigGet'), data, { ...httpOpts, loading: false })
}

/** 立即定位 / 实时追踪 */
export async function locationTracking(data) {
  if (isFamilyDeviceApiMode()) {
    const url = resolveDevicePath('locationTracking', data)
    return http.post(url, {
      intervalSec: data.intervalTime ?? data.intervalSec ?? 10,
      durationSec: data.effectiveTime ?? data.durationSec ?? 300,
    }, { ...httpOpts, loading: true })
  }
  return http.post(resolveDeviceEndpoint('locationTracking'), data, { ...httpOpts, loading: true })
}

/** 下发设备指令 */
export async function sendDeviceCmd(data) {
  if (isFamilyDeviceApiMode()) {
    const sn = resolveDeviceSn(data)
    return http.post(resolveDeviceEndpoint('deviceCmd'), {
      sn,
      type: data.type,
      alarmtype: data.alarmtype,
      content: data.content,
    }, { ...httpOpts, loading: true })
  }
  return http.post(resolveDeviceEndpoint('deviceCmd'), data, { ...httpOpts, loading: true })
}

/** 修改设备配置 */
export async function setDeviceConfig(data) {
  if (isFamilyDeviceApiMode()) {
    const url = resolveDevicePath('deviceConfigSet', data)
    const body = data.profile ?? data.params ?? data
    return http.put(url, body, { ...httpOpts, loading: true })
  }
  return http.post(resolveDeviceEndpoint('deviceConfigSet'), data, { ...httpOpts, loading: true })
}

/** 设备操作日志 */
export async function getDeviceLog(data) {
  if (!isFamilyDeviceApiMode()) {
    return http.post(resolveDeviceEndpoint('deviceLog'), data, { ...httpOpts, loading: false })
  }
  const sn = resolveDeviceSn(data)
  const page = parsePageCursor(data.lastImei ? `__page:${data.lastImei}` : data.lastSimei)
  const size = Number(data.limitSize) || 20
  const res = await http.get(resolveDeviceEndpoint('deviceLog'), {
    sn,
    opType: data.type || data.opType || undefined,
    page,
    size,
  }, { ...httpOpts, loading: false })
  const wrapped = unwrapSpringPage(res, page, size)
  const logs = wrapped.list.map(mapOpLogToIotdoc)
  const last = logs[logs.length - 1]
  return {
    data: logs,
    errcode: 0,
    is_finish: wrapped.isLast,
    last_time: last?.time ?? 0,
    last_imei: wrapped.isLast ? 0 : page + 1,
  }
}

/** 获取定位模式 */
export async function getLocationMode(data) {
  if (isFamilyDeviceApiMode()) {
    const url = resolveDevicePath('locationMode', data)
    return http.get(url, {}, { ...httpOpts, loading: false })
  }
  return http.post(resolveDeviceEndpoint('locationMode'), data, { ...httpOpts, loading: false })
}

/** 格式化报表时间戳（秒） */
export function formatReportTime(ts) {
  const t = Number(ts)
  if (!t) return ''
  return dayjs.unix(t).format('YYYY/MM/DD HH:mm:ss')
}

/** 停留时长展示 */
export function formatStayDuration(seconds) {
  const s = Number(seconds) || 0
  if (s >= 60) return `${(s / 60).toFixed(2)}分钟`
  return `${s}秒`
}

/** 操作日志时间格式化（支持秒/毫秒时间戳） */
export function formatDeviceLogTime(ts) {
  const n = Number(ts)
  if (!n) return ''
  const d = n > 1e12 ? dayjs(n) : dayjs.unix(n)
  return d.isValid() ? d.format('YYYY/MM/DD HH:mm:ss') : String(ts)
}


/** 停留报表项 → 页面展示 */
export function normalizeStayReportItem(item) {
  const start = item?.start_time ?? item?.startTime
  const end = item?.end_time ?? item?.endTime
  const durationSec = Number(
    item?.stop_time ?? item?.stopTime ?? item?.duration ?? (end && start ? end - start : 0),
  )
  const wgs = item?.wgs || ''
  const lon = item?.lon ?? item?.longitude
  const lat = item?.lat ?? item?.latitude
  const coord = wgs || (lon != null && lat != null ? `${lon},${lat}` : '')

  return {
    stayTime: item?.stay_time_str || formatStayDuration(durationSec),
    startTime: formatReportTime(start),
    endTime: formatReportTime(end),
    address: item?.address || coord,
    raw: item,
  }
}

/** 行程报表项 → 页面展示 */
export function normalizeTripReportItem(item) {
  const start = item?.start_time ?? item?.startTime
  const end = item?.end_time ?? item?.endTime
  const durationSec = Number(item?.duration ?? (end && start ? end - start : 0))
  const startWgs = item?.start_wgs ?? item?.startWgs ?? ''
  const endWgs = item?.end_wgs ?? item?.endWgs ?? ''

  return {
    startTime: formatReportTime(start),
    endTime: formatReportTime(end),
    duration: item?.duration_str || formatStayDuration(durationSec),
    startPoint: startWgs || item?.start_point || '',
    endPoint: endWgs || item?.end_point || '',
    raw: item,
  }
}


/** 获取围栏列表 */
export async function getFenceList(data) {
  if (!isFamilyDeviceApiMode()) {
    return http.post(resolveDeviceEndpoint('fenceGet'), data, { ...httpOpts, loading: false })
  }
  const sn = resolveDeviceSn(data)
  const list = await http.post(resolveDeviceEndpoint('fenceGet'), {
    sn,
    limitSize: data.limitSize,
    lastSfid: data.lastSfid,
  }, { ...httpOpts, loading: false })
  const items = (Array.isArray(list) ? list : []).map(mapJtFenceToIotdoc)
  return { data: items, is_finish: true, errcode: 0 }
}

/** 创建围栏（同 addFence） */
export function createFence(data) {
  return addFence(data)
}

/** 创建分享链接 */
export function createShareLink(data) {
  return http.post('/f/la/share/create', data, { loading: true, auth: true })
}

/** 访客查看分享定位（传 shareToken，无需登录） */
export function getShareView(data) {
  return http.get('/f/la/share/view', data, { loading: true, auth: false })
}

/** 解析访客分享定位数据 */
export function normalizeShareViewDevice(res) {
  const raw = res?.data ?? res ?? {}
  let lastPos = raw.last_pos ?? raw.lastPos
  if (typeof lastPos === 'string') {
    try {
      lastPos = JSON.parse(lastPos)
    } catch {
      lastPos = null
    }
  }
  let latitude = Number(raw.latitude ?? raw.lat)
  let longitude = Number(raw.longitude ?? raw.lng ?? raw.lon)
  let address = raw.address ?? raw.addr ?? ''
  if (lastPos?.wgs) {
    const pos = String(lastPos.wgs).split(',')
    latitude = Number(pos[0])
    longitude = Number(pos[1])
    address = lastPos.addr || address
  }
  const state = raw.state ?? raw.status
  const status =
    state === 'e_line_sleep' ? '静止' : state === 'e_line_down' ? '离线' : '在线'
  return {
    name: raw.name ?? raw.deviceName ?? raw.imei ?? raw.sn ?? '',
    imei: raw.imei ?? raw.sn ?? '',
    status,
    power: Number(raw.power ?? raw.battery ?? 0),
    address,
    latitude,
    longitude,
    updateTime: raw.updateTime ?? raw.update_time ?? '',
    raw,
  }
}


const FENCE_COORD_SCALE = 1_000_000

/** 经纬度转接口坐标（原值 × 1000000） */
export function toFenceCoord(value) {
  const num = Number(value)
  if (!num) return 0
  return Math.round(num * FENCE_COORD_SCALE)
}

/** 接口坐标转经纬度 */
export function fromFenceCoord(value) {
  const num = Number(value)
  if (!num) return 0
  return num / FENCE_COORD_SCALE
}

export const FENCE_TYPE_LABELS = {
  e_type_circle: '圆形围栏',
  e_type_polygon: '多边形围栏',
  e_type_city: '行政区围栏',
}

export const FENCE_ALARM_LABELS = {
  e_fence_in: '入围栏',
  e_fence_out: '出围栏',
  e_fence_in_out: '出入围栏',
}

/** 解析省/市选择为 city.name / city.district */
export function parseFenceRegion(region) {
  const parts = String(region || '').split('/').map((s) => s.trim()).filter(Boolean)
  if (parts.length >= 3) {
    return {
      provinceName: parts[0],
      cityName: parts[1],
      districtName: parts.slice(2).join('/'),
    }
  }
  if (parts.length === 2) {
    return {
      provinceName: parts[0],
      cityName: parts[1],
      districtName: '',
    }
  }
  return {
    provinceName: '',
    cityName: parts[0] || '',
    districtName: '',
  }
}

/** 构建创建围栏 params（文档 params.* 结构） */
export function buildFenceCreateParams({
  name,
  type,
  simei,
  mapCenter,
  radius,
  polygonPoints,
  region,
  alarm,
}) {
  const params = {
    name: String(name || '').trim(),
    type,
  }

  if (Array.isArray(simei) && simei.length) {
    params.simei = simei.map(String)
  }
  if (alarm) {
    params.alarm = alarm
  }

  const ofence = {}
  if (type === 'e_type_circle') {
    ofence.circle = {
      lat: toFenceCoord(mapCenter?.latitude),
      lon: toFenceCoord(mapCenter?.longitude),
      radius: Number(radius) || 0,
    }
  } else if (type === 'e_type_polygon') {
    ofence.polygon = {
      poit: (polygonPoints || []).map((point) => ({
        lat: toFenceCoord(point.latitude),
        lon: toFenceCoord(point.longitude),
      })),
    }
  } else if (type === 'e_type_city') {
    const { cityName, districtName } = parseFenceRegion(region)
    ofence.city = {
      name: cityName,
      district: districtName,
    }
  }
  params.ofence = ofence

  return { params }
}

/** 规范化围栏列表项（接口 → 页面展示/编辑） */
export function normalizeFenceItem(item) {
  const type = item?.type || item?.fence_type || ''
  const ofence = item?.ofence || {}
  let center = null
  let polygonPoints = []
  let radius = 300
  let region = ''

  if (type === 'e_type_circle' && ofence.circle) {
    center = {
      latitude: fromFenceCoord(ofence.circle.lat),
      longitude: fromFenceCoord(ofence.circle.lon),
    }
    radius = Number(ofence.circle.radius) || 300
  } else if (type === 'e_type_polygon' && ofence.polygon?.poit) {
    polygonPoints = (ofence.polygon.poit || []).map((point) => ({
      latitude: fromFenceCoord(point.lat),
      longitude: fromFenceCoord(point.lon),
    }))
  } else if (type === 'e_type_city' && ofence.city) {
    const city = ofence.city
    region = city.district ? `${city.name}/${city.district}` : (city.name || '')
  }

  const alarm = item?.alarm || ''
  return {
    id: item?.sfid ?? item?.id ?? item?.fence_id ?? item?.fenceId ?? '',
    sfid: item?.sfid ?? item?.id ?? item?.fence_id ?? item?.fenceId ?? '',
    name: item?.name || '',
    type,
    typeLabel: FENCE_TYPE_LABELS[type] || type,
    alarm,
    alarmLabel: FENCE_ALARM_LABELS[alarm] || alarm,
    radius,
    region,
    center,
    polygonPoints,
  }
}

/** 规范化围栏列表响应 */
export function normalizeFenceList(res) {
  let list = res
  if (res && !Array.isArray(res)) {
    list = res.list || res.data || res.fences || res.items || []
  }
  if (!Array.isArray(list)) return []
  return list.map(normalizeFenceItem).filter((item) => item.id || item.name)
}

/** 添加围栏 */
export async function addFence(data) {
  if (isFamilyDeviceApiMode()) {
    const body = buildJtFenceSaveBody(data)
    return http.post(resolveDeviceEndpoint('fenceAdd'), body, { ...httpOpts, loading: true })
  }
  return http.post(resolveDeviceEndpoint('fenceAdd'), data, { ...httpOpts, loading: true })
}

/** 定位方式 type 文案 */
export const TRACK_LOCATE_TYPE_LABELS = {
  0: '基站定位',
  1: 'GPS定位',
  2: 'Wi-Fi定位',
  3: '静态基站',
  4: '静态GPS',
  5: '静态Wi-Fi',
}

/** 解析 wgs 字段 "纬度,经度" */
export function parseTrackWgs(wgs) {
  if (!wgs || typeof wgs !== 'string') return null
  const parts = wgs.split(',').map((s) => parseFloat(String(s).trim()))
  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return null
  return { latitude: parts[0], longitude: parts[1] }
}

/** 单条轨迹点规范化 */
export function normalizeTrackPoint(item, mileageKm = 0) {
  const pos = parseTrackWgs(item?.wgs)
  if (!pos) return null
  const distanceM = Number(item.distance) || 0
  const nextMileageKm = mileageKm + distanceM / 1000
  const time = Number(item.time) || 0
  const locateType = Number(item.type)
  const speedNum = Number(item.speed) || 0
  return {
    latitude: pos.latitude,
    longitude: pos.longitude,
    time,
    locateTime: time ? dayjs.unix(time).format('YYYY/MM/DD HH:mm:ss') : '',
    workMode: TRACK_LOCATE_TYPE_LABELS[locateType] ?? '未知',
    locateType,
    speedNum,
    speed: `${speedNum}km/h`,
    direction: Number(item.direction) || 0,
    mileageKm: nextMileageKm,
    mileage: `${nextMileageKm.toFixed(2)}km`,
    distanceM,
    ptype: Number(item.ptype) || 0,
    ptypeAll: Number(item.ptype_all) || 0,
    duration: Number(item.duration) || 0,
    startTime: item.start_time,
    endTime: item.end_time,
    address: '',
    status: 'normal',
  }
}

/** 规范化轨迹接口响应体 */
export function unwrapTrackResponse(res) {
  if (Array.isArray(res)) {
    return { data: res, errcode: 0, is_finish: true }
  }
  let payload = res
  if (
    payload?.data &&
    typeof payload.data === 'object' &&
    !Array.isArray(payload.data) &&
    (Array.isArray(payload.data.data) || 'is_finish' in payload.data)
  ) {
    payload = payload.data
  }
  return {
    data: payload?.data ?? [],
    errcode: payload?.errcode ?? payload?.code ?? res?.code ?? 0,
    error_message: payload?.error_message ?? payload?.msg ?? payload?.message ?? '',
    is_finish: payload?.is_finish === true || payload?.isFinish === true,
  }
}

/** 按定位类型筛选轨迹点 */
export function filterTrackByLocateType(points, { baseStationOn = true, wifiOn = true } = {}) {
  return points.filter((p) => {
    const t = p.locateType
    if (t === 1 || t === 4) return true
    if (t === 0 || t === 3) return baseStationOn
    if (t === 2 || t === 5) return wifiOn
    return true
  })
}

/**
 * 分页拉取完整轨迹（is_finish=false 时用末点 time 作为 last_time 继续请求）
 */
export async function fetchDeviceTrackAll({
  sn,
  timeBegin,
  timeEnd,
  limitSize = 100,
}) {
  const all = []
  let lastTime = 0
  let isFinish = false
  let mileageKm = 0
  let page = 0
  const maxPages = 50
  const familyMode = isFamilyDeviceApiMode()

  while (!isFinish && page < maxPages) {
    const body = { sn, timeBegin, timeEnd, limitSize }
    if (familyMode) {
      body._trackPage = page
    } else if (lastTime > 0) {
      body.last_time = lastTime
    }

    const res = await getDeviceTrack(body)
    const wrapped = unwrapTrackResponse(res)

    if (wrapped.errcode !== 0 && wrapped.errcode !== 200) {
      throw new Error(wrapped.error_message || '轨迹查询失败')
    }

    const batch = (wrapped.data || [])
      .map((item) => {
        const point = normalizeTrackPoint(item, mileageKm)
        if (point) mileageKm = point.mileageKm
        return point
      })
      .filter(Boolean)

    if (!batch.length) {
      isFinish = true
      break
    }

    all.push(...batch)
    isFinish = wrapped.is_finish
    if (!familyMode) {
      lastTime = batch[batch.length - 1].time
    }
    page += 1

    if (isFinish) break
    if (batch.length < limitSize) break
  }

  if (all.length) {
    all[0].status = 'start'
    all[all.length - 1].status = 'end'
  }

  return all
}

/** 规范化设备列表 */
export function normalizeDeviceList(res) {
  let list = res
  if (res && !Array.isArray(res)) {
    list = res.content || res.list || res.records || res.data || res.devices || []
  }
  if (!Array.isArray(list)) return []
  return list.map((item) => {
    const sn = item.sn || item.deviceNo || item.deviceId || item.id || ''
    const onlineStatus = item.onlineStatus
    let status = item.status || item.onlineStatus
    if (status === 0 || status === 1) {
      status = status === 1 ? '在线' : '离线'
    }
    const statusStr = typeof status === 'number'
      ? (status === 1 ? '在线' : '离线')
      : (onlineStatus === 1 ? '在线' : onlineStatus === 0 ? '离线' : String(status || '离线'))
    const isStatic = statusStr === '静止' || statusStr === '静止中'
    return {
      deviceId: item.deviceId ?? item.id ?? null,
      name: item.alias || item.name || item.deviceName || sn,
      sn: String(sn),
      status: statusStr,
      statusType: isStatic ? 'static' : (statusStr.includes('线') && statusStr !== '在线' ? 'offline' : 'static'),
      latitude: item.lastLat ?? item.latitude,
      longitude: item.lastLng ?? item.longitude,
      address: item.address,
      sourceType: item.sourceType,
      onlineStatus,
      raw: item,
    }
  }).filter((d) => d.sn)
}

export { DEVICE_API_MODE, getDeviceApiMode, setDeviceApiMode, getDeviceApiModeLabel } from '@/common/device-api-mode'
