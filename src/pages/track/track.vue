<template>
  <view class="page">
    <up-navbar :title="deviceId" :bg-color="THEME_GREEN" title-color="#fff" left-icon="arrow-left"
      left-icon-color="#fff" :auto-back="true" :placeholder="true" :safe-area-inset-top="true"></up-navbar>

    <!-- 日期切换 -->
    <view class="date-bar">
      <text class="date-bar__nav" @click="changeDay(-1)">前一天</text>
      <view class="date-bar__center" @click="showTimePopup = true">
        <text class="date-bar__date">{{ currentDate }}</text>
        <up-icon name="arrow-down-fill" color="#3dba6e" size="12"></up-icon>
      </view>
      <text class="date-bar__nav" @click="changeDay(1)">后一天</text>
    </view>

    <!-- 地图区域 -->
    <view class="map-area">
      <amap-view ref="trackMap" class="track-map" :latitude="mapCenter.latitude" :longitude="mapCenter.longitude"
        :scale="mapScale" :marker-title="'当前位置'" :address="trackInfo.address || ''" :markers="trackAssistMarkers"
        :polyline="mapPolyline" :show-tools="true" @ready="onMapReady" />
      <text v-if="trackLoading" class="map-logo">轨迹加载中...</text>
      <text v-else-if="!trackPoints.length" class="map-logo">暂无轨迹</text>
    </view>

    <view class="info-area">
      <!-- 轨迹信息 -->
      <view class="info-panel">
        <view class="info-panel__main">
          <view class="info-panel__left">
            <view class="info-row">
              <text class="info-label">定位时间:</text>
              <text class="info-value">{{ trackInfo.locateTime }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">工作模式:</text>
              <text class="info-value">{{ trackInfo.workMode }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">速度:</text>
              <text class="info-value">{{ trackInfo.speed }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">里程:</text>
              <text class="info-value">{{ trackInfo.mileage }}</text>
            </view>
            <view class="info-row info-row--addr">
              <text class="info-label">地址:</text>
              <text class="info-value">{{ trackInfo.address }}</text>
            </view>
          </view>
          <view class="info-panel__right">
            <view class="switch-row">
              <text class="switch-label">基站定位</text>
              <up-switch v-model="baseStationOn" :active-color="THEME_GREEN" size="20"></up-switch>
            </view>
            <view class="switch-row">
              <text class="switch-label">WIFI定位</text>
              <up-switch v-model="wifiOn" :active-color="THEME_GREEN" size="20"></up-switch>
            </view>
          </view>
        </view>
      </view>

      <!-- 播放控制 -->
      <view class="play-bar">
        <view class="play-bar__btn" @click="togglePlay">
          <up-icon :name="playing ? 'pause-circle-fill' : 'play-circle-fill'" color="#3dba6e" size="44"></up-icon>
        </view>
        <view class="play-bar__slider">
          <up-slider v-model="playProgress" :min="0" :max="100" :active-color="THEME_GREEN" inactive-color="#e0e0e0"
            block-color="#3dba6e" @change="onProgressChange"></up-slider>
        </view>
        <view class="play-bar__speed" @click="toggleSpeed">
          <text>{{ speedLabel }}</text>
        </view>
      </view>
    </view>

    <!-- 时间选择弹窗 -->
    <up-popup :show="showTimePopup" mode="center" round="16" :close-on-click-overlay="true"
      @close="showTimePopup = false">
      <view class="time-popup">
        <text class="time-popup__title">请选择时间</text>

        <view class="time-popup__quick">
          <view v-for="item in quickRanges" :key="item.key" class="quick-btn"
            :class="{ 'quick-btn--active': quickKey === item.key, 'quick-btn--custom': item.isCustom }"
            @click="selectQuick(item.key)">
            {{ item.label }}
          </view>
        </view>

        <view class="time-popup__field">
          <text class="time-popup__label">开始时间:</text>
          <view class="time-popup__input" @click="pickStartTime">
            <text>{{ startTime }}</text>
          </view>
        </view>
        <view class="time-popup__field">
          <text class="time-popup__label">结束时间:</text>
          <view class="time-popup__input" @click="pickEndTime">
            <text>{{ endTime }}</text>
          </view>
        </view>

        <view class="time-popup__footer">
          <text class="time-popup__cancel" @click="showTimePopup = false">取消</text>
          <text class="time-popup__confirm" @click="confirmTime">确定</text>
        </view>
      </view>
    </up-popup>
  </view>
</template>

<script>
import dayjs from 'dayjs'
import {
  fetchDeviceTrackAll,
  filterTrackByLocateType,
} from '@/api/device'
import { THEME_GREEN } from '@/common/theme.js'
import AmapView from '@/components/amap-view/amap-view.vue'

const SPEED_LABELS = ['慢', '中', '快']
const SPEED_INTERVALS = [1200, 700, 350]
const STORAGE_KEY = 'currentDevice'

export default {
  components: {
    AmapView,
  },
  data() {
    const today = dayjs()
    return {
      THEME_GREEN,
      deviceId: '',
      currentDay: today,
      showTimePopup: false,
      quickKey: 'today',
      quickRanges: [
        { key: 'today', label: '今天' },
        { key: 'yesterday', label: '昨天' },
        { key: 'week', label: '近一周' },
        { key: 'custom', label: '自定义', isCustom: true },
      ],
      startTime: `${today.format('YYYY-MM-DD')} 00:00:00`,
      endTime: `${today.format('YYYY-MM-DD')} 23:59:59`,
      baseStationOn: true,
      wifiOn: true,
      playing: false,
      playProgress: 0,
      speedIndex: 1,
      mapScale: 14,
      mapCenter: {
        latitude: 29.7052,
        longitude: 115.9928,
      },
      allTrackPoints: [],
      trackPoints: [],
      trackLoading: false,
      currentPointIndex: 0,
      playbackTimer: null,
      trackInfo: {},
      mapReady: false,
    }
  },
  watch: {
    baseStationOn() {
      this.applyTrackFilter()
    },
    wifiOn() {
      this.applyTrackFilter()
    },
  },
  computed: {
    currentDate() {
      return this.currentDay.format('YYYY-MM-DD')
    },
    speedLabel() {
      return SPEED_LABELS[this.speedIndex]
    },
    mapPolyline() {
      if (!this.trackPoints.length) return []
      return [
        {
          points: this.trackPoints.map((point) => ({
            latitude: point.latitude,
            longitude: point.longitude,
          })),
          color: '#3dba6e',
          width: 6,
          dottedLine: false,
          arrowLine: true,
        },
      ]
    },
    trackAssistMarkers() {
      if (!this.trackPoints.length) return []
      const markers = []
      const start = this.trackPoints[0]
      const end = this.trackPoints[this.trackPoints.length - 1]
      markers.push({
        id: 101,
        latitude: start.latitude,
        longitude: start.longitude,
        title: '起点',
        width: 22,
        height: 30,
        callout: {
          content: '起点',
          display: 'ALWAYS',
          color: '#fff',
          bgColor: '#4a9eff',
          borderRadius: 8,
          padding: 6,
          fontSize: 11,
        },
      })
      if (this.trackPoints.length > 1) {
        markers.push({
          id: 102,
          latitude: end.latitude,
          longitude: end.longitude,
          title: '终点',
          width: 22,
          height: 30,
          callout: {
            content: '终点',
            display: 'ALWAYS',
            color: '#fff',
            bgColor: '#ff6b6b',
            borderRadius: 8,
            padding: 6,
            fontSize: 11,
          },
        })
      }
      this.trackPoints.forEach((p, idx) => {
        if (p.ptype === 1 && idx > 0 && idx < this.trackPoints.length - 1) {
          markers.push({
            id: 200 + idx,
            latitude: p.latitude,
            longitude: p.longitude,
            title: '停留',
            width: 18,
            height: 18,
            callout: {
              content: '停留',
              display: 'BYCLICK',
              color: '#fff',
              bgColor: '#ff9f43',
              borderRadius: 6,
              padding: 4,
              fontSize: 10,
            },
          })
        }
      })
      return markers
    },
  },
  onLoad() {
    this.deviceId = uni.getStorageSync('currentDevice').sn
    this.applyQuickRange(this.quickKey)
    this.loadTrack()
  },
  onShow() {
    const saved = uni.getStorageSync('track_custom_time')
    if (saved?.startTime && saved?.endTime) {
      this.startTime = saved.startTime
      this.endTime = saved.endTime
      this.quickKey = 'custom'
      const d = dayjs(this.startTime.split(' ')[0])
      if (d.isValid()) this.currentDay = d
      uni.removeStorageSync('track_custom_time')
      this.loadTrack()
    }
  },
  onUnload() {
    this.stopPlayback()
  },
  methods: {
    changeDay(delta) {
      this.currentDay = this.currentDay.add(delta, 'day')
      this.applyDayRange()
      this.loadTrack()
    },
    applyDayRange() {
      const d = this.currentDay.format('YYYY-MM-DD')
      this.startTime = `${d} 00:00:00`
      this.endTime = `${d} 23:59:59`
    },
    selectQuick(key) {
      if (key === 'custom') {
        this.showTimePopup = false
        uni.navigateTo({
          url: `/pages/track/custom-time?deviceId=${this.deviceId}`,
          success: (res) => {
            res.eventChannel.emit('init', {
              startTime: this.startTime,
              endTime: this.endTime,
            })
          },
          events: {
            save: (data) => {
              this.startTime = data.startTime
              this.endTime = data.endTime
              this.quickKey = 'custom'
              const d = dayjs(this.startTime.split(' ')[0])
              if (d.isValid()) this.currentDay = d
              this.loadTrack()
            },
          },
        })
        return
      }
      this.quickKey = key
      this.applyQuickRange(key)
      this.loadTrack()
    },
    applyQuickRange(key) {
      const today = dayjs()
      if (key === 'today') {
        this.currentDay = today
        this.applyDayRange()
      } else if (key === 'yesterday') {
        this.currentDay = today.subtract(1, 'day')
        this.applyDayRange()
      } else if (key === 'week') {
        this.startTime = today.subtract(6, 'day').format('YYYY-MM-DD 00:00:00')
        this.endTime = today.format('YYYY-MM-DD 23:59:59')
      }
    },
    confirmTime() {
      this.showTimePopup = false
      this.loadTrack()
      uni.$u.toast('时间已更新')
    },
    pickStartTime() {
      uni.$u.toast('选择开始时间')
    },
    pickEndTime() {
      uni.$u.toast('选择结束时间')
    },
    applyTrackFilter() {
      const filtered = filterTrackByLocateType(this.allTrackPoints, {
        baseStationOn: this.baseStationOn,
        wifiOn: this.wifiOn,
      })
      if (filtered.length) {
        filtered[0].status = 'start'
        filtered[filtered.length - 1].status = 'end'
      }
      this.trackPoints = filtered
      this.stopPlayback()
      this.playProgress = 0
      this.currentPointIndex = 0
      if (filtered.length) {
        this.syncCurrentPoint(0)
      } else {
        this.trackInfo = {}
      }
    },
    async loadTrack() {
      const timeBegin = dayjs(this.startTime.replace(/\//g, '-')).unix()
      const timeEnd = dayjs(this.endTime.replace(/\//g, '-')).unix()
      if (!timeBegin || !timeEnd || timeEnd <= timeBegin) {
        uni.$u.toast('时间范围无效')
        return
      }

      this.trackLoading = true
      this.stopPlayback()

      try {
        const points = await fetchDeviceTrackAll({
          sn: this.deviceId,
          timeBegin,
          timeEnd,
          limitSize: 100,
        })
        this.allTrackPoints = points
        this.applyTrackFilter()
        if (!this.trackPoints.length) {
          uni.$u.toast('该时间段暂无轨迹')
        }
      } catch (e) {
        console.error('[track] loadTrack failed:', e)
        this.allTrackPoints = []
        this.trackPoints = []
        this.trackInfo = {}
      } finally {
        this.trackLoading = false
      }
    },
    togglePlay() {
      if (!this.trackPoints.length) {
        uni.$u.toast('暂无轨迹数据')
        return
      }
      if (this.playing) {
        this.stopPlayback()
        return
      }
      this.playing = true
      this.playbackTimer = setInterval(() => {
        const nextIndex = this.currentPointIndex + 1
        if (nextIndex >= this.trackPoints.length) {
          this.stopPlayback()
          return
        }
        this.syncCurrentPoint(nextIndex)
      }, SPEED_INTERVALS[this.speedIndex])
    },
    onProgressChange(val) {
      this.playProgress = val
      if (!this.trackPoints.length) return
      const idx = Math.round((val / 100) * (this.trackPoints.length - 1))
      this.syncCurrentPoint(idx)
    },
    toggleSpeed() {
      const wasPlaying = this.playing
      this.speedIndex = (this.speedIndex + 1) % SPEED_LABELS.length
      if (wasPlaying) {
        this.stopPlayback()
        this.togglePlay()
      }
    },
    onMapReady() {
      this.mapReady = true
    },
    stopPlayback() {
      this.playing = false
      if (this.playbackTimer) {
        clearInterval(this.playbackTimer)
        this.playbackTimer = null
      }
    },
    syncCurrentPoint(index) {
      if (!this.trackPoints.length) return
      const safeIndex = Math.max(0, Math.min(index, this.trackPoints.length - 1))
      this.currentPointIndex = safeIndex
      const point = this.trackPoints[safeIndex]
      this.mapCenter = {
        latitude: point.latitude,
        longitude: point.longitude,
      }
      this.trackInfo = {
        locateTime: point.locateTime,
        workMode: point.workMode,
        speed: point.speed,
        mileage: point.mileage,
        address: point.address,
      }
      this.playProgress = this.trackPoints.length <= 1
        ? 0
        : Math.round((safeIndex / (this.trackPoints.length - 1)) * 100)
    },
  },
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #e8eef3;
  display: flex;
  flex-direction: column;
}

.date-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  background: #fff;
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

.map-area {
  position: relative;
  flex: none;
  width: 100%;
  height: calc(100vh - env(safe-area-inset-bottom));
  overflow: hidden;
}

.track-map {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.map-tools {
  position: absolute;
  right: 24rpx;
  top: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.map-tools__btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.map-tools__btn--active {
  border: 2rpx solid #3dba6e;
}

.map-logo {
  position: absolute;
  left: 16rpx;
  bottom: 16rpx;
  font-size: 22rpx;
  color: #666;
  background: rgba(255, 255, 255, 0.8);
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  z-index: 2;
}

.info-area {
  width: calc(100% - 40rpx);
  position: fixed;
  bottom: 80rpx;
  left: 0;
  margin: 0 20rpx;
}

.info-panel {
  margin: 0 0;
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx 28rpx 16rpx;
  flex-shrink: 0;
  margin-bottom: 20rpx;
}

.info-panel__main {
  display: flex;
  gap: 20rpx;
}

.info-panel__left {
  flex: 1;
  min-width: 0;
}

.info-panel__right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20rpx;
  padding-left: 8rpx;
}

.info-row {
  display: flex;
  margin-bottom: 10rpx;
  font-size: 24rpx;
  line-height: 1.5;
}

.info-row--addr {
  align-items: flex-start;
}

.info-label {
  color: #666;
  flex-shrink: 0;
}

.info-value {
  color: #333;
  flex: 1;
}

.switch-row {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.switch-label {
  font-size: 22rpx;
  color: #666;
}

.play-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  border-radius: 24rpx;
}

.play-bar__btn {
  flex-shrink: 0;
}

.play-bar__slider {
  flex: 1;
  padding: 0 8rpx;
}

.play-bar__speed {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  border: 2rpx solid #3dba6e;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  text {
    font-size: 28rpx;
    color: #3dba6e;
    font-weight: 600;
  }
}

.time-popup {
  width: 620rpx;
  padding: 40rpx 36rpx 0;
  background: #fff;
  border-radius: 24rpx;
  box-sizing: border-box;
}

.time-popup__title {
  display: block;
  text-align: center;
  font-size: 34rpx;
  font-weight: 600;
  color: #222;
  margin-bottom: 32rpx;
}

.time-popup__quick {
  display: flex;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.quick-btn {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  font-size: 26rpx;
  color: #999;
  border: 1rpx solid #999;
  border-radius: 8rpx;
  background: #fff;
}

.quick-btn--active {
  background: #3dba6e;
  color: #fff;
  border: 1rpx solid #3dba6e;
}

.quick-btn--custom {
  color: #3dba6e;
  border: 1rpx solid #3dba6e;
}

.time-popup__field {
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.time-popup__label {
  font-size: 28rpx;
  color: #333;
  display: block;
}

.time-popup__input {
  flex: 1;
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 20rpx 24rpx;
  font-size: 26rpx;
  color: #666;
}

.time-popup__footer {
  display: flex;
  border-top: 1rpx solid #eee;
  margin: 32rpx -36rpx 0;
}

.time-popup__cancel,
.time-popup__confirm {
  flex: 1;
  text-align: center;
  padding: 28rpx 0;
  font-size: 32rpx;
}

.time-popup__cancel {
  color: #999;
  border-right: 1rpx solid #eee;
}

.time-popup__confirm {
  color: #3dba6e;
  font-weight: 500;
}
</style>
