<template>
  <view class="page">
    <up-navbar
      title="修改密码"
      :bg-color="THEME_GREEN"
      title-color="#fff"
      left-icon="arrow-left"
      left-icon-color="#fff"
      :auto-back="true"
      :placeholder="true"
      :safe-area-inset-top="true"
    ></up-navbar>

    <view class="form">
      <view class="form-field">
        <input
          v-model="oldPassword"
          class="form-field__input"
          type="password"
          password
          placeholder="旧密码"
          placeholder-class="form-field__placeholder"
        />
      </view>
      <view class="form-field">
        <input
          v-model="newPassword"
          class="form-field__input"
          type="password"
          password
          placeholder="新密码"
          placeholder-class="form-field__placeholder"
        />
      </view>
      <view class="form-field">
        <input
          v-model="confirmPassword"
          class="form-field__input"
          type="password"
          password
          placeholder="确认新密码"
          placeholder-class="form-field__placeholder"
        />
      </view>

      <view class="save-btn" @click="onSave">
        <text>保存</text>
      </view>
    </view>
  </view>
</template>

<script>
import { THEME_GREEN } from '@/common/theme.js'
import { changePassword } from '@/api/user'
export default {
  data() {
    return {
      THEME_GREEN,
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  },
  methods: {
    async onSave() {
      if (!this.oldPassword.trim()) {
        uni.$u.toast('请输入旧密码')
        return
      }
      if (!this.newPassword.trim()) {
        uni.$u.toast('请输入新密码')
        return
      }
      if (this.newPassword.length < 6) {
        uni.$u.toast('新密码至少6位')
        return
      }
      if (this.newPassword !== this.confirmPassword) {
        uni.$u.toast('两次新密码不一致')
        return
      }
      const res = await changePassword({
        oldPassword: this.oldPassword,
        newPassword: this.newPassword,
      })
      uni.$u.toast('密码修改成功')
      setTimeout(() => uni.navigateBack(), 400)
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

.save-btn {
  margin-top: 48rpx;
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
