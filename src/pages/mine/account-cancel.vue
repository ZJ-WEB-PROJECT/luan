<template>
  <view class="page">
    <up-navbar
      title="账号注销"
      :bg-color="THEME_GREEN"
      title-color="#fff"
      left-icon="arrow-left"
      left-icon-color="#fff"
      :auto-back="true"
      :placeholder="true"
      :safe-area-inset-top="true"
    ></up-navbar>

    <scroll-view class="content" scroll-y>
      <view class="notice">
        <text class="notice__title">温馨提示</text>
        <text class="notice__subtitle">账号一旦注销，将无法恢复</text>

        <view class="notice-list">
          <view v-for="(item, index) in tips" :key="index" class="notice-item">
            <view class="notice-item__dot"></view>
            <text class="notice-item__text">{{ item }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="footer-bar">
      <view class="footer-bar__btn" @click="onContinue">
        <text>继续注销</text>
      </view>
    </view>
  </view>
</template>

<script>
import { THEME_GREEN } from '@/common/theme.js'
export default {
  data() {
    return {
      THEME_GREEN,
      tips: [
        '您仅可注销您本人的账号',
        '注销后，您将无法继续登录、使用该账号，使用该账号登录的多项产品/服务亦无法继续使用',
        '注销后，该账号下的内容、信息、数据、记录等将全部删除，且无法恢复',
        '注销后，账号下的全部权益均将清除，且无法恢复',
        '注销后，该账号绑定的手机号、设备号，您可使用前述信息或其他信息注册成为新用户',
        '注销需要一定周期，请耐心等待',
      ],
    }
  },
  methods: {
    onContinue() {
      uni.showModal({
        title: '确认注销',
        content: '注销后账号数据将无法恢复，确定继续吗？',
        confirmColor: '#3dba6e',
        confirmText: '继续注销',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({ url: '/pages/mine/account-cancel-verify' })
          }
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
  display: flex;
  flex-direction: column;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
}

.content {
  flex: 1;
  height: 0;
}

.notice {
  padding: 48rpx 40rpx;
}

.notice__title {
  display: block;
  text-align: center;
  font-size: 36rpx;
  font-weight: 700;
  color: #222;
  margin-bottom: 24rpx;
}

.notice__subtitle {
  display: block;
  text-align: center;
  font-size: 30rpx;
  color: #333;
  margin-bottom: 48rpx;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.notice-item__dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #3dba6e;
  margin-top: 14rpx;
  flex-shrink: 0;
}

.notice-item__text {
  flex: 1;
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 48rpx calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
}

.footer-bar__btn {
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
