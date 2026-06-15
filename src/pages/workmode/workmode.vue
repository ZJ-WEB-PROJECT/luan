<template>
  <view class="page">
    <up-navbar title="工作模式" :bg-color="THEME_GREEN" title-color="#fff" left-icon="arrow-left" left-icon-color="#fff"
      :auto-back="true" :placeholder="true" :safe-area-inset-top="true"></up-navbar>

    <scroll-view class="content" scroll-y>
      <view class="section">
        <view class="section__header">
          <text>工作模式</text>
        </view>
        <view class="option-list">
          <view v-for="item in workModes" :key="item.key" class="option-item" @click="workMode = item.key">
            <view class="option-item__radio" :class="{ 'option-item__radio--active': workMode === item.key }">
              <up-icon v-if="workMode === item.key" name="checkbox-mark" color="#fff" size="14"></up-icon>
            </view>
            <view class="option-item__body">
              <view class="option-item__title-row">
                <text class="option-item__title">{{ item.label }}</text>
                <text v-if="item.tag" class="option-item__tag">{{ item.tag }}</text>
              </view>
              <text class="option-item__desc">{{ item.desc }}</text>
              <view v-if="item.key === 'smart' && workMode === 'smart'" class="time-row"
                @click.stop="showTimePicker = true">
                <text class="time-row__label">选择定位时间</text>
                <view class="time-row__value">
                  <text>{{ locateIntervalLabel }}</text>
                  <up-icon name="arrow-down-fill" color="#999" size="12"></up-icon>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section__header">
          <text>定位优先级</text>
        </view>
        <view class="option-list">
          <view v-for="item in priorityModes" :key="item.key" class="option-item" @click="priorityMode = item.key">
            <view class="option-item__radio" :class="{ 'option-item__radio--active': priorityMode === item.key }">
              <up-icon v-if="priorityMode === item.key" name="checkbox-mark" color="#fff" size="14"></up-icon>
            </view>
            <view class="option-item__body">
              <view class="option-item__title-row">
                <text class="option-item__title">{{ item.label }}</text>
                <text v-if="item.tag" class="option-item__tag">{{ item.tag }}</text>
              </view>
              <text class="option-item__desc">{{ item.desc }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="footer-bar">
      <view class="footer-bar__btn" @click="onConfirm">
        <text>确认</text>
      </view>
    </view>

    <up-action-sheet :show="showTimePicker" :actions="intervalActions" title="选择定位时间" @close="showTimePicker = false"
      @select="onIntervalSelect"></up-action-sheet>
  </view>
</template>

<script>
import { THEME_GREEN } from '@/common/theme.js'
import { getLocationMode } from '@/api/device.js'
const INTERVAL_OPTIONS = [
  { name: '半分钟', value: '30s' },
  { name: '1分钟', value: '1m' },
  { name: '2分钟', value: '2m' },
  { name: '5分钟', value: '5m' },
  { name: '10分钟', value: '10m' },
]

export default {
  data() {
    return {
      THEME_GREEN,
      deviceId: '',
      workMode: 'smart',
      priorityMode: 'wifi',
      locateInterval: '30s',
      showTimePicker: false,
      intervalActions: INTERVAL_OPTIONS.map((o) => ({ name: o.name })),
      workModes: [
        {
          key: 'second',
          label: '秒定模式',
          desc: '设备每10秒上报一次数据，带拐角补偿。上报频率高，轨迹完整',
        },
        {
          key: 'smart',
          label: '智能工作模式',
          tag: '(默认)',
          desc: '推荐使用。运动时定位，静止时省电。支持紧急呼叫',
        },
        {
          key: 'timed',
          label: '定时工作模式',
          tag: '(不推荐)',
          desc: '按固定间隔上传。支持紧急呼叫。历史轨迹较差',
        },
        {
          key: 'power',
          label: '省电模式',
          tag: '(不推荐)',
          desc: '不支持远程开关机及紧急呼叫。按固定时间开关机。用于车贷等场景',
        },
      ],
      priorityModes: [
        {
          key: 'wifi',
          label: 'WIFI优先',
          tag: '(推荐)',
          desc: '省电，适合室内',
        },
        {
          key: 'gps',
          label: 'GPS优先',
          tag: '(不推荐)',
          desc: '室外定位精准，仅紧急情况使用',
        },
      ],
    }
  },
  computed: {
    locateIntervalLabel() {
      const found = INTERVAL_OPTIONS.find((o) => o.value === this.locateInterval)
      return found ? found.name : '半分钟'
    },
  },
  onLoad() {
    this.deviceId = uni.getStorageSync('currentDevice').sn
    this.getLocationMode()
    this.loadSaved()

  },
  methods: {
    async getLocationMode() {
      const res = await getLocationMode({ sn: this.deviceId })
      console.log(res)
    },
    storageKey() {
      return `workmode_${this.deviceId}`
    },
    loadSaved() {
      const saved = uni.getStorageSync(this.storageKey())
      if (!saved || typeof saved !== 'object') return
      if (saved.workMode) this.workMode = saved.workMode
      if (saved.priorityMode) this.priorityMode = saved.priorityMode
      if (saved.locateInterval) this.locateInterval = saved.locateInterval
    },
    onIntervalSelect(item) {
      const found = INTERVAL_OPTIONS.find((o) => o.name === item.name)
      if (found) this.locateInterval = found.value
      this.showTimePicker = false
    },
    onConfirm() {
      const payload = {
        workMode: this.workMode,
        priorityMode: this.priorityMode,
        locateInterval: this.locateInterval,
      }
      if (this.deviceId) {
        uni.setStorageSync(this.storageKey(), payload)
      }
      // TODO: 对接工作模式保存接口
      uni.$u.toast('保存成功')
      setTimeout(() => uni.navigateBack(), 400)
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
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.content {
  flex: 1;
  height: 0;
}

.section {
  margin-bottom: 16rpx;
}

.section__header {
  padding: 20rpx 32rpx;
  background: #ebebeb;

  text {
    font-size: 28rpx;
    color: #666;
  }
}

.option-list {
  background: #fff;
}

.option-item {
  display: flex;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.option-item__radio {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid #ddd;
  margin-right: 20rpx;
  margin-top: 6rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-item__radio--active {
  background: #3dba6e;
  border-color: #3dba6e;
}

.option-item__body {
  flex: 1;
  min-width: 0;
}

.option-item__title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 10rpx;
}

.option-item__title {
  font-size: 32rpx;
  font-weight: 600;
  color: #222;
}

.option-item__tag {
  font-size: 26rpx;
  color: #e74c3c;
}

.option-item__desc {
  font-size: 26rpx;
  color: #999;
  line-height: 1.6;
  display: block;
}

.time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.time-row__label {
  font-size: 28rpx;
  color: #333;
}

.time-row__value {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
  border: 1rpx solid #eee;

  text {
    font-size: 28rpx;
    color: #333;
  }
}

.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.footer-bar__btn {
  height: 88rpx;
  background: #3dba6e;
  border-radius: 12rpx;
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
