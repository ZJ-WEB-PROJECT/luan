import http from '@/common/request'

/** 手机号密码登录 */
export function loginByPassword(data) {
  return http.post('/Login', data, { loading: true, auth: false })
}

/** 退出登录 */
export function logout() {
  return http.post('/LoginOut', {}, { loading: true })
}

/** 注册 */
export function register(data) {
  return http.post('/Register', data, { loading: true, auth: false })
}

/** 发送注册验证码 */
export function sendRegisterCode(phone) {
  return http.post('/SendCode', { phone }, { loading: true, auth: false })
}

/** 微信授权登录（小程序） */
export function loginByWechat(data) {
  return http.post('/WxLogin', data, { loading: true, auth: false })
}