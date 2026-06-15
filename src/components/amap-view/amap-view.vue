<template>
  <view class="amap-view">
    <!-- #ifdef H5 -->
    <view :id="mapContainerId" class="amap-view__canvas"></view>
    <!-- #endif -->

    <!-- #ifndef H5 -->
    <map :id="mapNativeId" class="amap-view__canvas" :latitude="centerLat" :longitude="centerLng" :scale="scale"
      :markers="nativeMarkers" :polyline="nativePolylines" :circles="nativeCircles" :polygons="nativePolygons"
      :show-location="showMyLocation || nativeShowLocation" :enable-traffic="trafficOn" :enable-satellite="satelliteOn"
      enable-zoom enable-scroll enable-rotate @tap="onNativeMapTap" @updated="onMapUpdated" />
    <!-- #endif -->

    <view v-if="showTools" class="amap-view__tools">
      <view v-for="tool in mapTools" :key="tool.key" class="amap-view__tool" @click="onToolClick(tool)">
        <up-icon :name="tool.icon" :color="toolIconColor(tool)" size="22"></up-icon>
      </view>
    </view>

    <view v-if="loadError" class="amap-view__error">
      <text class="amap-view__error-text">{{ loadError }}</text>
    </view>

  </view>
</template>

<script>
import { loadAmap, getCurrentLocation, openAmapNavigation } from '@/common/amap'
import { AMAP_KEY, DEFAULT_MAP_SCALE } from '@/common/amap-config'

const MAP_TOOLS = [
  { icon: 'grid', label: '图层', key: 'layer' },
  { icon: 'car', label: '路况', key: 'traffic' },
  { icon: 'wifi', label: 'GPS', key: 'locate' },
  { icon: 'map', label: '定位', key: 'gps' },
  { icon: 'arrow-rightward', label: '导航', key: 'nav' },
]

