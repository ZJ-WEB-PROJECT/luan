<template>
  <view class="page">
    <up-navbar :title="navTitle" :bg-color="THEME_GREEN" title-color="#fff" left-icon="arrow-left"
      left-icon-color="#fff" :auto-back="true" :placeholder="true" :safe-area-inset-top="true"></up-navbar>

    <!-- 围栏类型 Tab -->
    <view class="type-tabs">
      <view v-for="tab in fenceTypes" :key="tab.key" class="type-tabs__item"
        :class="{ 'type-tabs__item--active': fenceType === tab.key }" @click="fenceType = tab.key">
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <!-- 表单 -->
    <view class="form-panel">
      <view class="form-row">
        <text class="form-row__label">名称</text>
        <input v-model="form.name" class="form-row__input" placeholder="请输入围栏名称(必填)"
          placeholder-class="form-placeholder" />
      </view>

      <view class="form-row form-row--click" @click="showAlarmPicker = true">
        <text class="form-row__label">告警</text>
        <view class="form-row__right">
          <text class="form-row__value">{{ form.alarmLabel }}</text>
          <up-icon name="arrow-right" color="#ccc" size="14"></up-icon>
        </view>
      </view>

      <!-- 圆形：范围滑块 -->
      <view v-if="fenceType === 'e_type_circle'" class="form-row form-row--slider">
        <text class="form-row__label">范围</text>
        <view class="form-row__slider-wrap">
          <up-slider v-model="form.radius" :min="50" :max="5000" :step="50" :active-color="THEME_GREEN"
            inactive-color="#e8e8e8" style="flex: 1"></up-slider>
          <text class="form-row__radius">{{ form.radius }} 米</text>
        </view>
      </view>

      <!-- 多边形：撤销/清除 -->
      <view v-if="fenceType === 'e_type_polygon'" class="form-row">
        <text class="form-row__label">修改</text>
        <view class="form-row__btns">
          <view class="mini-btn" @click="onUndo">撤销</view>
          <view class="mini-btn" @click="onClearPolygon">清除</view>
        </view>
      </view>

      <!-- 行政区：省市区 -->
      <view v-if="fenceType === 'e_type_city'" class="form-row form-row--click" @click="openRegionPicker">
        <text class="form-row__label">省市区</text>
        <view class="form-row__right">
          <text class="form-row__value" :class="{ 'form-placeholder': !form.region }">
            {{ form.region || '请选择省市区' }}
          </text>
          <up-icon name="arrow-right" color="#ccc" size="14"></up-icon>
        </view>
      </view>
    </view>

    <!-- 地图 -->
    <view class="map-area">
      <amap-view class="fence-map" :latitude="mapCenter.latitude" :longitude="mapCenter.longitude"
        :scale="fenceMapScale" marker-title="围栏中心" :circles="mapCircles" :polyline="mapPolylines"
        :polygons="mapPolygons" :show-tools="fenceType !== 'e_type_city'" @tap="onMapTap" />
      <view v-if="fenceType === 'e_type_polygon'" class="map-hint">
        <text>在地图上点击绘制多边形顶点</text>
      </view>
    </view>

    <view class="footer-bar">
      <view class="footer-bar__btn" @click="onSave">
        <text>保存</text>
      </view>
    </view>

    <!-- 告警类型选择 -->
    <up-action-sheet :show="showAlarmPicker" :actions="alarmActions" title="选择告警类型" @close="showAlarmPicker = false"
      @select="onAlarmSelect"></up-action-sheet>

    <!-- 省市区三级联动 -->
    <up-picker ref="regionPickerRef" :show="showRegionPicker" :columns="regionColumns" keyName="label" title="选择省市区"
      confirm-color="#3dba6e" @change="onRegionColumnChange" @confirm="onRegionConfirm"
      @cancel="showRegionPicker = false" @close="showRegionPicker = false"></up-picker>
  </view>
</template>

<script>
import { THEME_GREEN } from '@/common/theme.js'
import AmapView from '@/components/amap-view/amap-view.vue'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_SCALE } from '@/common/amap-config'
import {
  buildFenceCreateParams,
  addFence,
  getFenceList,
  normalizeFenceList,
} from '@/api/device'
import {
  buildRegionColumns,
  findRegionIndexes,
  formatRegionText,
  getAreaListByIndexes,
  getCityListByProvinceIndex,
} from '@/common/region'

const STORAGE_KEY = 'currentDevice'

const ALARM_OPTIONS = [
  { name: '入围栏', value: 'e_fence_in' },
  { name: '出围栏', value: 'e_fence_out' },
  { name: '出入围栏', value: 'e_fence_in_out' },
]

/** 根据围栏半径(米)推算地图 scale(3–20)，半径越大视野越远 */
function scaleForFenceRadius(radiusMeters) {
  const minR = 50
  const maxR = 5000
  const maxScale = 17
  const minScale = 10
  const r = Math.max(minR, Math.min(maxR, Number(radiusMeters) || 300))
  if (r <= minR) return maxScale
  if (r >= maxR) return minScale
  const t = (Math.log(r) - Math.log(minR)) / (Math.log(maxR) - Math.log(minR))
  return Math.max(3, Math.min(20, Math.round(maxScale - t * (maxScale - minScale))))
}

