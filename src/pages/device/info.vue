<template>
  <view class="page">
    <up-navbar title="设备信息" :bg-color="THEME_GREEN" title-color="#fff" left-icon="arrow-left" left-icon-color="#fff"
      :auto-back="true" :placeholder="true" :safe-area-inset-top="true"></up-navbar>

    <scroll-view class="content" scroll-y>
      <view class="form-list">
        <view class="form-row">
          <text class="form-row__label">设备名称</text>
          <input v-model="form.deviceName" class="form-row__input" type="text" placeholder="请输入设备名称" />
        </view>

        <view class="form-row">
          <text class="form-row__label">设备号</text>
          <view class="form-row__value-container">
            <text class="form-row__value">{{ form.deviceNo }}</text>
            <view class="form-row__copy" @click="onCopy(form.deviceNo, '设备号')">复制</view>
          </view>
        </view>

        <view class="form-row">
          <text class="form-row__label">设备型号</text>
          <text class="form-row__value">{{ form.model }}</text>
        </view>

        <view class="form-row">
          <text class="form-row__label">设备状态</text>
          <text class="form-row__value">{{ form.status }}</text>
        </view>

        <view class="form-row">
          <text class="form-row__label">定位时间</text>
          <text class="form-row__value">{{ form.locateTime }}</text>
        </view>

        <view class="form-row">
          <text class="form-row__label">SIM卡号</text>
          <text class="form-row__value">{{ form.simNo }}</text>
        </view>

        <view class="form-row">
          <text class="form-row__label">ICCID号</text>
          <view class="form-row__value-container">
            <text class="form-row__value">{{ form.iccid }}</text>
            <view class="form-row__copy" @click="onCopy(form.iccid, 'ICCID号')">复制</view>
          </view>
        </view>

        <view class="form-row">
          <text class="form-row__label">联系人</text>
          <input v-model="form.contact" class="form-row__input" type="text" placeholder="请输入联系人" />
        </view>

        <view class="form-row">
          <text class="form-row__label">联系人电话</text>
          <input v-model="form.contactPhone" class="form-row__input" type="number" placeholder="请输入联系人电话" />
        </view>

        <view class="form-row form-row--top">
          <text class="form-row__label">定位</text>
          <text class="form-row__value form-row__value--multi">{{ form.address }}</text>
        </view>

        <view class="form-row">
          <text class="form-row__label">经纬度</text>
          <view class="form-row__value-container">
            <text class="form-row__value">{{ form.coordinate }}</text>
            <view class="form-row__copy" @click="onCopy(form.coordinate, '经纬度')">复制</view>
          </view>
        </view>

        <view class="form-row" @click="onPickIcon">
          <text class="form-row__label">设备图标</text>
          <view class="form-row__icon">
            <image :src="carImg" mode="widthFix" class="device-icon"></image>
            <text class="form-row__value">{{ form.iconLabel }}</text>
            <!-- <up-icon name="arrow-right" color="#ccc" size="14"></up-icon> -->
          </view>
        </view>

        <view class="form-row form-row--last">
          <text class="form-row__label">LBS</text>
          <view class="form-row__value-container">
            <view></view>
            <up-switch v-model="form.lbsOn" :active-color="THEME_GREEN" size="22"></up-switch>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="footer-bar">
      <view class="footer-bar__btn" @click="onSave">
        <text>保存</text>
      </view>
    </view>
  </view>
</template>

<script>
import dayjs from 'dayjs'
import { THEME_GREEN } from '@/common/theme.js'
import { staticUrl } from '@/common/assets.js'
import { getDeviceDetail, getSimDetail } from '@/api/device'

const STORAGE_KEY = 'currentDevice'

function formatDeviceStatus(res) {
  if (res?.state === 'e_line_sleep') return '静止'
  if (res?.state === 'e_line_down' || res?.onlineStatus === 0) return '离线'
  if (res?.state === 'e_line_on' || res?.onlineStatus === 1) return '在线'
  return res?.status || '离线'
}

