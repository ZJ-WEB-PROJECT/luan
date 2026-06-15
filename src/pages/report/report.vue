<template>
  <view class="page">
    <up-navbar title="报表" :bg-color="THEME_GREEN" title-color="#fff" left-icon="arrow-left" left-icon-color="#fff"
      :auto-back="true" :placeholder="true" :safe-area-inset-top="true"></up-navbar>

    <!-- Tab -->
    <view class="report-tabs">
      <view v-for="tab in tabs" :key="tab.key" class="report-tabs__item"
        :class="{ 'report-tabs__item--active': activeTab === tab.key }" @click="activeTab = tab.key">
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <!-- 日期切换 -->
    <view class="date-bar">
      <text class="date-bar__nav" @click="changeDay(-1)">前一天</text>
      <view class="date-bar__center" @click="onPickDate">
        <text class="date-bar__date">{{ currentDate }}</text>
        <up-icon name="arrow-down-fill" color="#3dba6e" size="12"></up-icon>
      </view>
      <text class="date-bar__nav" @click="changeDay(1)">后一天</text>
    </view>

    <scroll-view class="content" scroll-y @scrolltolower="onReportScrollToLower">
      <!-- 行程报表 -->
      <template v-if="activeTab === 'trip' && hasReportData">
        <view v-for="(item, index) in pageList" :key="index" class="report-card" @click="onTripDetail(item)">
          <view class="report-card__body">
            <view class="report-row">
              <text class="report-row__label">开始时间</text>
              <text class="report-row__value">{{ formatReportStart(item) }}</text>
            </view>
            <view class="report-row">
              <text class="report-row__label">结束时间</text>
              <text class="report-row__value">{{ formatReportEnd(item) }}</text>
            </view>
            <view class="report-row">
              <text class="report-row__label">时长</text>
              <text class="report-row__value">{{ formatTripDuration(item) }}</text>
            </view>
            <view class="report-row">
              <text class="report-row__label">起点</text>
              <text class="report-row__coord">{{ formatTripStartPoint(item) }}</text>
            </view>
            <view class="report-row">
              <text class="report-row__label">终点</text>
              <text class="report-row__coord">{{ formatTripEndPoint(item) }}</text>
            </view>
          </view>
          <up-icon name="arrow-right" color="#ddd" size="16"></up-icon>
        </view>
      </template>

      <!-- 停留报表 -->
      <template v-else-if="hasReportData">
        <view v-for="(item, index) in pageList" :key="index" class="report-card" @click="onStayDetail(item)">
          <view class="report-card__body">
            <view class="report-row">
              <text class="report-row__label">停留时间</text>
              <text class="report-row__value">{{ getStayTime(item) }}</text>
            </view>
            <view class="report-row">
              <text class="report-row__label">开始时间</text>
              <text class="report-row__value">{{ formatReportStart(item) }}</text>
            </view>
            <view class="report-row">
              <text class="report-row__label">结束时间</text>
              <text class="report-row__value">{{ formatReportEnd(item) }}</text>
            </view>
            <view class="report-row">
              <text class="report-row__label">地址</text>
              <text class="report-row__coord">{{ formatStayAddress(item) }}</text>
            </view>
          </view>
          <up-icon name="arrow-right" color="#ddd" size="16"></up-icon>
        </view>
      </template>

      <view v-if="!hasReportData" class="empty-wrap">
        <up-empty mode="data" text="暂无报表数据"></up-empty>
      </view>

      <view v-else-if="pageLoading" class="list-footer">
        <text>加载中...</text>
      </view>
      <view v-else-if="pageFinished" class="list-footer">
        <text>没有更多了</text>
      </view>
      <view v-else class="list-footer">
        <text>上拉加载更多</text>
      </view>
    </scroll-view>

    <!-- 日期选择弹窗 -->
    <up-calendar :show="showDatePicker" title="选择日期" mode="single" :default-date="currentDate"
      :min-date="calendarMinDate" :max-date="calendarMaxDate" :show-lunar="true" :show-mark="true" :month-switch="true"
      :month-num="12" color="#3dba6e" confirm-text="确认" :week-text="weekText" month-format="YYYY年 M月" round="16"
      :close-on-click-overlay="true" :formatter="dateFormatter" @confirm="onDateConfirm"
      @close="showDatePicker = false"></up-calendar>
  </view>
</template>

<script>
import dayjs from 'dayjs'
import {
  getDeviceStay,
  getDeviceTrip,
  formatReportTime,
  formatStayDuration,
} from '@/api/device'
import { THEME_GREEN } from '@/common/theme.js'
import pageLoadMixin, { PAGE_MODE } from '@/mixins/page-load'

