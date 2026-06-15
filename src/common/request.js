import { API_BASE_URL, TOKEN_KEY } from './config'

function toast(title) {
  if (uni.$u?.toast) {
    uni.$u.toast(title)
  } else {
    uni.showToast({ title, icon: 'none' })
  }
}

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || ''
}

export function setToken(token) {
  if (token) {
    uni.setStorageSync(TOKEN_KEY, token)
  } else {
    uni.removeStorageSync(TOKEN_KEY)
  }
}

export function clearToken() {
  uni.removeStorageSync(TOKEN_KEY)
}

function buildUrl(url) {
  if (/^https?:\/\//i.test(url)) return url
  if (!API_BASE_URL) {
    console.warn('[request] 未配置 VITE_API_BASE_URL，请在对应 .env 文件中设置接口域名')
    return url.startsWith('/') ? url : `/${url}`
  }
  const path = url.startsWith('/') ? url : `/${url}`
  return `${API_BASE_URL}${path}`
}

function handleUnauthorized() {
  clearToken()
  const pages = getCurrentPages()
  const route = pages[pages.length - 1]?.route || ''
  if (route.includes('user/login')) return
  uni.reLaunch({ url: '/pages/user/login' })
}

/**
 * 统一请求
 * @param {Object} options
 * @param {string} options.url - 路径或完整 URL
 * @param {string} [options.method='GET']
 * @param {Object} [options.data]
 * @param {Object} [options.header]
 * @param {boolean} [options.loading=false] - 是否显示 loading
 * @param {boolean} [options.showError=true] - 失败是否 toast
 * @param {boolean} [options.auth=true] - 是否携带 token
 */
export function request(options = {}) {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    loading = false,
    showError = true,
    auth = true,
    ...rest
  } = options
  if (!url) {
    return Promise.reject(new Error('请求地址不能为空'))
  }

  if (loading) {
    uni.showLoading({ title: '加载中', mask: true })
  }

  const token = getToken()
  const reqHeader = {
    'Content-Type': 'application/json',
    ...header,
  }
  if (auth && token) {
    reqHeader.Authorization = reqHeader.Authorization || `${token}`
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: buildUrl(url),
      method,
      data,
      header: reqHeader,
      timeout: 30000,
      ...rest,
      success: (res) => {
        const { statusCode } = res
        const body = res.data

        if (statusCode === 401) {
          handleUnauthorized()
          const err = new Error('登录已过期，请重新登录')
          if (showError) toast(err.message)
          reject(err)
          return
        }

        if (statusCode < 200 || statusCode >= 300) {
          const err = new Error(body?.msg || body?.message || `请求失败(${statusCode})`)
          if (showError) toast(err.message)
          reject(err)
          return
        }

        if (body && typeof body === 'object' && ('code' in body || 'success' in body)) {
          const ok =
            body.code === 0 ||
            body.code === 200 ||
            body.success === true ||
            body.status === 'success'
          if (ok) {
            resolve(body.data !== undefined ? body.data : body)
            return
          }
          const err = new Error(body.msg || body.message || '请求失败')
          if (showError) toast(err.message)
          reject(err)
          return
        }

        resolve(body)
      },
      fail: (err) => {
        let msg = err?.errMsg || '网络异常，请稍后重试'
        if (/request:fail|cors|cross/i.test(msg)) {
          msg = import.meta.env.DEV
            ? '请求失败：开发环境请确认 Vite 代理 /api 已配置并已重启 dev:h5'
            : '请求失败：服务端未允许跨域访问，请配置 CORS 或使用同源代理'
        }
        if (showError) toast(msg)
        reject(new Error(msg))
      },
      complete: () => {
        if (loading) uni.hideLoading()
      },
    })
  })
}

/**
 * 上传文件（multipart/form-data）
 * @param {Object} options
 * @param {string} options.url
 * @param {string} options.filePath - 本地临时路径
 * @param {string} [options.name='file'] - 表单字段名
 * @param {Object} [options.formData]
 */
export function uploadFile(options = {}) {
  const {
    url,
    filePath,
    name = 'file',
    formData = {},
    loading = false,
    showError = true,
    auth = true,
  } = options

  if (!url || !filePath) {
    return Promise.reject(new Error('上传参数不完整'))
  }

  if (loading) {
    uni.showLoading({ title: '上传中', mask: true })
  }

  const token = getToken()
  const header = {}
  if (auth && token) {
    header.Authorization = `${token}`
  }

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: buildUrl(url),
      filePath,
      name,
      formData,
      header,
      success: (res) => {
        const { statusCode } = res
        let body = res.data
        if (typeof body === 'string') {
          try {
            body = JSON.parse(body)
          } catch {
            body = body.trim()
          }
        }

        if (statusCode === 401) {
          handleUnauthorized()
          const err = new Error('登录已过期，请重新登录')
          if (showError) toast(err.message)
          reject(err)
          return
        }

        if (statusCode < 200 || statusCode >= 300) {
          const err = new Error(body?.msg || body?.message || `上传失败(${statusCode})`)
          if (showError) toast(err.message)
          reject(err)
          return
        }

        if (body && typeof body === 'object' && ('code' in body || 'success' in body)) {
          const ok =
            body.code === 0 ||
            body.code === 200 ||
            body.success === true ||
            body.status === 'success'
          if (ok) {
            resolve(body.data !== undefined ? body.data : body)
            return
          }
          const err = new Error(body.msg || body.message || '上传失败')
          if (showError) toast(err.message)
          reject(err)
          return
        }

        resolve(body)
      },
      fail: (err) => {
        const msg = err?.errMsg || '上传失败，请稍后重试'
        if (showError) toast(msg)
        reject(new Error(msg))
      },
      complete: () => {
        if (loading) uni.hideLoading()
      },
    })
  })
}

export const http = {
  request,
  uploadFile,
  get(url, data, options) {
    return request({ url, method: 'GET', data, ...options })
  },
  post(url, data, options) {
    return request({ url, method: 'POST', data, ...options })
  },
  put(url, data, options) {
    return request({ url, method: 'PUT', data, ...options })
  },
  delete(url, data, options) {
    return request({ url, method: 'DELETE', data, ...options })
  },
}

export default http
