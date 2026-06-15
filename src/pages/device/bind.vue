<template>
  <view class="page">
    <up-navbar title="绑定设备" :bg-color="THEME_GREEN" title-color="#fff" left-icon="arrow-left" left-icon-color="#fff"
      :auto-back="true" :placeholder="true" :safe-area-inset-top="true"></up-navbar>

    <scroll-view class="content" scroll-y>
      <view class="form-card">
        <view class="form-row">
          <text class="form-row__label">设备编号：</text>
          <input v-model="deviceNo" class="form-row__input" type="text" placeholder="请输入设备编号"
            placeholder-class="form-row__placeholder" />
          <view class="form-row__scan" @click="onScan">
            <up-icon name="scan" color="#666" size="22"></up-icon>
          </view>
        </view>
        <!-- <view class="form-row form-row--last">
          <text class="form-row__label">设备密码：</text>
          <input v-model="password" class="form-row__input" type="password" password placeholder="请输入设备密码"
            placeholder-class="form-row__placeholder" />
        </view> -->
      </view>

      <view class="submit-btn" @click="onBind">
        <text>绑定设备</text>
      </view>

      <view class="guide">
        <text class="guide__title">两种方式绑定设备：</text>

        <view class="guide-item">
          <view class="guide-item__num">
            <text>1</text>
          </view>
          <view class="guide-item__body">
            <text class="guide-item__text">
              在设备上找到一串设备号，输入设备号和密码
              <text class="guide-item__highlight">【默认密码:123456】</text>
              点击【绑定设备】按钮
            </text>

          </view>
        </view>
        <view class="guide-item__img guide-item__img--barcode">
          <text class="guide-item__img-label">16052198888</text>
        </view>
        <view class="guide-item">
          <view class="guide-item__num">
            <text>2</text>
          </view>
          <view class="guide-item__body">
            <text class="guide-item__text">
              点击输入框右侧图标对准设备的二维码扫描并且输入密码
              <text class="guide-item__highlight">【默认密码:123456】</text>
              点击【绑定设备】按钮
            </text>
          </view>
        </view>
        <view class="guide-item__img guide-item__img--qrcode">
          <image class="scan-img" src="/static/scan.png" mode="widthFix"></image>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { bindDevice } from '@/api/device'
import { THEME_GREEN } from '@/common/theme.js'

const DEFAULT_PASSWORD = ''
const STORAGE_KEY = 'currentDevice'

export default {
  data() {
    return {
      THEME_GREEN,
      deviceNo: '',
      password: DEFAULT_PASSWORD,
    }
  },
  methods: {
    onScan() {
      uni.scanCode({
        onlyFromCamera: false,
        scanType: ['qrCode', 'barCode'],
        success: (res) => {
          const result = (res.result || '').trim()
          if (result) {
            this.deviceNo = result
            uni.$u.toast('扫码成功')
          }
        },
        fail: (err) => {
          if (err?.errMsg && !/cancel/i.test(err.errMsg)) {
            uni.$u.toast('扫码失败')
          }
        },
      })
    },
    async onBind() {
      const sn = this.deviceNo.trim()
      const pwd = this.password.trim()
      if (!sn) {
        uni.$u.toast('请输入设备编号')
        return
      }
      // if (!pwd) {
      //   uni.$u.toast('请输入设备密码')
      //   return
      // }
      try {
        const data = await bindDevice({
          // password: pwd,
          sn,
        })
        const device = {
          sn,
          name: data?.name || data?.deviceName || sn,
          status: data?.status || '离线',
          statusType: 'offline',
        }
        uni.setStorageSync(STORAGE_KEY, device)
        uni.$u.toast('绑定成功')
        setTimeout(() => {
          const pages = getCurrentPages()
          if (pages.length > 1) {
            uni.navigateBack()
          } else {
            uni.switchTab({ url: '/pages/index/index' })
          }
        }, 400)
      } catch (e) {
        console.error('[bind device] failed:', e)
      }
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
  padding: 24rpx;
  box-sizing: border-box;
}

.form-card {
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 32rpx;
}

.form-row {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
  gap: 8rpx;

  &--last {
    border-bottom: none;
  }
}

.form-row__label {
  flex-shrink: 0;
  font-size: 28rpx;
  color: #333;
  width: 168rpx;
}

.form-row__input {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  color: #333;
}

.form-row__placeholder {
  color: #ccc;
  font-size: 28rpx;
}

.form-row__scan {
  flex-shrink: 0;
  padding: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn {
  height: 88rpx;
  background: #3dba6e;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;

  text {
    font-size: 32rpx;
    color: #fff;
    font-weight: 500;
  }
}

.guide {
  background: #fff;
  border-radius: 12rpx;
  padding: 32rpx 28rpx 48rpx;
}

.guide__title {
  font-size: 30rpx;
  font-weight: 600;
  color: #222;
  display: block;
  margin-bottom: 32rpx;
}

.guide-item {
  display: flex;
  gap: 20rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.guide-item__num {
  flex-shrink: 0;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: #3dba6e;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 26rpx;
    color: #fff;
    font-weight: 600;
  }
}

.guide-item__body {
  flex: 1;
  min-width: 0;
}

.guide-item__text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.7;
  display: block;
  margin-bottom: 20rpx;
}

.guide-item__highlight {
  color: #c0392b;
}

.guide-item__img {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  background: #fafafa;
  border: 1rpx dashed #e0e0e0;
  border-radius: 8rpx;
  margin-bottom: 10px;
}

.scan-img {
  width: 120rpx;
  height: 120rpx;
}


.guide-item__img--barcode {
  flex-direction: column;

  &::before {
    content: '';
    width: 280rpx;
    height: 80rpx;
    background: repeating-linear-gradient(90deg,
        #333 0,
        #333 4rpx,
        #fff 4rpx,
        #fff 8rpx);
  }
}

.guide-item__img-label {
  font-size: 24rpx;
  font-weight: bold;
  color: #333;
  letter-spacing: 2rpx;
}

.guide-item__img--qrcode {
  padding: 32rpx;
}

.qrcode-mock {
  width: 160rpx;
  height: 160rpx;
  background:
    linear-gradient(90deg, #333 50%, transparent 50%),
    linear-gradient(#333 50%, transparent 50%);
  background-size: 16rpx 16rpx;
  border: 8rpx solid #333;
  box-sizing: border-box;
}
</style>