export default {
  name: 'AmapView',
  props: {
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    scale: { type: Number, default: DEFAULT_MAP_SCALE },
    markerTitle: { type: String, default: '设备位置' },
    markerIcon: { type: String, default: '' },
    markerWidth: { type: Number, default: 28 },
    markerHeight: { type: Number, default: 36 },
    address: { type: String, default: '' },
    showMyLocation: { type: Boolean, default: false },
    showTools: { type: Boolean, default: true },
    markers: { type: Array, default: () => [] },
    polyline: { type: Array, default: () => [] },
    circles: { type: Array, default: () => [] },
    polygons: { type: Array, default: () => [] },
  },
  emits: ['ready', 'error', 'located', 'tap'],
  data() {
    const uid = `amap_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    return {
      mapContainerId: `${uid}_h5`,
      mapNativeId: `${uid}_native`,
      innerLat: 29.7052,
      innerLng: 115.9928,
      centerLat: 29.7052,
      centerLng: 115.9928,
      nativeShowLocation: false,
      loadError: '',
      trafficOn: false,
      satelliteOn: false,
      mapInstance: null,
      amapMarker: null,
      trafficLayer: null,
      myLocation: null,
      h5TrackPolyline: null,
      h5ExtraMarkers: [],
      h5Circles: [],
      h5Polygons: [],
    }
  },
  computed: {
    mapTools() {
      return MAP_TOOLS
    },
    nativeMarkers() {
      const list = []
      if (this.innerLat && this.innerLng) {
        const marker = {
          id: 1,
          latitude: this.innerLat,
          longitude: this.innerLng,
          title: this.markerTitle,
          width: this.markerWidth,
          height: this.markerHeight,
          anchor: { x: 0.5, y: 1 },
          callout: {
            content: this.markerTitle,
            display: 'BYCLICK',
            padding: 8,
            borderRadius: 6,
            fontSize: 12,
          },
        }
        if (this.markerIcon) {
          marker.iconPath = this.markerIcon
        }
        list.push(marker)
      }
      if (this.markers?.length) {
        const ext = this.markers.map((marker, idx) => ({
          ...marker,
          id: marker.id ?? idx + 100,
        }))
        list.push(...ext)
      }
      return list
    },
    nativePolylines() {
      return this.polyline || []
    },
    nativeCircles() {
      return (this.circles || []).map((item) => ({
        latitude: item.latitude,
        longitude: item.longitude,
        radius: item.radius,
        color: item.color || '#e74c3c99',
        fillColor: item.fillColor || '#e74c3c33',
        strokeWidth: item.strokeWidth || 2,
      }))
    },
    nativePolygons() {
      return (this.polygons || []).map((item) => ({
        points: item.points || [],
        strokeWidth: item.strokeWidth || 2,
        strokeColor: item.strokeColor || '#e74c3c99',
        fillColor: item.fillColor || '#e74c3c33',
      })).filter((item) => item.points.length >= 3)
    },
  },
  watch: {
    latitude: {
      immediate: true,
      handler(v) {
        if (v) {
          this.innerLat = v
          this.centerLat = v
        }
        this.syncCenter()
      },
    },
    longitude: {
      immediate: true,
      handler(v) {
        if (v) {
          this.innerLng = v
          this.centerLng = v
        }
        this.syncCenter()
      },
    },
    scale() {
      this.syncCenter()
    },
    markers: {
      deep: true,
      handler() {
        this.syncH5TrackOverlays()
      },
    },
    polyline: {
      deep: true,
      handler() {
        this.syncH5TrackOverlays()
      },
    },
    circles: {
      deep: true,
      handler() {
        this.syncH5FenceOverlays()
      },
    },
    polygons: {
      deep: true,
      handler() {
        this.syncH5FenceOverlays()
      },
    },
  },
  mounted() {
    // #ifdef H5
    this.$nextTick(() => this.initH5Map())
    // #endif
    // #ifndef H5
    this.$emit('ready', { platform: 'native' })
    // #endif
  },
  beforeUnmount() {
    // #ifdef H5
    if (this.mapInstance) {
      this.mapInstance.off('click', this.onH5MapClick)
      this.mapInstance.destroy()
      this.mapInstance = null
    }
    // #endif
  },
  methods: {
    syncCenter() {
      // #ifdef H5
      if (!this.mapInstance || !this.innerLng || !this.innerLat) return
      const center = [this.innerLng, this.innerLat]
      this.mapInstance.setZoomAndCenter(this.scale, center)
      if (this.amapMarker) {
        this.amapMarker.setPosition(center)
      }
      // #endif

      // #ifndef H5
      this.setNativeCenter(this.innerLat, this.innerLng)
      // #endif
    },

    getMapContext() {
      return uni.createMapContext(this.mapNativeId, this)
    },

    /** 小程序 map：通过更新中心点移动视野（moveToLocation 仅支持移到用户定位点） */
    setNativeCenter(latitude, longitude) {
      if (!latitude || !longitude) return
      this.centerLat = latitude
      this.centerLng = longitude
    },

    /** 小程序 map：移到用户当前定位点，需 show-location 且已授权 */
    moveToUserLocation() {
      this.nativeShowLocation = true
      this.$nextTick(() => {
        const ctx = this.getMapContext()
        ctx?.moveToLocation?.({
          success: () => {},
          fail: (err) => {
            console.warn('[amap-view] moveToLocation failed:', err)
          },
        })
      })
    },

    waitMapContainer(maxTry = 20) {
      return new Promise((resolve, reject) => {
        let n = 0
        const tick = () => {
          const el = document.getElementById(this.mapContainerId)
          if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
            resolve(el)
            return
          }
          if (n++ >= maxTry) {
            reject(new Error('地图容器未就绪，请稍后重试'))
            return
          }
          setTimeout(tick, 50)
        }
        tick()
      })
    },

    async initH5Map() {
      // #ifdef H5
      if (!AMAP_KEY) {
        this.loadError = '请配置 .env.production 中的 VITE_AMAP_KEY 并重启 npm run dev:h5'
        this.$emit('error', new Error(this.loadError))
        return
      }
      try {
        await this.$nextTick()
        const container = await this.waitMapContainer()
        const AMap = await loadAmap()
        const center = [this.innerLng, this.innerLat]
        this.mapInstance = new AMap.Map(container, {
          zoom: this.scale,
          center,
          viewMode: '2D',
          resizeEnable: true,
        })
        this.amapMarker = new AMap.Marker({
          position: center,
          title: this.markerTitle,
          anchor: 'bottom-center',
        })
        if (this.markerIcon) {
          this.amapMarker.setIcon(new AMap.Icon({
            image: this.markerIcon,
            size: new AMap.Size(this.markerWidth, this.markerHeight),
            imageSize: new AMap.Size(this.markerWidth, this.markerHeight),
          }))
        }
        this.mapInstance.add(this.amapMarker)
        this.mapInstance.on('click', this.onH5MapClick)
        this.syncH5TrackOverlays()
        this.syncH5FenceOverlays()
        this.loadError = ''
        this.$emit('ready', { platform: 'h5', map: this.mapInstance })
      } catch (e) {
        this.loadError = e.message || '地图加载失败'
        this.$emit('error', e)
        console.error('[amap-view] init failed:', e)
      }
      // #endif
    },

    syncH5TrackOverlays() {
      // #ifdef H5
      if (!this.mapInstance || !window.AMap) return

      if (this.h5TrackPolyline) {
        this.mapInstance.remove(this.h5TrackPolyline)
        this.h5TrackPolyline = null
      }
      if (this.h5ExtraMarkers?.length) {
        this.mapInstance.remove(this.h5ExtraMarkers)
        this.h5ExtraMarkers = []
      }

      const firstPolyline = this.polyline?.[0]
      if (firstPolyline?.points?.length) {
        const path = firstPolyline.points.map((point) => [point.longitude, point.latitude])
        this.h5TrackPolyline = new window.AMap.Polyline({
          path,
          strokeColor: firstPolyline.color || '#3dba6e',
          strokeWeight: firstPolyline.width || 6,
          strokeStyle: firstPolyline.dottedLine ? 'dashed' : 'solid',
          showDir: !!firstPolyline.arrowLine,
        })
        this.mapInstance.add(this.h5TrackPolyline)
      }

      if (this.markers?.length) {
        this.h5ExtraMarkers = this.markers
          .filter((marker) => marker.latitude && marker.longitude)
          .map((marker) => new window.AMap.Marker({
            position: [marker.longitude, marker.latitude],
            title: marker.title || '',
            anchor: 'bottom-center',
            label: marker.callout?.content
              ? {
                content: `<div style="padding:2px 6px;background:rgba(61,186,110,.92);color:#fff;border-radius:10px;font-size:12px;">${marker.callout.content}</div>`,
                direction: 'top',
              }
              : undefined,
          }))
        if (this.h5ExtraMarkers.length) {
          this.mapInstance.add(this.h5ExtraMarkers)
        }
      }
      // #endif
    },

    syncH5FenceOverlays() {
      // #ifdef H5
      if (!this.mapInstance || !window.AMap) return

      if (this.h5Circles?.length) {
        this.mapInstance.remove(this.h5Circles)
        this.h5Circles = []
      }
      if (this.h5Polygons?.length) {
        this.mapInstance.remove(this.h5Polygons)
        this.h5Polygons = []
      }

      this.h5Circles = (this.circles || [])
        .filter((item) => item.latitude && item.longitude && item.radius)
        .map((item) => new window.AMap.Circle({
          center: [item.longitude, item.latitude],
          radius: item.radius,
          strokeColor: item.color || '#e74c3c',
          strokeOpacity: 0.8,
          strokeWeight: item.strokeWidth || 2,
          fillColor: item.fillColor || '#e74c3c',
          fillOpacity: 0.25,
        }))
      if (this.h5Circles.length) {
        this.mapInstance.add(this.h5Circles)
      }

      this.h5Polygons = (this.polygons || [])
        .filter((item) => item.points?.length >= 3)
        .map((item) => new window.AMap.Polygon({
          path: item.points.map((point) => [point.longitude, point.latitude]),
          strokeColor: item.strokeColor || '#e74c3c',
          strokeOpacity: 0.8,
          strokeWeight: item.strokeWidth || 2,
          fillColor: item.fillColor || '#e74c3c',
          fillOpacity: 0.25,
        }))
      if (this.h5Polygons.length) {
        this.mapInstance.add(this.h5Polygons)
      }
      // #endif
    },

    onNativeMapTap(e) {
      const { latitude, longitude } = e?.detail || {}
      if (!latitude || !longitude) return
      this.$emit('tap', { latitude, longitude })
    },

    onH5MapClick(e) {
      // #ifdef H5
      const lat = e?.lnglat?.lat
      const lng = e?.lnglat?.lng
      if (lat == null || lng == null) return
      this.$emit('tap', { latitude: lat, longitude: lng })
      // #endif
    },

    /** 定位到设备标记 */
    locateDevice() {
      // #ifndef H5
      this.setNativeCenter(this.innerLat, this.innerLng)
      // #endif
      this.syncCenter()
    },

    /** 定位到当前用户位置 */
    async locateMe() {
      try {
        const pos = await getCurrentLocation()
        this.myLocation = pos
        // #ifdef H5
        if (this.mapInstance) {
          this.mapInstance.setZoomAndCenter(this.scale, [pos.longitude, pos.latitude])
        }
        // #endif
        // #ifndef H5
        this.setNativeCenter(pos.latitude, pos.longitude)
        this.moveToUserLocation()
        // #endif
        return pos
      } catch (e) {
        if (uni.$u?.toast) {
          uni.$u.toast('获取位置失败，请授权定位')
        } else {
          uni.showToast({ title: '获取位置失败', icon: 'none' })
        }
        throw e
      }
    },

    /** 切换路况图层 */
    toggleTraffic() {
      // #ifdef H5
      if (!this.mapInstance || !window.AMap) return this.trafficOn
      if (!this.trafficLayer) {
        this.trafficLayer = new window.AMap.TileLayer.Traffic({ zIndex: 10 })
        this.mapInstance.add(this.trafficLayer)
        this.trafficOn = true
      } else {
        this.trafficOn = !this.trafficOn
        if (this.trafficOn) this.trafficLayer.show()
        else this.trafficLayer.hide()
      }
      return this.trafficOn
      // #endif

      // #ifndef H5
      this.trafficOn = !this.trafficOn
      return this.trafficOn
      // #endif
    },

    /** 切换卫星/标准图层（H5） */
    toggleSatellite() {
      // #ifdef H5
      if (!this.mapInstance || !window.AMap) return
      const isSat = this.satelliteOn
      if (!this._satelliteLayer) {
        this._satelliteLayer = new window.AMap.TileLayer.Satellite()
        this.mapInstance.add(this._satelliteLayer)
        this.satelliteOn = true
      } else if (isSat) {
        this._satelliteLayer.hide()
        this.satelliteOn = false
      } else {
        this._satelliteLayer.show()
        this.satelliteOn = true
      }
      return this.satelliteOn
      // #endif

      // #ifndef H5
      this.satelliteOn = !this.satelliteOn
      return this.satelliteOn
      // #endif
    },

    onMapUpdated() {
      // native map render callback
    },

    toolIconColor(tool) {
      if (tool.key === 'layer' && this.satelliteOn) return '#3dba6e'
      if (tool.key === 'traffic' && this.trafficOn) return '#3dba6e'
      return '#333'
    },

    toast(msg) {
      if (uni.$u?.toast) {
        uni.$u.toast(msg)
      } else {
        uni.showToast({ title: msg, icon: 'none' })
      }
    },

    onToolClick(tool) {
      const key = tool.key
      if (key === 'traffic') {
        const on = this.toggleTraffic()
        this.toast(on ? '路况已开启' : '路况已关闭')
        return
      }
      if (key === 'layer') {
        const on = this.toggleSatellite()
        this.toast(on ? '卫星图' : '标准地图')
        return
      }
      if (key === 'gps') {
        this.locateMe()
          .then((pos) => {
            this.$emit('located', pos)
            this.toast('已定位到当前位置')
          })
          .catch(() => { })
        return
      }
      if (key === 'locate') {
        this.locateDevice()
        this.toast('已定位到设备')
        return
      }
      if (key === 'nav') {
        openAmapNavigation({
          longitude: this.innerLng,
          latitude: this.innerLat,
          name: this.markerTitle,
          address: this.address,
        })
        return
      }
      this.toast(tool.label)
    },
  },
}
</script>

<style lang="scss" scoped>
.amap-view {
  position: relative;
  width: 100%;
  height: 100%;
}

.amap-view__canvas {
  width: 100%;
  height: 100%;
}

.amap-view__error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #c5dce8 0%, #dfeef5 40%, #e8f0e8 100%);
  padding: 32rpx;
  z-index: 1;
}

.amap-view__error-text {
  font-size: 26rpx;
  color: #666;
  text-align: center;
  line-height: 1.5;
}

.amap-view__tools {
  position: absolute;
  right: 24rpx;
  top: calc(var(--status-bar-height) + 120rpx);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  z-index: 2;
}

.amap-view__tool {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}
</style>
