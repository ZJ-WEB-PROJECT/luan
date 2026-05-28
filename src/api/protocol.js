import http from '@/common/request'

/**
 * 协议类型（与后端 type 字段保持一致）
 */
export const PROTOCOL_TYPE = {
  PRIVACY: 'privacy',
  SERVICE: 'service',
}

const NAV_TITLE_MAP = {
  [PROTOCOL_TYPE.PRIVACY]: '隐私政策',
  [PROTOCOL_TYPE.SERVICE]: '服务协议',
}

/** 演示用本地协议数据，接口未就绪时使用 */
function getMockProtocol(type) {
  if (type === PROTOCOL_TYPE.SERVICE) {
    return {
      type,
      navTitle: NAV_TITLE_MAP[type],
      title: 'OC 智联 APP 服务协议',
      updateTime: '2023年3月30日',
      html: '',
      sections: [
        {
          type: 'p',
          text: '欢迎使用 OC 智联 APP。本服务协议由厦门中宇恒科技有限公司（以下简称「我们」）与您订立。请您仔细阅读本协议，您使用本服务即视为同意本协议全部内容。',
        },
        {
          type: 'p',
          text: '更新日期：2023年3月30日。开发者联系电话：15559169837。',
        },
        { type: 'h2', text: '一、服务内容' },
        {
          type: 'p',
          text: '我们向您提供设备定位、轨迹查询、告警推送、远程设置等相关服务。具体功能以 APP 实际提供为准，我们有权根据业务需要调整服务内容。',
        },
        { type: 'h2', text: '二、用户义务' },
        {
          type: 'ol',
          items: [
            '您应保证注册信息真实、准确、完整，并妥善保管账号与密码；',
            '您不得利用本服务从事违法违规活动，不得干扰平台正常运营；',
            '您应合法使用定位设备，尊重他人隐私权及相关法律法规；',
            '因您自身原因导致的账号安全风险，由您自行承担责任。',
          ],
        },
        { type: 'h2', text: '三、费用说明' },
        {
          type: 'p',
          text: '部分增值服务、流量套餐等可能收取费用，收费标准以页面展示及订单信息为准。您完成支付后，相关权益按套餐规则生效。',
        },
        { type: 'h2', text: '四、免责声明' },
        {
          type: 'p',
          text: '因网络、运营商、设备故障或不可抗力导致的服务中断、定位偏差等，我们将在合理范围内协助处理，但不承担超出法律规定的责任。',
        },
        { type: 'h2', text: '五、协议变更' },
        {
          type: 'p',
          text: '我们有权根据需要修订本协议，修订后将通过 APP 公示。若您继续使用服务，即视为接受修订后的协议。',
        },
        { type: 'h2', text: '六、联系我们' },
        {
          type: 'p',
          text: '如您对本服务协议有任何疑问，请通过开发者电话 15559169837 与我们联系。',
        },
      ],
    }
  }

  return {
    type: PROTOCOL_TYPE.PRIVACY,
    navTitle: NAV_TITLE_MAP[PROTOCOL_TYPE.PRIVACY],
    title: 'OC 智联 APP 隐私政策',
    updateTime: '2023年3月30日',
    html: '',
    sections: [
      {
        type: 'p',
        text: '本隐私政策适用于厦门中宇恒科技有限公司（以下简称「我们」）通过 OC 智联 APP 向您提供的产品与服务。',
      },
      {
        type: 'p',
        text: '我们非常重视您的隐私保护。在使用我们的服务前，请您仔细阅读并充分理解本政策。当您使用或继续使用我们的服务，即表示您同意我们按照本隐私政策收集、使用、储存和分享您的相关信息。',
      },
      { type: 'h2', text: '一、适用范围' },
      {
        type: 'p',
        text: '我们的产品基于 DCloud uni-app（5+ App/Wap2App）开发，应用运行期间需要收集您的设备唯一识别码（IMEI/android ID/DEVICE_ID/IDFA、SIM 卡 IMSI 信息、OAID、MAC 地址）以提供统计分析服务，并通过应用启动数据及异常错误日志分析改进性能和用户体验。',
      },
      {
        type: 'ol',
        items: [
          '在您注册 OC 智联帐号时，您根据要求提供的个人注册信息；',
          '在您使用 OC 智联服务，或访问平台网页时，自动接收并记录您浏览器和计算机上的信息，包括但不限于 IP 地址、浏览器的类型、使用的语言、访问日期和时间、软硬件特征信息及网页记录等数据；',
          '通过合法途径从商业伙伴处取得的用户个人数据；',
          '为识别用户身份，使用帐号标识信息区分不同用户身份。',
          '我们可能收集由第三方服务提供商提供的与您相关的信息；',
          '我们可能收集设备或 SIM 卡相关信息，包括 IMEI/OAID 号码、MAC 地址、序列号、系统版本和类型、系统语言、设备厂商和型号、网络运营商、连接类型等；',
          '当您使用设备发现、绑定、管理等智能设备相关功能时，我们可能收集 Wi-Fi 信息、位置信息、登录帐号信息、手机相关信息、智能设备相关信息，以及 OC 智联帐号与智能设备之间的关联信息。',
        ],
      },
      { type: 'h2', text: '二、信息使用' },
      {
        type: 'p',
        text: '我们可能将收集的信息用于向您提供服务、保障服务安全、改进产品体验、进行数据统计与分析，以及在获得您授权的情况下用于其他用途。我们不会向无关第三方出售您的个人信息。',
      },
      { type: 'h2', text: '三、信息安全' },
      {
        type: 'p',
        text: '我们采取合理可行的安全防护措施保护您的信息，防止信息遭到未经授权的访问、公开披露、使用、修改、损坏或丢失。',
      },
      { type: 'h2', text: '四、您的权利' },
      {
        type: 'p',
        text: '您有权查询、更正或删除您的个人信息，也可通过本政策公布的联系方式与我们联系，我们将在合理期限内予以答复。',
      },
      { type: 'h2', text: '五、联系我们' },
      {
        type: 'p',
        text: '如您对本隐私政策有任何疑问，请通过开发者电话 15559169837 与我们联系。',
      },
    ],
  }
}

/**
 * 获取协议内容
 * @param {string} type - privacy | service
 * @returns {Promise<{ navTitle, title, updateTime, html, sections }>}
 */
export function fetchProtocol(type) {
  const protocolType = type === PROTOCOL_TYPE.SERVICE ? PROTOCOL_TYPE.SERVICE : PROTOCOL_TYPE.PRIVACY

  return http
    .get('/api/protocol', { type: protocolType }, { showError: false, auth: false })
    .then((data) => normalizeProtocol(data))
    .catch(() => getMockProtocol(protocolType))
}

/**
 * 规范化后端返回数据（接入接口后使用）
 */
export function normalizeProtocol(data) {
  return {
    type: data.type || PROTOCOL_TYPE.PRIVACY,
    navTitle: data.navTitle || NAV_TITLE_MAP[data.type] || '协议',
    title: data.title || '',
    updateTime: data.updateTime || '',
    html: data.html || data.content || '',
    sections: Array.isArray(data.sections) ? data.sections : [],
  }
}
