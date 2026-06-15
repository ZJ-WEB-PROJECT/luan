<template>
  <view class="page">
    <up-navbar title="卡" :bg-color="THEME_GREEN" title-color="#fff" left-icon="arrow-left" left-icon-color="#fff"
      :auto-back="true" :placeholder="true" :safe-area-inset-top="true"></up-navbar>

    <view class="search-bar">
      <input v-model="searchIccid" class="search-bar__input" type="text" placeholder="请输入ICCID" confirm-type="search"
        @confirm="onSearch" />
      <view class="search-bar__btn" @click="onSearch">
        <text>查询</text>
      </view>
    </view>

    <scroll-view class="content" scroll-y>
      <view class="info-card">
        <text class="info-card__title">卡片信息</text>

        <view v-for="row in displayRows" :key="row.key" class="info-row">
          <view class="info-row__main">
            <text class="info-row__label">{{ row.label }}：</text>
            <text class="info-row__value">{{ row.value }}</text>
          </view>
          <view v-if="row.copyable" class="info-row__copy" @click="onCopy(row.value, row.label)">
            <text>复制</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="footer-bar">
      <view class="footer-bar__btn" @click="onRecharge">
        <text>充值</text>
      </view>
    </view>
  </view>
</template>

<script>
import { THEME_GREEN } from '@/common/theme.js'
import { getSimDetail } from '@/api/device'
const DEFAULT_ICCID = '89860840102490118041'

export default {
  data() {
    return {
      THEME_GREEN,
      deviceId: '',
      searchIccid: DEFAULT_ICCID,
      cardInfo: {
        iccid: DEFAULT_ICCID,
        cardNo: '1442102808041',
        status: '正常',
        usedFlow: '4.06MB',
        totalFlow: '30MB',
        activateTime: '2024/06/11 00:00:00',
        expireTime: '2027/05/27 00:00:00',
      },
    }
  },
  computed: {
    displayRows() {
      const c = this.cardInfo
      return [
        { key: 'iccid', label: 'ICCID', value: c.iccid, copyable: true },
        { key: 'cardNo', label: '卡号', value: c.cardNo, copyable: true },
        { key: 'status', label: '卡状态', value: c.status, copyable: false },
        { key: 'usedFlow', label: '已用流量', value: c.usedFlow, copyable: false },
        { key: 'totalFlow', label: '套餐总流量', value: c.totalFlow, copyable: false },
        { key: 'activateTime', label: '激活时间', value: c.activateTime, copyable: false },
        { key: 'expireTime', label: '服务到期时间', value: c.expireTime, copyable: false },
      ]
    },
  },
  onLoad() {
    this.deviceId = uni.getStorageSync('currentDevice').sn
    this.getSimDetail()
  },
  methods: {
    getSimDetail() {
      getSimDetail({
        sn: this.deviceId,
      }).then(res => {
        console.log(res)
      })
    },
    onSearch() {
      const iccid = this.searchIccid.trim()
      if (!iccid) {
        uni.$u.toast('请输入ICCID')
        return
      }
      // TODO: 对接 SIM 卡查询接口
      this.cardInfo.iccid = iccid
      uni.$u.toast('查询成功')
    },
    onCopy(text, label) {
      uni.setClipboardData({
        data: String(text),
        success: () => {
          uni.$u.toast(`${label}已复制`)
        },
      })
    },
    onRecharge() {
      const iccid = encodeURIComponent(this.cardInfo.iccid || this.searchIccid)
      const deviceId = this.deviceId ? `&deviceId=${this.deviceId}` : ''
      uni.navigateTo({
        url: `/pages/recharge/recharge?iccid=${iccid}${deviceId}`,
      })
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
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background: #fff;
  flex-shrink: 0;
}

.search-bar__input {
  flex: 1;
  height: 72rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
  color: #333;
  background: #fff;
}

.search-bar__btn {
  flex-shrink: 0;
  height: 72rpx;
  padding: 0 36rpx;
  background: #3dba6e;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 28rpx;
    color: #fff;
  }
}

.content {
  flex: 1;
  height: 0;
  padding: 0 24rpx 24rpx;
  box-sizing: border-box;
}

.info-card {
  background: #fff;
}

.info-card__title {
  font-size: 32rpx;
  font-weight: 600;
  color: #222;
  display: block;
  padding: 16rpx 0 24rpx;
}

.info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 10rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  gap: 16rpx;

  &:last-child {
    border-bottom: none;
  }
}

.info-row__main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.info-row__label {
  font-size: 26rpx;
  color: #999;
}

.info-row__value {
  font-size: 28rpx;
  color: #333;
  word-break: break-all;
}

.info-row__copy {
  flex-shrink: 0;
  padding: 5rpx 20rpx;
  border: 2rpx solid #3dba6e;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 24rpx;
    color: #3dba6e;
  }
}

.footer-bar {
  flex-shrink: 0;
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
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
