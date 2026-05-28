/**
 * 运行环境配置（H5 读 .env.production，微信小程序读 .env.mp-weixin）
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '')

/** 接口模块名，对应 params.module */
export const API_MODULE = (import.meta.env.VITE_API_MODULE || 'usermgr').trim()

/** 语言/文件名标识，对应 params.lang */
export const API_LANG = (import.meta.env.VITE_API_LANG || 'zh').trim()

export const TOKEN_KEY = 'token'