export default {
  components: { AmapView },
  data() {
    return {
      THEME_GREEN,
      deviceId: '',
      editId: '',
      fenceType: 'e_type_circle',
      showAlarmPicker: false,
      showRegionPicker: false,
      regionColumns: [[], [], []],
      regionIndexes: [0, 0, 0],
      mapCenter: {
        latitude: DEFAULT_MAP_CENTER.latitude,
        longitude: DEFAULT_MAP_CENTER.longitude,
      },
      polygonPoints: [],
      fenceTypes: [
        { key: 'e_type_circle', label: '圆形围栏' },
        { key: 'e_type_polygon', label: '多边形围栏' },
        { key: 'e_type_city', label: '行政区围栏' },
      ],
      form: {
        name: '',
        alarm: 'e_fence_in',
        alarmLabel: '入围栏',
        radius: 300,
        region: '',
      },
      alarmActions: ALARM_OPTIONS.map((o) => ({ name: o.name })),
    }
  },
  computed: {
    navTitle() {
      return this.deviceId || '创建围栏'
    },
    mapCircles() {
      if (this.fenceType !== 'e_type_circle') return []
      return [{
        latitude: this.mapCenter.latitude,
        longitude: this.mapCenter.longitude,
        radius: this.form.radius,
        color: '#e74c3c99',
        fillColor: '#e74c3c33',
        strokeWidth: 2,
      }]
    },
    mapPolylines() {
      if (this.fenceType !== 'e_type_polygon' || this.polygonPoints.length < 2) return []
      return [{
        points: this.polygonPoints,
        color: '#e74c3c',
        width: 3,
      }]
    },
    mapPolygons() {
      if (this.fenceType !== 'e_type_polygon' || this.polygonPoints.length < 3) return []
      return [{
        points: this.polygonPoints,
        strokeColor: '#e74c3c99',
        fillColor: '#e74c3c33',
        strokeWidth: 2,
      }]
    },
    fenceMapScale() {
      if (this.fenceType === 'e_type_circle') {
        return scaleForFenceRadius(this.form.radius)
      }
      return DEFAULT_MAP_SCALE
    },
  },
  watch: {
    fenceType(val, oldVal) {
      if (oldVal === 'e_type_polygon' && val !== 'e_type_polygon') {
        this.polygonPoints = []
      }
    },
  },
  onLoad(options) {
    if (options.deviceId) {
      this.deviceId = options.deviceId
    } else {
      const dev = uni.getStorageSync(STORAGE_KEY)
      this.deviceId = dev?.sn || dev?.imei || ''
    }
    this.loadMapCenter()
    this.initRegionColumns()
    if (options.id) {
      this.editId = options.id
      this.loadFence(options.id)
    }
  },
  methods: {
    loadMapCenter() {
      const dev = uni.getStorageSync(STORAGE_KEY)
      const lat = Number(dev?.latitude ?? dev?.lat)
      const lng = Number(dev?.longitude ?? dev?.lng)
      if (lat && lng) {
        this.mapCenter = { latitude: lat, longitude: lng }
      }
    },
    async loadFence(id) {
      try {
        const sn = this.deviceId || uni.getStorageSync(STORAGE_KEY)?.sn
        if (!sn) return
        const res = await getFenceList({ sn, limitSize: 50 })
        const item = normalizeFenceList(res).find((f) => String(f.id) === String(id))
        if (!item) return
        this.applyFenceItem(item)
      } catch (err) {
        uni.$u.toast(err?.message || '加载围栏失败')
      }
    },
    applyFenceItem(item) {
      this.fenceType = item.type || 'e_type_circle'
      this.form.name = item.name
      this.form.alarm = item.alarm || 'e_fence_in'
      this.form.alarmLabel = item.alarmLabel || '入围栏'
      this.form.radius = item.radius || 300
      this.syncRegionFromText(item.region || '')
      if (item.center?.latitude && item.center?.longitude) {
        this.mapCenter = {
          latitude: item.center.latitude,
          longitude: item.center.longitude,
        }
      }
      if (Array.isArray(item.polygonPoints)) {
        this.polygonPoints = item.polygonPoints.map((p) => ({
          latitude: p.latitude,
          longitude: p.longitude,
        }))
      }
    },
    onMapTap({ latitude, longitude }) {
      if (this.fenceType !== 'e_type_polygon') return
      if (!latitude || !longitude) return
      this.polygonPoints.push({ latitude, longitude })
    },
    onAlarmSelect(e) {
      const opt = ALARM_OPTIONS.find((o) => o.name === e.name)
      if (opt) {
        this.form.alarm = opt.value
        this.form.alarmLabel = opt.name
      }
      this.showAlarmPicker = false
    },
    syncRegionFromText(regionText) {
      const parts = String(regionText || '').split('/').map((s) => s.trim()).filter(Boolean)
      if (!parts.length) {
        this.form.region = ''
        this.regionIndexes = [0, 0, 0]
        this.regionColumns = buildRegionColumns(0, 0)
        return
      }
      this.form.region = parts.join('/')
      const { provinceIndex, cityIndex, areaIndex } = findRegionIndexes(parts[0], parts[1], parts[2])
      this.regionIndexes = [provinceIndex, cityIndex, areaIndex]
      this.regionColumns = buildRegionColumns(provinceIndex, cityIndex)
    },
    initRegionColumns() {
      if (this.form.region) {
        this.syncRegionFromText(this.form.region)
        return
      }
      const { provinceIndex, cityIndex } = findRegionIndexes('北京市', '', '')
      this.regionIndexes = [provinceIndex, cityIndex, 0]
      this.regionColumns = buildRegionColumns(provinceIndex, cityIndex)
    },
    openRegionPicker() {
      if (this.form.region) {
        this.syncRegionFromText(this.form.region)
      } else {
        this.initRegionColumns()
      }
      this.showRegionPicker = true
      this.$nextTick(() => {
        this.$refs.regionPickerRef?.setIndexs?.(this.regionIndexes, true)
      })
    },
    onRegionColumnChange(e) {
      const columnIndex = e?.columnIndex
      const indexs = e?.indexs || e?.indexes || []
      const picker = this.$refs.regionPickerRef
      if (!picker || columnIndex == null) return

      if (columnIndex === 0) {
        const provinceIndex = indexs[0] ?? 0
        const cityList = getCityListByProvinceIndex(provinceIndex)
        picker.setColumnValues(1, cityList)
        picker.setColumnValues(2, getAreaListByIndexes(provinceIndex, 0))
      } else if (columnIndex === 1) {
        const provinceIndex = indexs[0] ?? 0
        const cityIndex = indexs[1] ?? 0
        picker.setColumnValues(2, getAreaListByIndexes(provinceIndex, cityIndex))
      }
    },
    onRegionConfirm(e) {
      const value = e?.value || []
      const indexs = e?.indexs || e?.indexes || [0, 0, 0]
      this.regionIndexes = indexs
      this.form.region = formatRegionText({
        province: value[0]?.label || '',
        city: value[1]?.label || '',
        district: value[2]?.label || '',
      })
      this.showRegionPicker = false
    },
    onUndo() {
      if (!this.polygonPoints.length) {
        uni.$u.toast('暂无可撤销的顶点')
        return
      }
      this.polygonPoints.pop()
    },
    onClearPolygon() {
      this.polygonPoints = []
      uni.$u.toast('已清除')
    },
    async onSave() {
      if (!this.form.name.trim()) {
        uni.$u.toast('请输入围栏名称')
        return
      }
      if (this.fenceType === 'e_type_city' && !this.form.region) {
        uni.$u.toast('请选择省市区')
        return
      }
      if (this.fenceType === 'e_type_polygon' && this.polygonPoints.length < 3) {
        uni.$u.toast('请在地图上绘制至少3个顶点')
        return
      }

      const sn = this.deviceId || uni.getStorageSync(STORAGE_KEY)?.sn
      if (!sn) {
        uni.$u.toast('未找到设备号')
        return
      }

      if (this.editId) {
        uni.$u.toast('编辑围栏接口待对接')
        return
      }

      try {
        const payload = buildFenceCreateParams({
          name: this.form.name,
          type: this.fenceType,
          mapCenter: this.mapCenter,
          radius: this.form.radius,
          polygonPoints: this.polygonPoints,
          region: this.form.region,
          alarm: this.form.alarm,
        })
        payload.sn = sn
        await addFence(payload)
        uni.$u.toast('保存成功')
        setTimeout(() => uni.navigateBack(), 500)
      } catch (err) {
        uni.$u.toast(err?.message || '保存失败')
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.type-tabs {
  display: flex;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.type-tabs__item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.type-tabs__item--active {
  color: #3dba6e;
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

.form-panel {
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-row {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f5f5f5;
  min-height: 48rpx;
}

.form-row--click {
  justify-content: space-between;
}

.form-row--slider {
  gap: 16rpx;
}

.form-row__label {
  font-size: 30rpx;
  color: #333;
  flex-shrink: 0;
  width: 120rpx;
}

.form-row__input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  text-align: right;
}

.form-placeholder {
  color: #ccc;
}

.form-row__right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;
}

.form-row__value {
  font-size: 28rpx;
  color: #333;
}

.form-row__slider-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
  width: 100%;
  box-sizing: border-box;
}

.form-row__radius {
  font-size: 28rpx;
  color: #333;
  flex-shrink: 0;
  min-width: 100rpx;
  text-align: right;
}

.form-row__btns {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
}

.mini-btn {
  padding: 10rpx 28rpx;
  background: #3dba6e;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #fff;
}

.map-area {
  flex: 1;
  min-height: 420rpx;
  position: relative;
  overflow: hidden;
}

.fence-map {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.map-hint {
  position: absolute;
  bottom: 24rpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.5);
  padding: 12rpx 24rpx;
  border-radius: 8rpx;

  text {
    font-size: 24rpx;
    color: #fff;
  }
}

.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
  z-index: 10;
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
