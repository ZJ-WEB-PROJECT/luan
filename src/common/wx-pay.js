/** 解析后端返回的微信支付参数（兼容多种字段命名） */
function normalizeWxPayParams(data) {
  const raw =
    data?.payParams ||
    data?.wxPay ||
    data?.wxPayParams ||
    data?.payment ||
    data?.payInfo ||
    data

  if (!raw || typeof raw !== 'object') {
    throw new Error('支付参数无效')
  }

  const timeStamp = String(raw.timeStamp ?? raw.timestamp ?? raw.time_stamp ?? '')
  const nonceStr = raw.nonceStr ?? raw.nonce_str ?? ''
  let pkg = raw.package ?? raw.packageValue ?? raw.package_value ?? ''
  const prepayId = raw.prepayId ?? raw.prepay_id ?? ''
  if (!pkg && prepayId) {
    pkg = String(prepayId).startsWith('prepay_id=') ? prepayId : `prepay_id=${prepayId}`
  }
  const signType = raw.signType ?? raw.sign_type ?? 'RSA'
  const paySign = raw.paySign ?? raw.pay_sign ?? ''
  const appId = raw.appId ?? raw.appid ?? ''

  if (!timeStamp || !nonceStr || !pkg || !paySign) {
    throw new Error('支付参数不完整')
  }

  return { timeStamp, nonceStr, package: pkg, signType, paySign, appId }
}

/**
 * 调起微信小程序支付
 * @param {Object} data - createOrder 接口返回的支付参数
 */
export function requestWechatPay(data) {
  console.log(data)
  const params = normalizeWxPayParams(data)
  console.log(params)
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    const payOptions = {
      provider: 'wxpay',
      timeStamp: params.timeStamp,
      nonceStr: params.nonceStr,
      package: params.package,
      signType: params.signType,
      paySign: params.paySign,
      success: resolve,
      fail: (err) => {
        const msg = err?.errMsg || ''
        if (/cancel/i.test(msg)) {
          reject(new Error('已取消支付'))
          return
        }
        reject(new Error(msg || '支付失败'))
      },
    }
    if (params.appId) {
      payOptions.appId = params.appId
    }
    uni.requestPayment(payOptions)
    // #endif

    // #ifndef MP-WEIXIN
    const tip = '请在微信小程序中完成支付'
    if (uni.$u?.toast) {
      uni.$u.toast(tip)
    } else {
      uni.showToast({ title: tip, icon: 'none' })
    }
    reject(new Error(tip))
    // #endif
  })
}
