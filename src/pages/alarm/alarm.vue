<template>
  <view class="page">
    <up-navbar title="告警设置" :bg-color="THEME_GREEN" title-color="#fff" left-icon="arrow-left" left-icon-color="#fff"
      :auto-back="true" :placeholder="true" :safe-area-inset-top="true"></up-navbar>

    <scroll-view class="content" scroll-y>
      <view v-for="group in settingGroups" :key="group.key" class="group">
        <view class="group__header">
          <text>{{ group.title }}</text>
        </view>
        <view class="group__body">
          <view v-for="(item, index) in group.items" :key="item.key" class="setting-row"
            :class="{ 'setting-row--last': index === group.items.length - 1 }">
            <text class="setting-row__label">{{ item.label }}</text>
            <up-switch v-model="settings[item.key]" :active-color="THEME_GREEN" size="22"
              @change="onSwitchChange(item.key, $event)"></up-switch>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { THEME_GREEN } from '@/common/theme.js'
import { getDeviceConfig } from '@/api/device'
function createDefaultSettings() {
  return {
    wechatPush: false,
    phoneNotify: false,
    smsNotify: false,
    vibrationAlarm: false,
    tamperAlarm: false,
    lowBatteryAlarm: false,
    overspeedAlarm: false,
    staticAlarm: false,
    offlineAlarm: false,
    fenceAlarm: false,
  }
}

export default {
  data() {
    return {
      THEME_GREEN,
      deviceId: '',
      settings: createDefaultSettings(),
      settingGroups: [
        {
          key: 'message',
          title: '消息推送开关',
          items: [
            { key: 'wechatPush', label: '微信推送' },
            { key: 'phoneNotify', label: '电话通知' },
            { key: 'smsNotify', label: '短信通知' },
          ],
        },
        {
          key: 'alarm',
          title: '告警推送开关',
          items: [
            { key: 'vibrationAlarm', label: '震动告警' },
            { key: 'tamperAlarm', label: '防拆告警' },
            { key: 'lowBatteryAlarm', label: '低电告警' },
            { key: 'overspeedAlarm', label: '超速告警' },
            { key: 'staticAlarm', label: '静止告警' },
            { key: 'offlineAlarm', label: '离线告警' },
            { key: 'fenceAlarm', label: '围栏告警' },
          ],
        },
      ],
    }
  },
  onLoad() {
    this.deviceId = uni.getStorageSync('currentDevice').sn
    this.loadSettings()
  },
  methods: {
    async loadSettings() {
      // TODO: 对接设备告警设置查询接口
      if (!this.deviceId) return
      const res = await getDeviceConfig({ sn: this.deviceId, type: "e_config_all" })
      console.log('res', res)
    },
    saveSettings() {
      if (!this.deviceId) return
      uni.setStorageSync(`alarm_settings_${this.deviceId}`, this.settings)
    },
    onSwitchChange(key, value) {
      this.settings[key] = value
      this.saveSettings()
      // TODO: 对接保存告警设置接口
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
}

.content {
  flex: 1;
  height: 0;
}

.group {
  margin-bottom: 24rpx;
}

.group__header {
  padding: 20rpx 32rpx;
  background: #f0f0f0;

  text {
    font-size: 26rpx;
    color: #666;
  }
}

.group__body {
  background: #fff;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.setting-row--last {
  border-bottom: none;
}

.setting-row__label {
  font-size: 30rpx;
  color: #333;
}
</style>
