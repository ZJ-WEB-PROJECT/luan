<template>
  <view class="page">
    <up-navbar
      title="我的"
      :bg-color="THEME_GREEN"
      title-color="#fff"
      left-icon=""
      :auto-back="false"
      :placeholder="true"
      :safe-area-inset-top="true"
    ></up-navbar>

    <scroll-view class="mine-scroll" scroll-y>
      <!-- 用户信息 -->
      <view class="user-card">
        <view class="user-avatar">
          <up-icon name="account-fill" color="#ccc" size="48"></up-icon>
        </view>
        <view class="user-info">
          <text class="user-info__phone">{{ user.mobile }}</text>
          <!-- <text class="user-info__sub">{{ user.phone }}</text> -->
        </view>
      </view>

      <!-- 我的订单 -->
      <view class="section-card">
        <text class="section-card__title">我的订单</text>
        <view class="order-grid">
          <view class="order-item" @click="onOrder">
            <view class="order-item__icon">
              <text class="order-item__char">充</text>
            </view>
            <text class="order-item__label">充值订单</text>
          </view>
        </view>
      </view>

      <!-- 常用工具 -->
      <view class="section-card">
        <text class="section-card__title">常用工具</text>
        <view class="tools-grid">
          <view
            v-for="tool in tools"
            :key="tool.key"
            class="tools-item"
            @click="onTool(tool)"
          >
            <up-icon :name="tool.icon" color="#333" size="40"></up-icon>
            <text class="tools-item__label">{{ tool.label }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

  </view>
</template>

<script>
import { THEME_GREEN } from '@/common/theme.js'
import { getUserInfo } from '@/api/user'
import {
  DEVICE_API_MODE,
  DEVICE_API_MODE_EVENT,
  getDeviceApiMode,
  getDeviceApiModeLabel,
  setDeviceApiMode,
} from '@/common/device-api-mode'

export default {
  data() {
    return {
      THEME_GREEN,
      deviceApiMode: getDeviceApiMode(),
      user: {},
    }
  },
  computed: {
    tools() {
      const isJt808 = this.deviceApiMode === DEVICE_API_MODE.JT808
      return [
        { key: 'apiMode', label: isJt808 ? '切换旧版' : '切换新版', icon: 'reload' },
        { key: 'service', label: '联系客服', icon: 'server-fill' },
        { key: 'feedback', label: '意见与建议', icon: 'email-fill' },
        { key: 'setting', label: '设置', icon: 'setting-fill' },
      ]
    },
  },
  onShow() {
    this.user = uni.getStorageSync('userInfo')
    this.deviceApiMode = getDeviceApiMode()
    this.loadUserInfo()
  },
  onLoad() {
    uni.$on(DEVICE_API_MODE_EVENT, this.onDeviceApiModeChanged)
  },
  onUnload() {
    uni.$off(DEVICE_API_MODE_EVENT, this.onDeviceApiModeChanged)
  },
  methods: {
    onDeviceApiModeChanged(mode) {
      this.deviceApiMode = mode
    },
    onToggleApiMode() {
      const next = this.deviceApiMode === DEVICE_API_MODE.JT808
        ? DEVICE_API_MODE.IOTDOC
        : DEVICE_API_MODE.JT808
      uni.showModal({
        title: '切换接口版本',
        content: `确认切换到${getDeviceApiModeLabel(next)}？切换后将清空当前选中设备。`,
        confirmColor: '#3dba6e',
        success: (res) => {
          if (!res.confirm) return
          setDeviceApiMode(next)
          this.deviceApiMode = next
          uni.removeStorageSync('currentDevice')
          uni.$u.toast(`已切换为${getDeviceApiModeLabel(next)}`)
        },
      })
    },
    loadUserInfo() {
      getUserInfo().then(res => {
        this.user = res
        uni.setStorageSync('userInfo', res)
      })
    },
    onOrder() {
      uni.navigateTo({
        url: '/pages/order/recharge-order',
      })
    },
    onTool(tool) {
      if (tool.key === 'apiMode') {
        this.onToggleApiMode()
        return
      }
      if (tool.key === 'setting') {
        uni.navigateTo({ url: '/pages/mine/setting' })
        return
      }
      if (tool.key === 'feedback') {
        uni.navigateTo({ url: '/pages/mine/feedback' })
        return
      }
      uni.$u.toast(tool.label)
    },
  },
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f4f4f4;
  display: flex;
  flex-direction: column;
}

.mine-scroll {
  flex: 1;
  height: 0;
  padding: 24rpx;
  box-sizing: border-box;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 28rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 36rpx 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-info__phone {
  font-size: 36rpx;
  font-weight: 600;
  color: #222;
}

.user-info__sub {
  font-size: 28rpx;
  color: #999;
}

.section-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.section-card__title {
  font-size: 32rpx;
  font-weight: 600;
  color: #222;
  display: block;
  margin-bottom: 28rpx;
}

.order-grid {
  display: flex;
  justify-content: flex-start;
}

.order-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  width: 25%;
}

.order-item__icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  border: 4rpx solid #222;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-item__char {
  font-size: 36rpx;
  font-weight: 700;
  color: #222;
}

.order-item__label {
  font-size: 26rpx;
  color: #333;
}

.tools-grid {
  display: flex;
  justify-content: space-around;
}

.tools-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  flex: 1;
}

.tools-item__label {
  font-size: 26rpx;
  color: #333;
}
</style>
