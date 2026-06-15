import dayjs from 'dayjs'

/** 游标模式 */
export const PAGE_MODE = {
  /** 报表：lastSimei + lastTime */
  DEFAULT: 'default',
  /** 行程：额外 lastStartTime */
  TRIP: 'trip',
  /** 围栏等：lastSfid，无需时间范围 */
  SFID: 'sfid',
  /** 页码分页：page(从0) + size，如消息列表 */
  INDEX: 'index',
  /** 设备操作日志：lastImei + lastTime，beginTime/endTime 为毫秒 */
  LOG: 'log',
}

const DEFAULT_LIMIT = 20
const MAX_PAGES = 50

/**
 * 构建游标分页请求体（LocationReportReq 等接口通用）
 * @param {Object} options
 * @param {string} options.sn
 * @param {number} options.timeBegin
 * @param {number} options.timeEnd
 * @param {Object} [options.cursor]
 * @param {Object} [options.extra] - 额外字段，如 stopTime
 * @param {'default'|'trip'} [options.mode]
 */
export function buildPageBody({
  sn,
  timeBegin,
  timeEnd,
  limitSize = DEFAULT_LIMIT,
  cursor = {},
  extra = {},
  mode = PAGE_MODE.DEFAULT,
}) {
  const body = {
    sn: String(sn || ''),
    timeBegin: Number(timeBegin) || 0,
    timeEnd: Number(timeEnd) || 0,
    limitSize: Number(limitSize) || DEFAULT_LIMIT,
    ...extra,
  }

  if (cursor.lastSimei) body.lastSimei = String(cursor.lastSimei)
  if (cursor.lastTime > 0) body.lastTime = Number(cursor.lastTime)
  if (mode === PAGE_MODE.TRIP && cursor.lastStartTime > 0) {
    body.lastStartTime = Number(cursor.lastStartTime)
  }

  return body
}

/** 构建设备操作日志请求体（beginTime/endTime 为 13 位毫秒时间戳） */
export function buildLogPageBody({
  sn,
  beginTime = 0,
  endTime = 0,
  limitSize = DEFAULT_LIMIT,
  cursor = {},
  extra = {},
}) {
  const body = {
    sn: String(sn || ''),
    beginTime: Number(beginTime) || 0,
    endTime: Number(endTime) || 0,
    limitSize: Number(limitSize) || DEFAULT_LIMIT,
    ...extra,
  }
  const lastImei = cursor.lastImei ?? cursor.last_imei
  if (lastImei != null && lastImei !== '' && Number(lastImei) !== 0) {
    body.lastImei = Number(lastImei)
  }
  if (cursor.lastTime > 0) {
    body.lastTime = Number(cursor.lastTime)
  }
  return body
}

/** 构建仅 sn + limitSize + lastSfid 的请求体（围栏列表等） */
export function buildSnPageBody({
  sn,
  limitSize = DEFAULT_LIMIT,
  cursor = {},
  extra = {},
}) {
  const body = {
    sn: String(sn || ''),
    limitSize: Number(limitSize) || DEFAULT_LIMIT,
    ...extra,
  }
  if (cursor.lastSfid) {
    body.lastSfid = String(cursor.lastSfid)
  }
  return body
}

/** 日期 YYYY-MM-DD → 当日起止时间戳（秒） */
export function dayToTimeRange(dateStr) {
  const day = dayjs(dateStr)
  if (!day.isValid()) {
    const now = dayjs()
    return { timeBegin: now.startOf('day').unix(), timeEnd: now.endOf('day').unix() }
  }
  return {
    timeBegin: day.startOf('day').unix(),
    timeEnd: day.endOf('day').unix(),
  }
}

