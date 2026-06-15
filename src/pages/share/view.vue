<template>
  <view class="page">
    <up-navbar
      title="分享定位"
      :bg-color="THEME_GREEN"
      title-color="#fff"
      left-icon="arrow-left"
      left-icon-color="#fff"
      :auto-back="true"
      :placeholder="true"
      :safe-area-inset-top="true"
    />

    <view v-if="loadError" class="error-wrap">
      <up-empty mode="page" :text="loadError"></up-empty>
    </view>
    <template v-else>
      <view class="map-wrap">
        <amap-view
          class="map-amap"
          :latitude="mapCenter.latitude"
          :longitude="mapCenter.longitude"
          :scale="mapScale"
          :marker-title="device.name || device.imei"
          :address="device.address"
        />
      </view>
      <view class="info-panel">
        <view class="info-head">
          <text class="info-name">{{ device.name || device.imei || '设备' }}</text>
          <view class="status-badge">{{ device.status }}</view>
        </view>
        <text class="info-address">{{ device.address || '暂无地址' }}</text>
        <text v-if="device.updateTime" class="info-time">更新时间：{{ device.updateTime }}</text>
      </view>
    </template>
  </view>
</template>

<script>
import AmapView from '@/components/amap-view/amap-view.vue'
import { THEME_GREEN } from '@/common/theme.js'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_SCALE } from '@/common/amap-config'
import { getShareView, normalizeShareViewDevice } from '@/api/device'

export default {
  components: { AmapView },
  data() {
    return {
      THEME_GREEN,
      mapScale: DEFAULT_MAP_SCALE,
      mapCenter: { ...DEFAULT_MAP_CENTER },
      shareToken: '',
      device: {},
      loadError: '',
    }
  },
  onLoad(options) {
    this.shareToken = options.shareToken || options.token || ''
    if (!this.shareToken) {
      this.loadError = '分享链接无效'
      return
    }
    this.loadShareView()
  },
  methods: {
    async loadShareView() {
      try {
        const res = await getShareView({ shareToken: this.shareToken })
        this.device = normalizeShareViewDevice(res)
        if (this.device.latitude && this.device.longitude) {
          this.mapCenter = {
            latitude: this.device.latitude,
            longitude: this.device.longitude,
          }
        }
      } catch (e) {
        this.loadError = e?.message || '分享已失效或不存在'
      }
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

.map-wrap {
  height: 55vh;
  position: relative;
}

.map-amap {
  width: 100%;
  height: 100%;
}

.info-panel {
  flex: 1;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  margin-top: -24rpx;
  padding: 32rpx;
  position: relative;
  z-index: 1;
}

.info-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.info-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #222;
}

.status-badge {
  font-size: 22rpx;
  color: #3dba6e;
  background: #e8f8ee;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.info-address {
  display: block;
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
}

.info-time {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #999;
}

.error-wrap {
  flex: 1;
  padding: 120rpx 48rpx;
}
</style>
