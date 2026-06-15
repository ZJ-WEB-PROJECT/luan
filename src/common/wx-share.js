/**
 * 定位分享：解析 create 接口、生成路径、调起微信分享
 */

const WX_APPID = (import.meta.env.VITE_WX_APPID || 'wx91430f07c061c0ef').trim()
const WX_GH_ID = (import.meta.env.VITE_WX_GH_ID || '').trim()

/** 解析 createShareLink 返回 */
export function normalizeShareLinkResult(data) {
  const raw = data?.data ?? data ?? {}
  return {
    shareToken: String(raw.shareToken ?? raw.share_token ?? '').trim(),
    expireAt: raw.expireAt ?? raw.expire_at ?? '',
  }
}

/** 访客打开的小程序页面路径（带 /，用于 navigateTo） */
export function buildSharePagePath(shareToken) {
  const token = encodeURIComponent(String(shareToken || '').trim())
  return `/pages/share/view?shareToken=${token}`
}

/** H5 外链（App 分享网页、低版本微信兜底） */
export function buildShareWebUrl(shareToken) {
  const token = encodeURIComponent(String(shareToken || '').trim())
  const base = (
    import.meta.env.VITE_H5_BASE_URL ||
    import.meta.env.VITE_API_PROXY_TARGET ||
    ''
  )
    .trim()
    .replace(/\/$/, '')
  if (!base) {
    return buildSharePagePath(shareToken)
  }
  return `${base}/#/pages/share/view?shareToken=${token}`
}

/**
 * 组装分享展示信息（存到页面 sharePending，供 onShareAppMessage / uni.share 使用）
 */
export function buildSharePayload({
  shareToken,
  deviceName = '',
  address = '',
  expireAt = '',
  imageUrl = '',
}) {
  const name = deviceName || '设备'
  const title = `${name}的定位分享`
  let summary = address || '点击查看实时定位'
  if (expireAt) {
    summary = `${summary}（有效期至 ${formatExpireAt(expireAt)}）`
  }
  return {
    shareToken,
    title,
    summary,
    path: buildSharePagePath(shareToken),
    href: buildShareWebUrl(shareToken),
    expireAt,
    imageUrl,
    wxAppId: WX_APPID,
    wxGhId: WX_GH_ID,
  }
}

function formatExpireAt(expireAt) {
  const raw = expireAt
  if (!raw) return ''
  const n = Number(raw)
  const d = n > 1e12 ? new Date(n) : Number.isFinite(n) && n > 0 ? new Date(n * 1000) : new Date(raw)
  if (Number.isNaN(d.getTime())) return String(raw)
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 小程序 path（onShareAppMessage 不要前导 /） */
export function getMpShareAppMessageConfig(payload) {
  if (!payload?.shareToken) return null
  const path = String(payload.path || buildSharePagePath(payload.shareToken)).replace(/^\//, '')
  const cfg = {
    title: payload.title || '定位分享',
    path,
  }
  if (payload.imageUrl) cfg.imageUrl = payload.imageUrl
  return cfg
}

export function getMpShareTimelineConfig(payload) {
  const msg = getMpShareAppMessageConfig(payload)
  if (!msg) return null
  return {
    title: msg.title,
    query: msg.path.includes('?') ? msg.path.split('?')[1] : `shareToken=${encodeURIComponent(payload.shareToken)}`,
  }
}

/** 微信小程序：显示转发菜单 */
export function prepareMpShareMenu() {
  // #ifdef MP-WEIXIN
  uni.showShareMenu({
    withShareTicket: false,
    menus: ['shareAppMessage', 'shareTimeline'],
  })
  // #endif
}

/**
 * App 分享到微信好友（优先小程序卡片，未配置 gh_id 时分享网页链接）
 */
export function shareLocationToWechatSession(payload) {
  if (!payload?.shareToken) {
    return Promise.reject(new Error('分享参数无效'))
  }

  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    const miniPath = String(payload.path || buildSharePagePath(payload.shareToken)).replace(/^\//, '')
    const useMiniProgram = Boolean(payload.wxGhId || WX_GH_ID)
    const shareOptions = {
      provider: 'weixin',
      scene: 'WXSceneSession',
      type: useMiniProgram ? 5 : 0,
      title: payload.title,
      summary: payload.summary,
      href: payload.href,
      success: resolve,
      fail: (err) => {
        const msg = err?.errMsg || err?.message || '分享失败'
        if (/cancel/i.test(msg)) {
          reject(new Error('已取消分享'))
          return
        }
        reject(new Error(msg))
      },
    }
    if (payload.imageUrl) {
      shareOptions.imageUrl = payload.imageUrl
    }
    if (useMiniProgram) {
      shareOptions.miniProgram = {
        id: payload.wxGhId || WX_GH_ID,
        path: miniPath,
        type: 0,
        webUrl: payload.href,
      }
    }
    uni.share(shareOptions)
    // #endif

    // #ifndef APP-PLUS
    reject(new Error('当前环境不支持微信分享'))
    // #endif
  })
}

/** 非微信环境：复制分享路径或链接 */
export function copyShareLink(payload) {
  const text = payload?.href || payload?.path || ''
  if (!text) return Promise.reject(new Error('无可复制内容'))
  return new Promise((resolve, reject) => {
    uni.setClipboardData({
      data: text,
      success: resolve,
      fail: reject,
    })
  })
}