export default {
  mixins: [pageLoadMixin],
  data() {
    const today = dayjs()
    return {
      THEME_GREEN,
      deviceId: '',
      activeTab: 'stay',
      showDatePicker: false,
      currentDay: today,
      weekText: ['一', '二', '三', '四', '五', '六', '日'],
      calendarMinDate: today.startOf('year').format('YYYY-MM-DD'),
      calendarMaxDate: today.format('YYYY-MM-DD'),
      /** 有报表数据的日期（显示红点） */
      datesWithData: [],
      tabs: [
        { key: 'stay', label: '停留报表' },
        { key: 'trip', label: '行程报表' },
      ],
      pageLimitSize: 20,
    }
  },
  computed: {
    currentDate() {
      return this.currentDay.format('YYYY-MM-DD')
    },
    hasReportData() {
      return this.pageList.length > 0
    },
  },
  watch: {
    activeTab() {
      this.loadReport()
    },
  },
  created() {
    this.initDatesWithData()
  },
  onLoad(options) {
    this.deviceId = uni.getStorageSync('currentDevice').sn
    if (options.tab === 'stay') this.activeTab = 'stay'
    else if (options.tab === 'trip') this.activeTab = 'trip'
    this.loadReport()
  },
  methods: {
    getStayTime(item) {
      if (item.items) {
        return formatStayDuration(item.items[0].cos_time)
      } else {
        return 0
      }
    },
    formatReportStart(item) {
      return formatReportTime(item.start_time || item.items[0]?.start_time)
    },
    formatReportEnd(item) {
      return formatReportTime(item.stop_time || (item.items[0]?.start_time + item.items[0].cos_time))
    },
    formatTripDuration(item) {
      return formatStayDuration(item.cos_time)
    },
    formatTripStartPoint(item) {
      return item?.start_wgs ?? item?.startWgs ?? item?.start_point ?? ''
    },
    formatTripEndPoint(item) {
      return item?.stop_wgs ?? item?.endWgs ?? item?.end_point ?? ''
    },
    formatStayAddress(item) {
      const wgs = item?.wgs || ''
      const lon = item?.lon ?? item?.longitude
      const lat = item?.lat ?? item?.latitude
      const coord = wgs || (lon != null && lat != null ? `${lon},${lat}` : '')
      return item?.address || coord
    },
    initDatesWithData() {
      const list = []
      const today = dayjs()
      const month = today.startOf('month')
      const daysInMonth = month.daysInMonth()
      for (let d = 1; d <= daysInMonth; d++) {
        if (d <= today.date()) {
          list.push(month.date(d).format('YYYY-MM-DD'))
        }
      }
      this.datesWithData = list
    },
    changeDay(delta) {
      const next = this.currentDay.add(delta, 'day')
      if (next.isAfter(dayjs(), 'day')) {
        uni.$u.toast('不能选择未来日期')
        return
      }
      this.currentDay = next
      this.loadReport()
    },
    onPickDate() {
      this.showDatePicker = true
    },
    dateFormatter(day) {
      const dateStr = dayjs(day.date).format('YYYY-MM-DD')
      if (this.datesWithData.includes(dateStr)) {
        day.dot = true
      }
      if (dayjs(dateStr).isSame(dayjs(), 'day')) {
        day.bottomInfo = '今天'
      }
      return day
    },
    onDateConfirm(selected) {
      let raw = selected
      if (Array.isArray(selected) && selected.length) {
        raw = selected[0]
      }
      const d = dayjs(raw?.date ?? raw)
      if (d.isValid()) {
        this.currentDay = d
        this.loadReport()
      }
      this.showDatePicker = false
    },
    getPageLoadOptions() {
      const isTrip = this.activeTab === 'trip'
      return {
        requestFn: isTrip ? getDeviceTrip : getDeviceStay,
        sn: this.deviceId,
        date: this.currentDate,
        limitSize: this.pageLimitSize,
        mode: isTrip ? PAGE_MODE.TRIP : PAGE_MODE.DEFAULT,
        errorMsg: '报表查询失败',
      }
    },
    async loadReport() {
      if (!this.deviceId) return
      try {
        await this.fetchPageFirst(this.getPageLoadOptions())
      } catch {
        // toast 已在 mixin 中处理
      }
    },
    onReportScrollToLower() {
      if (this.pageFinished || this.pageLoading) return
      this.loadPageMore(this.getPageLoadOptions())
    },
    onTripDetail(item) {
      uni.$u.toast('行程详情')
    },
    onStayDetail(item) {
      uni.$u.toast('停留详情')
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

.report-tabs {
  display: flex;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.report-tabs__item {
  flex: 1;
  text-align: center;
  padding: 28rpx 0;
  font-size: 30rpx;
  color: #999;
  position: relative;
}

.report-tabs__item--active {
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

.date-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: #f8f8f8;
  flex-shrink: 0;
}

.date-bar__nav {
  font-size: 28rpx;
  color: #3dba6e;
}

.date-bar__center {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.date-bar__date {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.content {
  flex: 1;
  height: 0;
  padding: 24rpx;
  box-sizing: border-box;
}

.report-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 20rpx;
}

.report-card__body {
  flex: 1;
  min-width: 0;
}

.report-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12rpx;
  font-size: 28rpx;
  line-height: 1.5;

  &:last-child {
    margin-bottom: 0;
  }
}

.report-row__label {
  color: #666;
  flex-shrink: 0;
  width: 150rpx;
}

.report-row__value {
  color: #222;
  flex: 1;
}

.report-row__coord {
  color: #3dba6e;
  flex: 1;
  word-break: break-all;
}

.empty-wrap {
  padding: 120rpx 0 80rpx;
}

.list-footer {
  text-align: center;
  padding: 32rpx 0 48rpx;
  font-size: 26rpx;
  color: #ccc;
  position: relative;

  &::after {
    content: '';
    display: block;
    width: 120rpx;
    height: 2rpx;
    background: #e8e8e8;
    margin: 16rpx auto 0;
  }
}
</style>
