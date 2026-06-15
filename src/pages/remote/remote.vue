<template>

  <view class="page">

    <up-navbar title="远程设置" :bg-color="THEME_GREEN" title-color="#fff" left-icon="arrow-left" left-icon-color="#fff"

      :auto-back="true" :placeholder="true" :safe-area-inset-top="true"></up-navbar>



    <view class="tabs">

      <view v-for="tab in tabs" :key="tab.key" class="tabs__item"

        :class="{ 'tabs__item--active': activeTab === tab.key }" @click="activeTab = tab.key">

        <text>{{ tab.label }}</text>

      </view>

    </view>



    <scroll-view class="content" scroll-y @scrolltolower="onRecordScrollToLower">

      <!-- 远程设置 -->

      <template v-if="activeTab === 'settings'">

        <view v-for="item in settingsList" :key="item.key" class="setting-card" @click="onSettingClick(item)">

          <view class="setting-card__main">

            <view class="setting-card__head">

              <text class="setting-card__title">{{ item.title }} </text>

              <text v-if="item.status" class="setting-card__status">{{ config[item.key] ? '已开启' : '已关闭' }}</text>

            </view>

            <text class="setting-card__desc">{{ item.desc }}</text>

          </view>

          <up-icon name="arrow-right" color="#ccc" size="16"></up-icon>

        </view>

      </template>



      <!-- 操作记录 -->

      <template v-else>

        <template v-if="pageList.length">

          <view

            v-for="(item, index) in pageList"

            :key="logItemKey(item, index)"

            class="record-card"

          >

            <text class="record-card__title">{{ item.remark }} ({{ item.imei }})</text>

            <text class="record-card__status">{{ logStatus(item) }}</text>

            <text class="record-card__time">{{ logTime(item) }}</text>

            <!-- <text v-if="logResponse(item)" class="record-card__response">{{ logResponse(item) }}</text> -->

          </view>

        </template>



        <view v-else-if="pageLoading" class="empty-wrap">

          <text class="loading-tip">加载中...</text>

        </view>

        <view v-else class="empty-wrap">

          <up-empty mode="list" text="暂无操作记录"></up-empty>

        </view>



        <view v-if="pageList.length && pageLoading" class="list-footer">

          <text>加载中...</text>

        </view>

        <view v-else-if="pageList.length && pageFinished" class="list-footer">

          <text>没有更多了</text>

        </view>

        <view v-else-if="pageList.length" class="list-footer">

          <text>上拉加载更多</text>

        </view>

      </template>

    </scroll-view>

  </view>

</template>



<script>

import { THEME_GREEN } from '@/common/theme.js'

import {

  getDeviceConfig,

  locationTracking,

  sendDeviceCmd,

  setDeviceConfig,

  getDeviceLog,

  formatDeviceLogTime,

} from '@/api/device'

import pageLoadMixin, { PAGE_MODE } from '@/mixins/page-load'



