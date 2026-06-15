/**
 * 业务接口统一在此目录按模块拆分，示例见 user.js、protocol.js
 */
export { default as http, request, getToken, setToken, clearToken } from '@/common/request'
export { API_BASE_URL } from '@/common/config'
