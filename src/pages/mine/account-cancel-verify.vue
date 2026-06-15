<template>
  <view class="page">
    <up-navbar title="账号注销" :bg-color="THEME_GREEN" title-color="#fff" left-icon="arrow-left" left-icon-color="#fff"
      :auto-back="true" :placeholder="true" :safe-area-inset-top="true" />

    <view class="form">
      <text class="phone-label">手机号：+86 {{ maskedMobile }}</text>

      <view class="code-row">
        <input v-model="code" class="code-row__input" type="number" maxlength="6" placeholder="验证码"
          placeholder-class="code-row__placeholder" />
        <view class="code-row__btn" :class="{ 'code-row__btn--disabled': codeCountdown > 0 }" @click="onSendCode">
          <text>{{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}</text>
        </view>
      </view>

      <view class="verify-btn" @click="onVerify">
        <text>验证</text>
      </view>
    </view>
  </view>
</template>

<script>
import { THEME_GREEN } from '@/common/theme.js'
import {
  getUserInfo,
  sendCode,
  accountDeletion,
  maskMobile,
} from '@/api/user'
import { clearToken } from '@/common/request'

export default {
  data() {
    return {
      THEME_GREEN,
      mobile: '',
      code: '',
      codeCountdown: 0,
      codeTimer: null,
    }
  },
  computed: {
    maskedMobile() {
      return maskMobile(this.mobile)
    },
  },
  onLoad() {
    this.loadMobile()
  },
  onUnload() {
    this.clearCodeTimer()
  },
  methods: {
    loadMobile() {
      const cached = uni.getStorageSync('userInfo') || {}
      const mobile = cached.mobile || cached.phone || ''
      if (mobile) {
        this.mobile = String(mobile)
        return
      }
      getUserInfo()
        .then((res) => {
          this.mobile = String(res?.mobile || res?.phone || '')
          if (res) uni.setStorageSync('userInfo', res)
        })
        .catch(() => { })
    },
    clearCodeTimer() {
      if (this.codeTimer) {
        clearInterval(this.codeTimer)
        this.codeTimer = null
      }
    },
    async onSendCode() {
      if (this.codeCountdown > 0) return
      if (!/^1\d{10}$/.test(this.mobile)) {
        uni.$u?.toast?.('未获取到绑定手机号')
        return
      }
      try {
        await sendCode({ mobile: this.mobile, scene: 'delete_account' })
        uni.$u?.toast?.('验证码已发送')
        this.codeCountdown = 60
        this.codeTimer = setInterval(() => {
          this.codeCountdown--
          if (this.codeCountdown <= 0) this.clearCodeTimer()
        }, 1000)
      } catch (e) {
        console.error('[account-cancel-verify] send code failed:', e)
      }
    },
    async onVerify() {
      if (!this.code.trim()) {
        uni.$u?.toast?.('请输入验证码')
        return
      }
      try {
        await accountDeletion({ code: this.code.trim() })
        clearToken()
        uni.removeStorageSync('userInfo')
        uni.$u?.toast?.('注销申请已提交')
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/mine/mine' })
        }, 500)
      } catch (e) {
        console.error('[account-cancel-verify] apply failed:', e)
      }
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
  padding: 48rpx 40rpx;
}

.phone-label {
  display: block;
  font-size: 30rpx;
  color: #333;
  margin-bottom: 40rpx;
}

.code-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 48rpx;
}

.code-row__input {
  flex: 1;
  height: 88rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 8rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #333;
  box-sizing: border-box;
}

.code-row__placeholder {
  color: #ccc;
  font-size: 30rpx;
}

.code-row__btn {
  flex-shrink: 0;
  height: 88rpx;
  padding: 0 28rpx;
  background: #3dba6e;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 26rpx;
    color: #fff;
    white-space: nowrap;
  }

  &--disabled {
    background: #b8dfc8;
  }
}

.verify-btn {
  height: 88rpx;
  background: #3dba6e;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 32rpx;
    color: #fff;
    font-weight: 500;
  }
}
</style>