export default {

  mixins: [pageLoadMixin],

  data() {

    return {

      THEME_GREEN,

      deviceId: '',

      activeTab: 'settings',

      pageLimitSize: 20,

      tabs: [

        { key: 'settings', label: '远程设置' },

        { key: 'records', label: '操作记录' },

      ],

      config: {},

      settingsList: [

        {

          key: 'locate',

          title: '立即定位',

          desc: '立即刷新定位，上传当前设备定位点',

        },

        {

          key: 'protect',

          title: '远程设防',

          desc: '需开启震动报警，应提前打开远程设防',

        },

        {

          key: 'alarmswitch',

          title: '震动告警',

          status: 1,

          desc: '默认打开，终端进入设防状态后，若车辆连续产生震动将会触发震动报警',

        },

        {

          key: 'dropalarm',

          title: '防拆告警',

          status: 1,

          desc: '开启后，设备被拆除后将会触发防拆报警',

        },

        {

          key: 'lowpower',

          title: '低电告警',

          status: 1,

          desc: '开启后，设备内置电池电压过低时将会触发低电报警，且推送到平台',

        },

        {

          key: 'speedswitch',

          title: '超速告警',

          status: 1,

          desc: '开启后，当车辆在[持续时间]内的行驶速度大于设置的超速速度时，设备发出超速报警',

        },

        {

          key: 'customCmd',

          title: '自定义指令',

          desc: '自定义指令用于出厂检测，售后测试',

        },

        {

          key: 'reboot',

          title: '设备重启',

          desc: '远程重启设备',

        },

        {

          key: 'reset',

          title: '恢复出厂',

          desc: '恢复出厂到默认状态，如定位设置变更为普通模式、关闭微震动感应、求救，清空sos联系人等，同时清除平台已保存的参数设备',

        },

      ],

    }

  },

  watch: {

    activeTab(val) {

      if (val === 'records') {

        this.loadRecordList()

      }

    },

  },

  onLoad(options) {

    const dev = uni.getStorageSync('currentDevice')

    this.deviceId = dev?.sn || dev?.imei || options.deviceId || ''

    if (options.tab === 'records') {

      this.activeTab = 'records'

    }

    this.getDeviceConfig()

  },

  methods: {

    getPageLoadOptions() {

      return {

        requestFn: getDeviceLog,

        sn: this.deviceId,

        limitSize: this.pageLimitSize,

        mode: PAGE_MODE.LOG,

        beginTime: 0,

        endTime: 0,

        extra: { type: '' },

        errorMsg: '加载操作记录失败',

      }

    },

    async loadRecordList() {

      if (!this.deviceId) {

        this.resetPage()

        return

      }

      try {

        await this.fetchPageFirst(this.getPageLoadOptions())

      } catch {

        // toast 已在 mixin 中处理

      }

    },

    onRecordScrollToLower() {

      if (this.activeTab !== 'records') return

      if (this.pageFinished || this.pageLoading) return

      this.loadPageMore(this.getPageLoadOptions())

    },

    logItemKey(item, index) {

      const ts = item?.time ?? item?.last_time ?? item?.create_time ?? index

      const imei = item?.imei ?? item?.last_imei ?? ''

      return `${imei}_${ts}_${index}`

    },

    logStatus(item) {

      return item?.status ?? item?.state ?? item?.result ?? item?.msg ?? ''

    },

    logTime(item) {

      const ts = item?.time ?? item?.last_time ?? item?.create_time ?? item?.createTime

      return formatDeviceLogTime(ts)

    },

    logResponse(item) {

      return item?.response ?? item?.response_message ?? item?.content ?? item?.remark ?? ''

    },

    async getDeviceConfig() {

      if (!this.deviceId) return

      const res = await getDeviceConfig({

        sn: this.deviceId,

        type: 'e_config_all',

      })

      this.config = res.config?.car_switch || {}

    },

    async locationTracking() {

      await locationTracking({

        effectiveTime: 30,

        intervalTime: 30,

        isAddLog: true,

        sn: this.deviceId,

      })

      uni.$u.toast('定位成功')

      if (this.activeTab === 'records') {

        this.loadRecordList()

      }

    },

    async rebootDevice(key) {

      await sendDeviceCmd({

        alarmtype: 1,

        sn: this.deviceId,

        type: key,

      })

      uni.$u.toast('操作成功')

      if (this.activeTab === 'records') {

        this.loadRecordList()

      }

    },

    async alarmSwitch(key) {

      const params = {

        config: {

          car_switch: {

            [key]: 1,

          },

        },

      }

      await setDeviceConfig({

        sn: this.deviceId,

        params,

      })

      uni.$u.toast('操作成功')

      await this.getDeviceConfig()

      if (this.activeTab === 'records') {

        this.loadRecordList()

      }

    },

    onSettingClick(item) {

      if (item.key === 'locate') {

        this.locationTracking()

        return

      }



      if (['protect', 'alarmswitch', 'dropalarm', 'lowpower', 'speedswitch'].includes(item.key)) {

        this.alarmSwitch(item.key)

        return

      }



      const dangerKeys = ['arm', 'reset', 'reboot']

      if (dangerKeys.includes(item.key)) {

        uni.showModal({

          title: '提示',

          content: `确定要执行「${item.title}」吗？`,

          confirmColor: '#3dba6e',

          success: (res) => {

            if (res.confirm) {

              this.rebootDevice(item.key)

            }

          },

        })

        return

      }

      if (['vibration'].includes(item.key)) {

        uni.$u.toast(`${item.title}设置`)

        return

      }

      if (item.key === 'customCmd') {

        uni.$u.toast('自定义指令')

        return

      }

      this.sendCommand(item)

    },

    sendCommand(item) {

      uni.$u.toast(`已发送：${item.title}`)

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



.tabs {

  display: flex;

  background: #fff;

  border-bottom: 1rpx solid #f0f0f0;

  flex-shrink: 0;

}



.tabs__item {

  flex: 1;

  text-align: center;

  padding: 28rpx 0;

  font-size: 30rpx;

  color: #999;

  position: relative;

}



.tabs__item--active {

  color: #222;

  font-weight: 600;



  &::after {

    content: '';

    position: absolute;

    left: 50%;

    bottom: 0;

    transform: translateX(-50%);

    width: 80rpx;

    height: 6rpx;

    background: #3dba6e;

    border-radius: 3rpx;

  }

}



.content {

  flex: 1;

  height: 0;

  padding: 24rpx;

  box-sizing: border-box;

}



.setting-card {

  display: flex;

  align-items: center;

  background: #fff;

  border-radius: 12rpx;

  padding: 28rpx 24rpx;

  margin-bottom: 20rpx;

  gap: 16rpx;

}



.setting-card__main {

  flex: 1;

  min-width: 0;

}



.setting-card__head {

  display: flex;

  align-items: center;

  flex-wrap: wrap;

  gap: 12rpx;

  margin-bottom: 12rpx;

}



.setting-card__title {

  font-size: 32rpx;

  font-weight: 600;

  color: #222;

}



.setting-card__status {

  font-size: 26rpx;

  color: #999;

}



.setting-card__desc {

  font-size: 26rpx;

  color: #999;

  line-height: 1.6;

  display: block;

}



.record-card {

  background: #fff;

  border-radius: 12rpx;

  padding: 28rpx 24rpx;

  margin-bottom: 20rpx;

}



.record-card__title {

  font-size: 32rpx;

  font-weight: 600;

  color: #222;

  display: block;

  margin-bottom: 12rpx;

}



.record-card__status,

.record-card__time {

  font-size: 26rpx;

  color: #999;

  display: block;

  line-height: 1.6;

}



.record-card__response {

  font-size: 24rpx;

  color: #999;

  line-height: 1.5;

  display: block;

  margin-top: 12rpx;

  word-break: break-all;

}



.empty-wrap {

  padding: 80rpx 0;

  text-align: center;

}



.loading-tip {

  font-size: 28rpx;

  color: #999;

}



.list-footer {

  padding: 24rpx 0 40rpx;

  text-align: center;

  font-size: 26rpx;

  color: #999;

}

</style>

