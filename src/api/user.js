import dayjs from 'dayjs'
import http, { uploadFile } from '@/common/request'
import { toAbsoluteFileUrl } from '@/common/config'

/** 手机号密码登录 */
export function loginByPassword(data) {
  return http.post('/f/la/auth/phone/login/password', data, { loading: true, auth: false })
}

/** 退出登录 */
export function logout() {
  return http.post('/f/la/auth/logout', {}, { loading: true })
}

/** 获取用户信息 */
export function getUserInfo() {
  return http.get('/f/la/members/me', { loading: true, auth: true })
}

/** 注册 */
export function register(data) {
  return http.post('/f/la/auth/phone/register', data, { loading: true, auth: false })
}

/** 发送注册验证码 */
export function sendCode(data) {
  return http.post('/f/la/auth/phone/send-code', data, { loading: true, auth: false })
}


/** 微信授权后绑定手机号 */
export function bindWechatPhone(data) {
  return http.post('/f/la/auth/wechat/bind-phone', data, { loading: true, auth: false })
}

/** 通过微信手机号授权 code 解析手机号 */
export function getWechatPhoneNumber(data) {
  return http.post('/f/la/auth/wechat/phone', data, { loading: true, auth: false })
}

/** 微信授权登录（小程序） */
export function loginByWechat(data) {
  return http.post('/f/la/auth/wechat/login', data, { loading: true, auth: false })
}

/** 短信绑定手机 */
export function bindPhoneBySms(data) {
  return http.post('/f/la/auth/wechat/bind-phone/sms', data, { loading: true, auth: false })
}

/** 获取告警列表 */
export function getAlarmList(data) {
  return http.post('/f/la/iotdoc/alarm/get', data, { loading: true, auth: true })
}

/** 修改密码 */
export function changePassword(data) {
  return http.post('/f/la/auth/password/change', data, { loading: true, auth: true })
}

/**文本协议 */
export function contentConfig(data) {
  return http.get('/f/la/config', data, { loading: true, auth: false })
}

/** 解析上传接口返回的图片地址 */
export function normalizeFeedbackImageUrl(res) {
  if (!res) return ''
  if (typeof res === 'string') return res
  return res.url || res.path || res.fileUrl || res.imageUrl || res.file_path || ''
}

/** 上传意见图片（multipart/form-data，字段名 file） */
export function uploadFeedbackImage(filePath) {
  return uploadFile({
    url: '/f/la/feedback/upload',
    filePath,
    name: 'file',
    loading: false,
    auth: true,
    showError: false,
  }).then(normalizeFeedbackImageUrl)
}

/** 提交意见反馈 */
export function submitFeedback(data) {
  const payload = {
    content: String(data?.content || '').trim(),
    contact: data?.contact ? String(data.contact) : '',
    imageUrls: Array.isArray(data?.imageUrls) ? data.imageUrls.filter(Boolean) : [],
  }
  return http.post('/f/la/feedback', payload, { loading: false, auth: true })
}

/** 站内消息列表（GET，page 从 0 开始） */
export function getMessageList(params) {
  return http.get('/f/la/messages', params, { loading: false, auth: true })
}

/** 申请注销 */
export function accountDeletion(data) {
  const payload = {
    smsCode: String(data?.code ?? data?.smsCode ?? '').trim(),
  }
  return http.post('/f/la/account/deletion/apply', payload, { loading: true, auth: true })
}

/** 手机号脱敏展示 +86 199******53 */
export function maskMobile(mobile) {
  const digits = String(mobile || '').replace(/\D/g, '')
  if (digits.length < 7) return digits || '—'
  return `${digits.slice(0, 3)}******${digits.slice(-2)}`
}


/** 消息项 → 页面展示 */
export function normalizeMessageItem(item) {
  const raw = item || {}
  const ts = raw.createTime ?? raw.createdAt ?? raw.time ?? raw.create_time
  let timeText = ''
  if (ts) {
    const n = Number(ts)
    const d = n > 1e12 ? dayjs(n) : dayjs.unix(n)
    timeText = d.isValid() ? d.format('YYYY/MM/DD HH:mm:ss') : String(ts)
  }
  return {
    id: raw.id ?? raw.messageId ?? '',
    title: raw.title ?? raw.subject ?? raw.content ?? '消息',
    deviceName: raw.deviceName ?? raw.device_name ?? raw.sn ?? raw.deviceSn ?? '',
    time: timeText,
    raw,
  }
}