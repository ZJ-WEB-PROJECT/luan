/**
 * 运行环境配置（H5 读 .env.production，微信小程序读 .env.mp-weixin）
 */
const envApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '')

/** 仅 H5 本地 dev 走 Vite 代理；小程序/App 等必须使用完整域名 */
const isH5Dev = import.meta.env.DEV && import.meta.env.UNI_PLATFORM === 'h5'

export const API_BASE_URL = isH5Dev ? '/api' : envApiBase

/** 静态文件域名（上传返回 /file/... 需拼接；默认取 VITE_API_PROXY_TARGET 或去掉 /api 的接口域名） */
const envFileBase = (
  import.meta.env.VITE_API_PROXY_TARGET ||
  import.meta.env.VITE_FILE_BASE_URL ||
  ''
).trim().replace(/\/$/, '')
export const FILE_BASE_URL = envFileBase || envApiBase.replace(/\/api$/i, '')

/** 相对路径转完整文件 URL */
export function toAbsoluteFileUrl(url) {
  const raw = String(url || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  if (!FILE_BASE_URL) return raw
  return `${FILE_BASE_URL}${raw.startsWith('/') ? raw : `/${raw}`}`
}

/** 接口模块名，对应 params.module */
export const API_MODULE = (import.meta.env.VITE_API_MODULE || 'usermgr').trim()

/** 语言/文件名标识，对应 params.lang */
export const API_LANG = (import.meta.env.VITE_API_LANG || 'zh').trim()

export const TOKEN_KEY = 'token'
