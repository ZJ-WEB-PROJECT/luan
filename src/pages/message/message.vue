<template>
  <view class="page">
    <up-navbar title="消息" :bg-color="THEME_GREEN" title-color="#fff" left-icon="" :auto-back="false" :placeholder="true"
      :safe-area-inset-top="true">
      <template #left>
        <view class="nav-clear" @click="onClear">
          <up-icon name="trash" color="#fff" size="22"></up-icon>
        </view>
      </template>
    </up-navbar>

    <scroll-view class="msg-list" scroll-y>
      <view v-for="(item, index) in messages" :key="index" class="msg-card" @click="onMsgClick(item)">
        <view class="msg-card__icon">
          <up-icon name="bell-fill" color="#f1c40f" size="36"></up-icon>
        </view>
        <view class="msg-card__content">
          <view class="msg-card__head">
            <text class="msg-card__title">{{ item.alarm_name }}</text>
            <text class="msg-card__time">{{ $u.timeFormat(item.time, 'yyyy-mm-dd hh:MM:ss') }}</text>
          </view>
          <text class="msg-card__desc">设备名称：{{ item.imei }}</text>
        </view>
      </view>
      <!-- <button class="wx-phone-btn" open-type="getPhoneNumber" @getphonenumber="onGetWechatPhone">
        微信获取
      </button> -->
      <view class="msg-footer">
        <up-divider text="没有更多了" text-color="#ccc" line-color="#e0e0e0"></up-divider>
      </view>
    </scroll-view>

  </view>
</template>

<script>
import { THEME_GREEN } from '@/common/theme.js'
import { getAlarmList } from '@/api/user'
export default {
  data() {
    return {
      THEME_GREEN,
      messages: [],
    }
  },
  onLoad() {
    this.loadAlarmList()
  },
  methods: {
    async loadAlarmList() {
      const params = {
        sn: uni.getStorageSync('currentDevice').sn,
        limitSize: 10,
      }
      const res = await getAlarmList(params)
      this.messages = res.items
    },
    onClear() {
      uni.showModal({
        title: '提示',
        content: '确定清空全部消息吗？',
        success: (res) => {
          if (res.confirm) {
            this.messages = []
            uni.$u.toast('已清空')
          }
        },
      })
    },
    onMsgClick(item) {
      uni.$u.toast(item.title)
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

.nav-clear {
  padding: 0 16rpx;
}

.msg-list {
  flex: 1;
  height: 0;
  padding: 24rpx;
  box-sizing: border-box;
}

.msg-card {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.msg-card__icon {
  flex-shrink: 0;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #fff9e6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.msg-card__content {
  flex: 1;
  min-width: 0;
}

.msg-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.msg-card__title {
  font-size: 32rpx;
  font-weight: 600;
  color: #222;
}

.msg-card__time {
  flex-shrink: 0;
  font-size: 22rpx;
  color: #999;
}

.msg-card__desc {
  font-size: 26rpx;
  color: #999;
}

.msg-footer {
  padding: 16rpx 0 40rpx;
}
</style>