export default {
  data() {
    return {
      THEME_GREEN,
      carImg: staticUrl('/static/car.png'),
      deviceSn: '',
      form: {
        deviceName: '',
        deviceNo: '',
        model: '-',
        status: '-',
        locateTime: '-',
        simNo: '-',
        iccid: '-',
        contact: '',
        contactPhone: '',
        address: '-',
        coordinate: '-',
        iconLabel: '默认',
        lbsOn: true,
      },
    }
  },
  onLoad(options) {
    const dev = uni.getStorageSync(STORAGE_KEY)
    this.deviceSn = dev?.sn || options.deviceId || ''
    if (options.updateTime) {
      this.form.locateTime = decodeURIComponent(options.updateTime)
    }
    this.loadSaved()
    this.loadDetail()
  },
  methods: {
    storageKey() {
      return `device_info_${this.form.deviceNo || this.deviceSn}`
    },
    async loadDetail() {
      if (!this.deviceSn) return
      try {
        const res = await getDeviceDetail({ sn: this.deviceSn })
        const lastPos = res.last_pos || {}
        const sn = res.imei || res.sn || this.deviceSn
        this.form.deviceNo = sn
        this.form.deviceName = res.alias || sn
        this.form.model = res.model || res.jtDeviceModel || res.ver || '-'
        this.form.status = formatDeviceStatus(res)
        if (res.last_com_time) {
          this.form.locateTime = dayjs.unix(Number(res.last_com_time)).format('YYYY/MM/DD HH:mm:ss')
        }
        if (lastPos.wgs) {
          const parts = String(lastPos.wgs).split(',')
          if (parts.length >= 2) {
            this.form.coordinate = `${parts[1]},${parts[0]}`
          }
        }
        this.form.address = lastPos.addr || res.address || '-'
        if (res.iccid) this.form.iccid = res.iccid
        try {
          const sim = await getSimDetail({ sn: this.deviceSn })
          if (sim?.iccid) this.form.iccid = sim.iccid
          if (sim?.sim_no ?? sim?.simNo) this.form.simNo = sim.sim_no ?? sim.simNo
        } catch {
          // SIM 仅 iotdoc 通道可用，忽略失败
        }
      } catch (e) {
        uni.$u?.toast?.(e?.message || '加载设备信息失败')
      }
    },
    loadSaved() {
      const saved = uni.getStorageSync(this.storageKey())
      if (!saved || typeof saved !== 'object') return
      if (saved.deviceName) this.form.deviceName = saved.deviceName
      if (saved.contact !== undefined) this.form.contact = saved.contact
      if (saved.contactPhone !== undefined) this.form.contactPhone = saved.contactPhone
      if (saved.lbsOn !== undefined) this.form.lbsOn = saved.lbsOn
      if (saved.iconLabel) this.form.iconLabel = saved.iconLabel
    },
    onCopy(text, label) {
      if (!text || text === '-') {
        uni.$u.toast('暂无内容')
        return
      }
      uni.setClipboardData({
        data: String(text),
        success: () => {
          uni.$u.toast(`${label}已复制`)
        },
      })
    },
    onPickIcon() {
      uni.$u.toast('设备图标')
    },
    onSave() {
      if (!this.form.deviceName.trim()) {
        uni.$u.toast('请输入设备名称')
        return
      }
      const payload = {
        deviceName: this.form.deviceName.trim(),
        contact: this.form.contact.trim(),
        contactPhone: this.form.contactPhone.trim(),
        lbsOn: this.form.lbsOn,
        iconLabel: this.form.iconLabel,
      }
      uni.setStorageSync(this.storageKey(), payload)
      // TODO: 对接设备信息保存接口
      uni.$u.toast('保存成功')
      setTimeout(() => uni.navigateBack(), 400)
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

.content {
  flex: 1;
  height: 0;
}

.form-list {
  background: #fff;
}

.form-row {
  display: flex;
  align-items: center;
  padding: 20rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  gap: 16rpx;
}

.form-row--top {
  align-items: flex-start;
}

.form-row--last {
  border-bottom: none;
}

.form-row__label {
  width: 180rpx;
  flex-shrink: 0;
  font-size: 28rpx;
  color: #333;
}

.form-row__value-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-row__value {
  font-size: 28rpx;
  color: #666;
}

.form-row__value--multi {
  line-height: 1.6;
  text-align: left;
}

.form-row__value--ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-row__input {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  color: #333;
}

.form-row__copy {
  flex-shrink: 0;
  padding: 4rpx 20rpx;
  border: 2rpx solid #3dba6e;
  border-radius: 8rpx;
  color: #3dba6e;
  font-size: 24rpx;
}

.form-row__icon {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12rpx;
  image{
    width: 60rpx;
  }
}

.device-icon {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
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
