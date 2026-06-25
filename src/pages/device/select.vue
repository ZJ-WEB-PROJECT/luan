<template>
  <view class="page">
    <up-navbar
      title="选择设备"
      :bg-color="THEME_GREEN"
      title-color="#fff"
      left-icon="home"
      left-icon-color="#fff"
      :auto-back="false"
      :placeholder="true"
      :safe-area-inset-top="true"
      @leftClick="goHome"
    ></up-navbar>

    <view class="page-tip">
      <text class="page-tip__text">请选择对应设备进入</text>
      <view class="page-tip__help" @click="onHowAdd">
        <text>如何添加</text>
        <up-icon name="question-circle" color="#999" size="14"></up-icon>
      </view>
    </view>

    <scroll-view class="device-list" scroll-y>
      <view
        v-for="(item, index) in deviceList"
        :key="item.sn"
        class="device-card"
        :class="{ 'device-card--active': item.sn === selectedSn }"
        @click="onSelectCard(item)"
      >
        <view class="device-card__index">{{ index + 1 }}</view>
        <view class="device-card__main">
          <view class="device-card__head">
            <view class="device-card__status" :class="'device-card__status--' + item.statusType">
              {{ item.status }}
            </view>
            <text class="device-card__name">{{ item.name }}</text>
          </view>
          <text class="device-card__sn">SN:{{ item.sn }}</text>
        </view>
        <view class="device-card__actions">
          <view class="device-card__action device-card__action--enter" @click.stop="onEnter(item)">
            <text>进入</text>
          </view>
          <view class="device-card__action device-card__action--unbind" @click.stop="onUnbind(item)">
            <text>解绑</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="page-footer">
      <view class="add-btn" @click="onAddDevice">
        <text>新增设备</text>
      </view>
    </view>
  </view>
</template>

<script>
import { THEME_GREEN } from '@/common/theme.js'
import { getDeviceList, normalizeDeviceList, unbindDevice } from '@/api/device'

const STORAGE_KEY = 'currentDevice'

export default {
  data() {
    return {
      THEME_GREEN,
      selectedSn: '',
      deviceList: [],
    }
  },
  onLoad() {
    const current = uni.getStorageSync(STORAGE_KEY)
    if (current && current.sn) {
      this.selectedSn = current.sn
    } else if (this.deviceList.length) {
      this.selectedSn = this.deviceList[0].sn
    }
  },
  onShow() {
    this.getDeviceList()
  },
  methods: {
    async getDeviceList() {
      try {
        const res = await getDeviceList()
        const list = normalizeDeviceList(res)
        if (list.length) {
          this.deviceList = list
          if (!this.selectedSn) {
            this.selectedSn = list[0].sn
          }
        }else{
          this.deviceList = []
        }
      } catch (e) {
        console.error('[select] getDeviceList failed:', e)
      }
    },
    goHome() {
      uni.switchTab({ url: '/pages/index/index' })
    },
    onHowAdd() {
      uni.navigateTo({ url: '/pages/device/bind' })
    },
    onSelectCard(item) {
      this.selectedSn = item.sn
    },
    onEnter(item) {
      uni.setStorageSync(STORAGE_KEY, item)
      uni.navigateBack({
        fail: () => {
          uni.switchTab({ url: '/pages/index/index' })
        },
      })
    },
    onUnbind(item) {
      uni.showModal({
        title: '解绑设备',
        content: `确认解绑设备 ${item.sn} 吗？`,
        confirmColor: '#f56c6c',
        success: async (res) => {
          if (!res.confirm) return
          try {
            await unbindDevice({
              sn: item.sn,
              deviceId: item.deviceId ?? item.raw?.deviceId ?? item.raw?.id,
            })

            const current = uni.getStorageSync(STORAGE_KEY)
            if (current?.sn === item.sn) {
              uni.removeStorageSync(STORAGE_KEY)
            }
            uni.$u.toast('解绑成功')
            await this.getDeviceList()
            if (!this.deviceList.length) {
              this.selectedSn = ''
              return
            }
            if (this.selectedSn === item.sn) {
              this.selectedSn = this.deviceList[0].sn
            }
          } catch (e) {
            console.error('[select] unbindDevice failed:', e)
          }
        },
      })
    },
    onAddDevice() {
      uni.navigateTo({ url: '/pages/device/bind' })
    },
  },
}
</script>

<style lang="scss" scoped>
$green: #3dba6e;
$green-light: #e8f8f0;

.page {
  min-height: 100vh;
  background: #f4f4f4;
  display: flex;
  flex-direction: column;
}

.page-tip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 28rpx;
  background: #f4f4f4;
}

.page-tip__text {
  font-size: 24rpx;
  color: #999;
}

.page-tip__help {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 24rpx;
  color: #999;
}

.device-list {
  flex: 1;
  padding: 0 24rpx;
  box-sizing: border-box;
}

.device-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 24rpx;
  padding: 28rpx 24rpx;
  background: #fff;
  border-radius: 16rpx;
  border: 2rpx solid #eee;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

  &--active {
    border-color: $green;
    box-shadow: 0 4rpx 20rpx rgba(61, 186, 110, 0.15);
  }
}

.device-card__index {
  flex-shrink: 0;
  min-width: 40rpx;
  height: 40rpx;
  padding: 0 8rpx;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.device-card--active .device-card__index {
  border-color: $green;
  color: $green;
}

.device-card__main {
  flex: 1;
  min-width: 0;
}

.device-card__head {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.device-card__status {
  flex-shrink: 0;
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  color: #fff;

  &--offline {
    background: #999;
  }

  &--static {
    background: $green;
  }
}

.device-card__name {
  font-size: 32rpx;
  font-weight: 700;
  color: #222;
}

.device-card__sn {
  font-size: 26rpx;
  color: #999;
}

.device-card__actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  align-items: flex-end;
}

.device-card__action {
  flex-shrink: 0;
  padding: 10rpx 28rpx;
  border-radius: 32rpx;
}

.device-card__action--enter {
  background: $green-light;
}

.device-card__action--unbind {
  background: #fff1f0;
  border: 1rpx solid #ffd6d1;
}

.device-card__action--enter text {
  color: $green;
}

.device-card__action--unbind text {
  color: #f56c6c;
}

.device-card__action text {
  font-size: 26rpx;
  font-weight: 500;
}

.page-footer {
  padding: 24rpx 28rpx calc(24rpx + env(safe-area-inset-bottom));
  background: #f4f4f4;
}

.add-btn {
  height: 88rpx;
  background: $green;
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
