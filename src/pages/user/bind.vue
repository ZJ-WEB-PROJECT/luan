<template>
  <view class="page">
    <!-- <up-navbar title="绑定手机号" :bg-color="THEME_GREEN" title-color="#fff" left-icon="arrow-left" left-icon-color="#fff"
      :auto-back="true" :placeholder="true" :safe-area-inset-top="true"></up-navbar> -->

    <view class="form">
      <view class="form-field form-field--phone">
        <input
          v-model="mobile"
          class="form-field__input"
          type="number"
          maxlength="11"
          placeholder="手机号"
          placeholder-class="form-field__placeholder"
        />
        <!-- #ifdef MP-WEIXIN -->
        <button
          class="wx-phone-btn"
          open-type="getPhoneNumber"
          @getphonenumber="onGetWechatPhone"
        >
          微信获取
        </button>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <!-- <text class="wx-phone-link" @click="onGetWechatPhoneTip">微信获取</text> -->
        <!-- #endif -->
      </view>

      <view class="form-field form-field--code">
        <input v-model="code" class="form-field__input" type="number" maxlength="6" placeholder="验证码"
          placeholder-class="form-field__placeholder" />
        <text class="form-field__code-btn" :class="{ 'form-field__code-btn--disabled': codeCountdown > 0 }"
          @click="onSendCode">
          {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
        </text>
      </view>

      <view class="submit-btn" @click="onBind">
        <text>绑定手机号</text>
      </view>

      <text class="back-link" @click="goLogin">返回登录</text>
    </view>
  </view>
</template>

<script>
import { bindWechatPhone, getWechatPhoneNumber, sendCode, bindPhoneBySms } from '@/api/user'
import { setToken } from '@/common/request'
import { THEME_GREEN } from '@/common/theme.js'

export default {
  data() {
    return {
      THEME_GREEN,
      mobile: '',
      code: '',
      wechatPhoneCode: '',
      codeCountdown: 0,
      codeTimer: null,
      wechatAuthInfo: null,
      wechatLoginResult: null,
    }
  },
  onLoad() {
    this.wechatAuthInfo = uni.getStorageSync('wechatAuthInfo') || null
    this.wechatLoginResult = uni.getStorageSync('wechatLoginResult') || null
    console.log('this.wechatAuthInfo', this.wechatAuthInfo)
    if (!this.wechatAuthInfo?.code) {
      uni.$u.toast('微信授权信息已失效，请重新登录')
      setTimeout(() => this.goLogin(), 800)
    }
  },
  onUnload() {
    this.clearCodeTimer()
  },
  methods: {
    extractToken(payload) {
      if (!payload) return ''
      if (typeof payload === 'string') return payload
      return payload.token || payload.accessToken || payload.jwt || payload.Authorization || ''
    },
    clearCodeTimer() {
      if (this.codeTimer) {
        clearInterval(this.codeTimer)
        this.codeTimer = null
      }
    },
    refreshWxCode() {
      return new Promise((resolve) => {
        uni.login({
          provider: 'weixin',
          success: (res) => {
            if (res.code && this.wechatAuthInfo) {
              this.wechatAuthInfo.code = res.code
              uni.setStorageSync('wechatAuthInfo', this.wechatAuthInfo)
            }
            resolve(res.code || this.wechatAuthInfo?.code)
          },
          fail: () => resolve(this.wechatAuthInfo?.code),
        })
      })
    },
    onGetWechatPhoneTip() {
      uni.$u.toast('请在微信小程序中使用')
    },
    async onGetWechatPhone(e) {
      console.log('onGetWechatPhone', e)
      const detail = e?.detail || {}
      if (detail.errMsg && !/ok|success/i.test(detail.errMsg)) {
        uni.$u.toast('你已取消授权')
        return
      }
      const phoneCode = detail.code
      if (!phoneCode) {
        uni.$u.toast('获取手机号授权失败')
        return
      }

      try {
        const wxCode = await this.refreshWxCode()
        const data = await getWechatPhoneNumber({
          phoneCode,
          code: phoneCode,
          wxCode,
        })
        const mobile = String(data?.mobile || data?.phone || data?.phoneNumber || '')
        if (!/^1\d{10}$/.test(mobile)) {
          uni.$u.toast('未能解析手机号，请手动输入')
          return
        }
        this.mobile = mobile
        this.wechatPhoneCode = phoneCode
        uni.$u.toast('已获取微信绑定手机号')
      } catch (err) {
        console.error('[bind] get wechat phone failed:', err)
      }
    },
    async onSendCode() {
      if (this.codeCountdown > 0) return
      if (!/^1\d{10}$/.test(this.mobile)) {
        uni.$u.toast('请先获取或输入手机号')
        return
      }
      try {
        await sendCode({ mobile: this.mobile, scene: 'bind' })
        uni.$u.toast('验证码已发送')
        this.codeCountdown = 60
        this.codeTimer = setInterval(() => {
          this.codeCountdown--
          if (this.codeCountdown <= 0) this.clearCodeTimer()
        }, 1000)
      } catch (e) {
        console.error('[bind] send code failed:', e)
      }
    },
    async onBind() {
      if (!this.wechatAuthInfo?.code) {
        uni.$u.toast('微信授权信息已失效，请重新登录')
        return
      }
      if (!/^1\d{10}$/.test(this.mobile)) {
        uni.$u.toast('请先获取或输入手机号')
        return
      }
      if (!this.code.trim()) {
        uni.$u.toast('请输入验证码')
        return
      }
      try {
        const wxCode = await this.refreshWxCode()
        const payload = {
          mobile: this.mobile,
          smsCode: this.code,
          bindTicket: this.wechatLoginResult.bindTicket,
        }
        const data = await bindPhoneBySms(payload)
        const token = this.extractToken(data)
        if (token) {
          setToken(token)
        }
        uni.setStorageSync('userPhone', this.mobile)
        if (data?.member) {
          uni.setStorageSync('userInfo', data.member)
        }
        uni.removeStorageSync('wechatAuthInfo')
        uni.removeStorageSync('wechatLoginResult')
        uni.$u.toast('绑定成功')
        setTimeout(() => {
          uni.switchTab({
            url: '/pages/index/index',
            fail: () => {
              uni.reLaunch({ url: '/pages/index/index' })
            },
          })
        }, 400)
      } catch (e) {
        console.error('[bind] failed:', e)
      }
    },
    goLogin() {
      uni.redirectTo({ url: '/pages/user/login' })
    },
  },
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #fff;
}

.form {
  padding: 40rpx 32rpx;
}

.form-field {
  margin-bottom: 32rpx;
  position: relative;

  &--phone .form-field__input {
    padding-right: 180rpx;
  }

  &--code .form-field__input {
    padding-right: 200rpx;
  }
}

.form-field__input {
  width: 100%;
  height: 96rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 8rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #333;
  box-sizing: border-box;
}

.form-field__placeholder {
  color: #ccc;
  font-size: 30rpx;
}

.wx-phone-btn {
  position: absolute;
  right: 8rpx;
  top: 50%;
  transform: translateY(-50%);
  height: 64rpx;
  line-height: 64rpx;
  padding: 0 20rpx;
  margin: 0;
  background: #3dba6e;
  color: #fff;
  font-size: 24rpx;
  border-radius: 8rpx;
  border: none;

  &::after {
    border: none;
  }
}

.wx-phone-link {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 26rpx;
  color: #3dba6e;
}

.form-field__code-btn {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 28rpx;
  color: #3dba6e;

  &--disabled {
    color: #bbb;
  }
}

.submit-btn {
  margin-top: 48rpx;
  height: 88rpx;
  background: #3dba6e;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 32rpx;
    color: #fff;
    font-weight: 500;
  }
}

.back-link {
  display: block;
  margin-top: 40rpx;
  text-align: center;
  font-size: 28rpx;
  color: #3dba6e;
}
</style>
