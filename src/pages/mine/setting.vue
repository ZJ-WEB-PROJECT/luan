<template>
  <view class="page">
    <up-navbar title="设置" :bg-color="THEME_GREEN" title-color="#fff" left-icon="arrow-left" left-icon-color="#fff"
      :auto-back="true" :placeholder="true" :safe-area-inset-top="true"></up-navbar>

    <scroll-view class="content" scroll-y>
      <view class="menu-group">
        <view class="menu-item" @click="onNavigate('account')">
          <text class="menu-item__label">账号与安全</text>
          <up-icon name="arrow-right" color="#ccc" size="16"></up-icon>
        </view>
        <!-- <view class="menu-item menu-item--last" @click="onNavigate('language')">
          <text class="menu-item__label">多语言</text>
          <up-icon name="arrow-right" color="#ccc" size="16"></up-icon>
        </view> -->
      </view>

      <view class="menu-gap"></view>

      <view class="menu-group">
        <view class="menu-item">
          <text class="menu-item__label">自动检测更新</text>
          <up-switch v-model="autoUpdate" :active-color="THEME_GREEN" size="22"
            @change="onAutoUpdateChange"></up-switch>
        </view>
        <view class="menu-item menu-item--multi menu-item--last">
          <view class="menu-item__main">
            <text class="menu-item__label">个性化推荐</text>
            <text class="menu-item__desc">
              关闭后仅使用基本功能，无法看到个性化推荐内容
            </text>
          </view>
          <up-switch v-model="personalized" :active-color="THEME_GREEN" size="22"
            @change="onPersonalizedChange"></up-switch>
        </view>
      </view>

      <view class="menu-gap"></view>

      <view class="menu-group">
        <view class="menu-item" @click="onNavigate('privacy')">
          <text class="menu-item__label">隐私政策</text>
          <up-icon name="arrow-right" color="#ccc" size="16"></up-icon>
        </view>
        <view class="menu-item" @click="onNavigate('service')">
          <text class="menu-item__label">服务协议</text>
          <up-icon name="arrow-right" color="#ccc" size="16"></up-icon>
        </view>
        <view class="menu-item menu-item--last" @click="onNavigate('about')">
          <text class="menu-item__label">关于</text>
          <up-icon name="arrow-right" color="#ccc" size="16"></up-icon>
        </view>
      </view>
    </scroll-view>

    <view class="logout-wrap">
      <view class="logout-btn" @click="onLogout">
        <text>退出登录</text>
      </view>
    </view>
  </view>
</template>

<script>
import { THEME_GREEN } from '@/common/theme.js'

const SETTINGS_KEY = 'app_settings'

export default {
  data() {
    return {
      THEME_GREEN,
      autoUpdate: true,
      personalized: false,
    }
  },
  onLoad() {
    this.loadSettings()
  },
  methods: {
    loadSettings() {
      const saved = uni.getStorageSync(SETTINGS_KEY)
      if (!saved || typeof saved !== 'object') return
      if (saved.autoUpdate !== undefined) this.autoUpdate = saved.autoUpdate
      if (saved.personalized !== undefined) this.personalized = saved.personalized
    },
    saveSettings() {
      uni.setStorageSync(SETTINGS_KEY, {
        autoUpdate: this.autoUpdate,
        personalized: this.personalized,
      })
    },
    onAutoUpdateChange() {
      this.saveSettings()
    },
    onPersonalizedChange() {
      this.saveSettings()
    },
    onNavigate(key) {
      if (key === 'account') {
        uni.navigateTo({ url: '/pages/mine/account' })
        return
      }
      if (key === 'privacy' || key === 'service' || key === 'about') {
        uni.navigateTo({ url: `/pages/mine/privacy?type=${key}` })
        return
      }
      const labels = {
        language: '多语言',
      }
      uni.$u.toast(labels[key] || '')
    },
    onLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        confirmColor: '#e74c3c',
        success: (res) => {
          if (res.confirm) {
            // TODO: 对接退出登录接口，清除 token
            uni.clearStorageSync()
            uni.$u.toast('已退出登录')
            setTimeout(() => {
              uni.navigateTo({ url: '/pages/user/login' })
              // uni.switchTab({ url: '/pages/index/inded' })
            }, 400)
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
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
}

.content {
  flex: 1;
  height: 0;
}

.menu-group {
  background: #fff;
}

.menu-gap {
  height: 20rpx;
  background: #f5f5f5;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  gap: 24rpx;
}

.menu-item--last {
  border-bottom: none;
}

.menu-item--multi {
  align-items: flex-start;
}

.menu-item__main {
  flex: 1;
  min-width: 0;
}

.menu-item__label {
  font-size: 30rpx;
  color: #333;
}

.menu-item__desc {
  font-size: 24rpx;
  color: #999;
  line-height: 1.5;
  display: block;
  margin-top: 12rpx;
}

.logout-wrap {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 32rpx 48rpx calc(32rpx + env(safe-area-inset-bottom));
  background: #f5f5f5;
}

.logout-btn {
  height: 88rpx;
  background: #e74c3c;
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