/** 解析分页接口响应 */
export function unwrapPageRes(res) {
  if (Array.isArray(res)) {
    return { data: res, rawList: res, errcode: 0, is_finish: true }
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

  const list = payload?.data ?? payload?.list ?? payload?.items ?? []
  const rawList = Array.isArray(list) ? list : []

  return {
    data: rawList,
    rawList,
    errcode: payload?.errcode ?? payload?.code ?? res?.code ?? 0,
    error_message: payload?.error_message ?? payload?.msg ?? payload?.message ?? '',
    is_finish: payload?.is_finish === true || payload?.isFinish === true,
    last_simei: payload?.last_simei ?? payload?.lastSimei ?? '',
    last_time: payload?.last_time ?? payload?.lastTime ?? 0,
    last_start_time: payload?.last_start_time ?? payload?.lastStartTime ?? 0,
    last_sfid: payload?.last_sfid ?? payload?.lastSfid ?? '',
    last_imei: payload?.last_imei ?? payload?.lastImei ?? 0,
  }
}

export function extractCursor(item, mode = PAGE_MODE.DEFAULT) {
  if (!item || typeof item !== 'object') {
    return { lastSfid: '', lastSimei: '', lastTime: 0, lastStartTime: 0 }
  }

  const raw = item

  if (mode === PAGE_MODE.SFID) {
    return {
      lastSfid: String(raw.sfid ?? raw.id ?? raw.fence_id ?? raw.fenceId ?? ''),
      lastSimei: '',
      lastTime: 0,
      lastStartTime: 0,
      lastImei: 0,
    }
  }

  if (mode === PAGE_MODE.LOG) {
    return {
      lastSfid: '',
      lastSimei: '',
      lastImei: Number(raw.imei ?? raw.last_imei ?? raw.lastImei ?? 0),
      lastTime: Number(raw.time ?? raw.last_time ?? raw.create_time ?? raw.createTime ?? 0),
      lastStartTime: 0,
    }
  }

  const cursor = {
    lastSfid: '',
    lastSimei: raw.simei ?? raw.last_simei ?? raw.imei ?? raw.sn ?? '',
    lastTime: Number(raw.time ?? raw.end_time ?? raw.endTime ?? raw.last_time ?? 0),
    lastStartTime: Number(raw.start_time ?? raw.startTime ?? 0),
  }

  if (mode === PAGE_MODE.TRIP && !cursor.lastStartTime) {
    cursor.lastStartTime = cursor.lastTime
  }

  return cursor
}

function mergeCursor(itemCursor, wrapped, mode = PAGE_MODE.DEFAULT) {
  if (mode === PAGE_MODE.LOG) {
    return {
      lastImei: wrapped?.last_imei ?? wrapped?.lastImei ?? itemCursor.lastImei ?? 0,
      lastTime: wrapped?.last_time ?? wrapped?.lastTime ?? itemCursor.lastTime ?? 0,
      lastSfid: '',
      lastSimei: '',
      lastStartTime: 0,
    }
  }
  return {
    lastSfid: wrapped?.last_sfid || wrapped?.lastSfid || itemCursor.lastSfid || '',
    lastSimei: wrapped?.last_simei || itemCursor.lastSimei || '',
    lastTime: wrapped?.last_time || itemCursor.lastTime || 0,
    lastStartTime: wrapped?.last_start_time || itemCursor.lastStartTime || 0,
    lastImei: 0,
  }
}

function hasNextCursor(cursor, mode) {
  if (mode === PAGE_MODE.SFID) return !!cursor.lastSfid
  if (mode === PAGE_MODE.LOG) return Number(cursor.lastTime) > 0
  return !!(cursor.lastSimei || cursor.lastTime)
}

/** 列表原样返回，不 map 改写单项结构 */
function toPageList(data) {
  return Array.isArray(data) ? [...data] : []
}

/** 拉取全部页 */
export async function fetchAllPages({
  requestFn,
  getBody,
  mode = PAGE_MODE.DEFAULT,
  maxPages = MAX_PAGES,
  errorMsg = '加载失败',
}) {
  if (!requestFn) throw new Error('requestFn 不能为空')
  if (!getBody) throw new Error('getBody 不能为空')

  const all = []
  let cursor = {}
  let isFinish = false
  let page = 0

  while (!isFinish && page < maxPages) {
    const wrapped = unwrapPageRes(await requestFn(getBody(cursor)))

    if (wrapped.errcode !== 0 && wrapped.errcode !== 200) {
      throw new Error(wrapped.error_message || errorMsg)
    }

    const batch = toPageList(wrapped.data)
    if (!batch.length) break

    all.push(...batch)
    isFinish = wrapped.is_finish

    const lastRaw = wrapped.rawList[wrapped.rawList.length - 1]
    cursor = mergeCursor(extractCursor(lastRaw, mode), wrapped, mode)
    page += 1

    const limitSize = getBody({}).limitSize || DEFAULT_LIMIT
    if (isFinish || batch.length < limitSize) break
    if (!hasNextCursor(cursor, mode)) break
  }

  return all
}

/** 拉取单页 */
export async function fetchPage({
  requestFn,
  getBody,
  cursor = {},
  mode = PAGE_MODE.DEFAULT,
  getCursor,
  errorMsg = '加载失败',
}) {
  const wrapped = unwrapPageRes(await requestFn(getBody(cursor)))

  if (wrapped.errcode !== 0 && wrapped.errcode !== 200) {
    throw new Error(wrapped.error_message || errorMsg)
  }

  const list = toPageList(wrapped.data)
  const lastRaw = list[list.length - 1]
  const nextCursor = typeof getCursor === 'function'
    ? getCursor(lastRaw, wrapped, lastRaw)
    : mergeCursor(extractCursor(lastRaw, mode), wrapped, mode)
  const limitSize = getBody({}).limitSize || DEFAULT_LIMIT
  const canContinue = hasNextCursor(nextCursor, mode)

  return {
    list,
    cursor: nextCursor,
    isFinish: wrapped.is_finish || !list.length || list.length < limitSize || !canContinue,
    errcode: wrapped.errcode,
    error_message: wrapped.error_message,
  }
}

/** 构建页码分页查询参数（GET query） */
export function buildIndexParams({
  page = 0,
  size = DEFAULT_LIMIT,
  sort,
  extra = {},
}) {
  const params = {
    page: Number(page) || 0,
    size: Number(size) || DEFAULT_LIMIT,
    ...extra,
  }
  if (sort != null && sort !== '') {
    params.sort = Array.isArray(sort) ? sort : [sort]
  }
  return params
}

/** 解析页码分页响应（Spring Page / 自定义列表） */
export function unwrapIndexPageRes(res) {
  if (Array.isArray(res)) {
    return {
      list: res,
      page: 0,
      totalPages: 1,
      isLast: true,
      errcode: 0,
    }
  }

  let payload = res
  if (
    payload?.data &&
    typeof payload.data === 'object' &&
    !Array.isArray(payload.data) &&
    (Array.isArray(payload.data.content) ||
      Array.isArray(payload.data.items) ||
      Array.isArray(payload.data.records) ||
      'last' in payload.data)
  ) {
    payload = payload.data
  }

  const list =
    payload?.content ??
    payload?.items ??
    payload?.records ??
    payload?.list ??
    (Array.isArray(payload?.data) ? payload.data : [])

  const page = payload?.number ?? payload?.page ?? 0
  const size = payload?.size ?? DEFAULT_LIMIT
  const totalPages = payload?.totalPages ?? payload?.total_pages
  const isLast =
    payload?.last === true ||
    (totalPages != null && page >= totalPages - 1) ||
    (Array.isArray(list) && list.length < size)

  return {
    list: Array.isArray(list) ? list : [],
    page: Number(page) || 0,
    totalPages,
    isLast,
    errcode: payload?.errcode ?? res?.code ?? 0,
    error_message: payload?.error_message ?? payload?.msg ?? payload?.message ?? '',
  }
}

/** 拉取一页（page 从 0 开始） */
export async function fetchIndexPage({
  requestFn,
  page = 0,
  size = DEFAULT_LIMIT,
  sort,
  extra = {},
  errorMsg = '加载失败',
}) {
  if (!requestFn) throw new Error('requestFn 不能为空')

  const params = buildIndexParams({ page, size, sort, extra })
  const res = await requestFn(params)
  const wrapped = unwrapIndexPageRes(res)

  if (wrapped.errcode !== 0 && wrapped.errcode !== 200 && wrapped.errcode != null) {
    throw new Error(wrapped.error_message || errorMsg)
  }

  const list = toPageList(wrapped.list)
  const pageNum = Number(page) || 0
  const isFinish = wrapped.isLast || !list.length || list.length < size

  return {
    list,
    page: pageNum,
    nextPage: pageNum + 1,
    isFinish,
  }
}
