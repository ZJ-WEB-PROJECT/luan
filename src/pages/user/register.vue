<template>
  <view class="page">
    <up-navbar title="注册" :bg-color="THEME_GREEN" title-color="#fff" left-icon="arrow-left" left-icon-color="#fff"
      :auto-back="true" :placeholder="true" :safe-area-inset-top="true"></up-navbar>

    <view class="form">
      <view class="form-field">
        <input v-model="phone" class="form-field__input" type="number" maxlength="11" placeholder="手机号"
          placeholder-class="form-field__placeholder" />
      </view>

      <view class="form-field form-field--code">
        <input v-model="code" class="form-field__input" type="number" maxlength="6" placeholder="验证码"
          placeholder-class="form-field__placeholder" />
        <text class="form-field__code-btn" :class="{ 'form-field__code-btn--disabled': codeCountdown > 0 }"
          @click="onSendCode">
          {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
        </text>
      </view>

      <view class="form-field">
        <input v-model="password" class="form-field__input" type="password" password placeholder="密码"
          placeholder-class="form-field__placeholder" />
      </view>

      <view class="submit-btn" @click="onRegister">
        <text>注册</text>
      </view>

      <text class="back-link" @click="goLogin">返回登录</text>
    </view>
  </view>
</template>

<script>
import { register, sendRegisterCode } from '@/api/user'
import { THEME_GREEN } from '@/common/theme.js'

export default {
  data() {
    return {
      THEME_GREEN,
      phone: '',
      code: '',
      password: '',
      codeCountdown: 0,
      codeTimer: null,
    }
  },
  onUnload() {
    this.clearCodeTimer()
  },
  methods: {
    clearCodeTimer() {
      if (this.codeTimer) {
        clearInterval(this.codeTimer)
        this.codeTimer = null
      }
    },
    async onSendCode() {
      if (this.codeCountdown > 0) return
      if (!/^1\d{10}$/.test(this.phone)) {
        uni.$u.toast('请输入正确手机号')
        return
      }
      try {
        await sendRegisterCode(this.phone)
        uni.$u.toast('验证码已发送')
        this.codeCountdown = 60
        this.codeTimer = setInterval(() => {
          this.codeCountdown--
          if (this.codeCountdown <= 0) this.clearCodeTimer()
        }, 1000)
      } catch (e) {
        console.error('[register] send code failed:', e)
      }
    },
    async onRegister() {
      if (!/^1\d{10}$/.test(this.phone)) {
        uni.$u.toast('请输入正确手机号')
        return
      }
      if (!this.code.trim()) {
        uni.$u.toast('请输入验证码')
        return
      }
      if (!this.password.trim()) {
        uni.$u.toast('请输入密码')
        return
      }
      if (this.password.length < 6) {
        uni.$u.toast('密码至少6位')
        return
      }
      try {
        await register({
          phone: this.phone,
          code: this.code.trim(),
          password: this.password.trim(),
        })
        uni.$u.toast('注册成功')
        setTimeout(() => this.goLogin(), 400)
      } catch (e) {
        console.error('[register] failed:', e)
      }
    },
    goLogin() {
      uni.navigateBack({
        fail: () => {
          uni.redirectTo({ url: '/pages/user/login' })
        },
      })
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
