<template>
  <view class="page">
    <view class="header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="header__nav">
        <view class="header__back" @click="goBack">
          <up-icon name="arrow-left" color="#fff" size="20"></up-icon>
        </view>
        <text class="header__title">增值服务</text>
        <view class="header__placeholder"></view>
      </view>
      <view class="user-block">
        <view class="user-avatar">
          <up-icon name="account-fill" color="#ccc" size="40"></up-icon>
        </view>
        <view class="user-info">
          <text class="user-info__phone">{{ user.mobile }}</text>
          <!-- <view class="user-info__row">
            <up-icon name="phone-fill" color="rgba(255,255,255,0.8)" size="14"></up-icon>
            <text class="user-info__sub">{{ bindPhone }}</text>
          </view> -->
          <text class="user-info__device">设备号: {{ deviceId }}</text>
        </view>
      </view>

      <view class="tab-bar">
        <view v-for="tab in tabs" :key="tab.key" class="tab-bar__item"
          :class="{ 'tab-bar__item--active': activeTab === tab.key }" @click="onMainTabChange(tab.key)">
          <text>{{ tab.label }}</text>
        </view>
      </view>
    </view>

    <scroll-view class="content" scroll-y :style="{ height: scrollHeight }">
      <text v-if="activeTab !== 'alarm'" class="content-subtitle">{{ tabSubtitle }}</text>
      <!-- 告警子 Tab -->
      <view v-if="activeTab === 'alarm'" class="alarm-subtabs">
        <view v-for="sub in alarmSubTabs" :key="sub.key" class="alarm-subtabs__item"
          :class="{ 'alarm-subtabs__item--active': alarmSubTab === sub.key }" @click="onAlarmSubChange(sub.key)">
          <text>{{ sub.label }}</text>
        </view>
      </view>
      <!-- 当前套餐状态 -->
      <view class="card card--current">
        <text class="card__title">当前套餐</text>
        <template v-if="activeTab === 'alarm'">
          <view class="alarm-status">
            <view class="alarm-status__head">
              <text class="alarm-status__hint">套餐用量</text>
              <text class="alarm-status__text">
                剩余<text class="alarm-status__num">{{ alarmStatus.remain }}</text>条/共<text class="alarm-status__num">{{
                  alarmStatus.total }}</text>条
              </text>
            </view>
            <view class="alarm-progress">
              <view class="alarm-progress__fill" :style="{ width: alarmStatus.percent + '%' }">
                <text v-if="alarmStatus.percent >= 30" class="alarm-progress__label">{{ alarmStatus.percent }}%</text>
              </view>
            </view>
          </view>
        </template>
        <template v-else>
          <text class="card__desc">{{ currentPackage.remark }}</text>
          <text class="card__expire" v-if="user.positionExpireTime">过期时间：{{ user.positionExpireTime }}</text>
          <text class="card__expire" v-else>当前无服务信息</text>
        </template>
      </view>

      <!-- 套餐选择 -->
      <view class="card">
        <text class="section__title section__title--in">当前套餐</text>
        <view class="package-list">
          <view v-for="(pkg, index) in currentPackages" :key="pkg.key" class="package-card"
            :class="packageCardClass(index)" @click="selectedIndex = index">
            <text class="package-card__name" :style="packageNameStyle(index)">{{ pkg.name }}</text>
            <text class="package-card__price" :style="packageNameStyle(index)">¥{{ pkg.discountPriceCent / 100 }}</text>
            <text v-if="pkg.discountPriceCent" :style="packageNameStyle(index)" class="package-card__origin">¥{{ pkg.priceCent / 100 }}</text>
          </view>
        </view>
      </view>

      <!-- 支付方式 -->
      <view class="card">
        <text class="section__title section__title--in">支付方式</text>
        <view class="pay-row">
          <view class="pay-row__left">
            <view class="pay-wechat">
              <up-icon name="weixin-fill" color="#fff" size="22"></up-icon>
            </view>
            <text>微信支付</text>
          </view>
          <up-icon name="checkmark-circle-fill" color="#3dba6e" size="22"></up-icon>
        </view>
      </view>

      <!-- 套餐内容 -->
      <view class="card card--plain">
        <view class="plain-block">
          <text class="plain-block__label">套餐内容：</text>
          <view class="list-text">{{ currentPackage.content }}</view>
        </view>
        <view class="plain-block">
          <text class="plain-block__label">购买说明：</text>
          <view class="list-text">{{ currentPackage.description }}</view>
        </view>
        <view class="service-link">
          <text>对订单有任何疑问，请联系</text>
          <text class="service-link__btn" @click="onService">在线客服</text>
        </view>
      </view>

      <view class="content__bottom-space"></view>
    </scroll-view>

    <view class="footer-bar">
      <view class="footer-bar__btn" @click="onPay">
        <text>确定并支付¥{{ selectedPrice }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { THEME_GREEN } from '@/common/theme.js'
import { getGoodsList, createOrder } from '@/api/order'
import { requestWechatPay } from '@/common/wx-pay'
const PURCHASE_NOTES = [
  '此为虚拟商品，一经售出概不退款',
  '此套餐只能用于此设备，切换到其他设备需要重新购买',
]

export default {
  data() {
    return {
      THEME_GREEN,
      statusBarHeight: 20,
      scrollHeight: 'auto',
      user: {},
      bindPhone: '15070005007',
      deviceId: '',
      activeTab: 'position',
      alarmSubTab: 'alarm_wechat',
      selectedIndex: 0,
      tabs: [
        { key: 'position', label: '秒定服务' },
        { key: 'share', label: '分享服务' },
        { key: 'alarm', label: '告警服务' },
      ],
      goodsList: [],
      alarmSubTabs: [
        { key: 'alarm_wechat', label: '微信告警' },
        { key: 'alarm_phone', label: '电话告警' },
        { key: 'alarm_sms', label: '短信告警' },
      ],
      tabData: {
        position: {
          status: {
            desc: '180天内轨迹数据',
            expire: '2027/01/13 09:33:24',
          },
          theme: 'blue',
          content: [
            '包含终身定位服务、精准轨迹查看、180天云端存储。',
            '180天滚动存储，过期后30天数据将删除。',
          ],
        },
        share: {
          status: {
            desc: '定位分享套餐有效期内不限制分享次数',
            expire: '当前无服务信息',
          },
          theme: 'red',
        },
        alarm: {
          alarm_wechat: {
            remain_key: 'alarmWechatLeft',
            total_key: 'alarmWechatTotal',
            theme: 'yellow',
          },
          alarm_phone: {
            remain_key: 'alarmPhoneLeft',
            total_key: 'alarmPhoneTotal',
            theme: 'yellow',
          },
          alarm_sms: {
            remain_key: 'alarmSmsLeft',
            total_key: 'alarmSmsTotal',
            theme: 'yellow',
          },
        },
      },
      purchaseNotes: PURCHASE_NOTES,
    }
  },
  computed: {
    tabSubtitle() {
      const map = { position: '秒定服务', share: '分享服务', alarm: '告警服务' }
      return map[this.activeTab] || ''
    },
    currentTabConfig() {
      if (this.activeTab === 'alarm') {
        return this.tabData.alarm[this.alarmSubTab]
      }
      return this.tabData[this.activeTab]
    },
    currentPackages() {
      if (this.activeTab === 'alarm') {
        return this.goodsList.filter(item => item.subType === this.alarmSubTab)
      }
      return this.goodsList.filter(item => item.type === this.activeTab)
    },
    currentPackage() {
      return this.currentPackages[this.selectedIndex] || {}
    },
    currentTheme() {
      return this.currentTabConfig?.theme || 'blue'
    },
    alarmStatus() {
      return {
        remain: this.user[this.currentTabConfig.remain_key],
        total: this.user[this.currentTabConfig.total_key],
        percent: this.user[this.currentTabConfig.remain_key] / this.user[this.currentTabConfig.total_key] * 100,
      }
    },
    selectedPrice() {
      const pkg = this.currentPackages[this.selectedIndex] 
      return pkg?.discountPriceCent / 100 ?? 0
    },
    themeColor() {
      const map = { blue: '#4a9eff', red: '#e74c3c', yellow: '#f1c40f' }
      return map[this.currentTheme] || '#4a9eff'
    },
    themeBg() {
      const map = {
        blue: '#f0f7ff',
        red: '#fff5f5',
        yellow: '#fffdf0',
      }
      return map[this.currentTheme] || '#f0f7ff'
    },
  },
  onLoad(options) {
    this.user = uni.getStorageSync('userInfo')
    this.deviceId = uni.getStorageSync('currentDevice').sn

    if (options.tab && ['position', 'share', 'alarm'].includes(options.tab)) {
      this.activeTab = options.tab
    }
    this.loadGoodsList()
    this.calcScrollHeight()
  },
  methods: {
    loadGoodsList() {
      getGoodsList().then(res => {
        this.goodsList = res
      })
    },
    calcScrollHeight() {
      const sys = uni.getSystemInfoSync()
      this.statusBarHeight = sys.statusBarHeight || 20
      const footerH = 100
      const headerH = this.activeTab === 'alarm' ? 360 : 320
      this.scrollHeight = `calc(100vh - ${this.statusBarHeight + headerH + footerH}px)`
    },
    onMainTabChange(key) {
      this.activeTab = key
      this.selectedIndex = 0
      this.calcScrollHeight()
    },
    onAlarmSubChange(key) {
      this.alarmSubTab = key
      this.selectedIndex = 0
    },
    packageCardClass(index) {
      return {
        'package-card--active': this.selectedIndex === index,
        [`package-card--${this.currentTheme}`]: this.selectedIndex === index,
      }
    },
    packageNameStyle(index) {
      if (this.selectedIndex !== index) return {}
      return { color: this.themeColor }
    },
    packagePriceStyle(index) {
      if (this.selectedIndex !== index) return {}
      return { color: this.themeColor }
    },
    goBack() {
      uni.navigateBack()
    },
    onPay() {
      const pkg = this.currentPackages[this.selectedIndex]
      if (!pkg) return
      uni.showModal({
        title: '确认支付',
        content: `支付 ¥${pkg.discountPriceCent / 100} 购买「${pkg.name}」？`,
        success: async (res) => {
          if (!res.confirm) return
          try {
            const payData = await createOrder({
              goodsId: pkg.id,
              bindDeviceId: this.deviceId,
              payChannel: 'wx_lite',
              quantity: 1,
            })
            await requestWechatPay(payData.wechatPay)
            uni.$u.toast('支付成功')
            this.loadGoodsList()
          } catch (err) {
            const msg = err?.message || '支付失败'
            if (msg !== '已取消支付') {
              uni.$u.toast(msg)
            }
          }
        },
      })
    },
    onService() {
      uni.$u.toast('在线客服')
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

.header {
  background: #3dba6e;
  flex-shrink: 0;
}

.header__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 24rpx;
}

.header__back,
.header__placeholder {
  width: 60rpx;
}

.header__title {
  font-size: 34rpx;
  color: #fff;
  font-weight: 500;
}

.user-block {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 16rpx 32rpx 24rpx;
}

.user-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-info__phone {
  font-size: 36rpx;
  color: #fff;
  font-weight: 600;
  display: block;
  margin-bottom: 8rpx;
}

.user-info__row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 6rpx;
}

.user-info__sub {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}

.user-info__device {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.75);
}

.tab-bar {
  display: flex;
  margin: 0 24rpx;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 12rpx 12rpx 0 0;
  overflow: hidden;
}

.tab-bar__item {
  flex: 1;
  text-align: center;
  padding: 22rpx 0;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.85);
}

.tab-bar__item--active {
  background: #fff;
  color: #3dba6e;
  font-weight: 600;
  border-radius: 12rpx 12rpx 0 0;
}

.content {
  flex: 1;
  padding: 24rpx;
  box-sizing: border-box;
}

.content-subtitle {
  font-size: 30rpx;
  color: #666;
  font-weight: 500;
  display: block;
  margin-bottom: 20rpx;
  text-align: center;
}

.alarm-subtabs {
  display: flex;
  margin-bottom: 24rpx;
  border-bottom: 1rpx solid #e8e8e8;
}

.alarm-subtabs__item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #999;
  position: relative;
}

.alarm-subtabs__item--active {
  color: #3dba6e;
  font-weight: 600;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    width: 48rpx;
    height: 6rpx;
    background: #3dba6e;
    border-radius: 3rpx;
  }
}

.content__bottom-space {
  height: 140rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.card--plain {
  padding-bottom: 20rpx;
}

.card--current {
  .card__title {
    font-size: 30rpx;
    font-weight: 600;
    color: #222;
    display: block;
    margin-bottom: 12rpx;
  }

  .card__desc {
    font-size: 26rpx;
    color: #999;
    display: block;
  }

  .card__expire {
    font-size: 26rpx;
    color: #999;
  }
}

.alarm-status__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.alarm-status__hint {
  font-size: 26rpx;
  color: #999;
}

.alarm-status__text {
  font-size: 26rpx;
  color: #333;
}

.alarm-status__num {
  color: #f1c40f;
  font-weight: 600;
}

.alarm-progress {
  height: 36rpx;
  background: #f0f0f0;
  border-radius: 18rpx;
  overflow: hidden;
}

.alarm-progress__fill {
  height: 100%;
  background: linear-gradient(90deg, #f1c40f, #f39c12);
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 36rpx;
  transition: width 0.3s;
}

.alarm-progress__label {
  font-size: 22rpx;
  color: #fff;
  padding-right: 12rpx;
  font-weight: 600;
}

.section__title {
  font-size: 30rpx;
  font-weight: 600;
  color: #222;
  display: block;
}

.section__title--in {
  margin-bottom: 20rpx;
}

.package-list {
  display: flex;
  gap: 16rpx;
}

.package-card {
  flex: 1;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 20rpx 12rpx;
  text-align: center;
  background: #fff;
}

.package-card--blue {
  border-color: #4a9eff;
  background: #f0f7ff;
}

.package-card--red {
  border-color: #e74c3c;
  background: #fff5f5;
}

.package-card--yellow {
  border-color: #f1c40f;
  background: #fffdf0;
}

.package-card__name {
  font-size: 24rpx;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
  line-height: 1.3;
}

.package-card__price {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  display: block;
}

.package-card__origin {
  font-size: 22rpx;
  color: #bbb;
  text-decoration: line-through;
  display: block;
  margin-top: 4rpx;
}

.pay-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pay-row__left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  font-size: 28rpx;
  color: #333;
}

.pay-wechat {
  width: 48rpx;
  height: 48rpx;
  border-radius: 8rpx;
  background: #07c160;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plain-block {
  margin-bottom: 24rpx;
}

.plain-block__label {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
  display: block;
  margin-bottom: 12rpx;
}

.list-text__item {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.7;
  margin-bottom: 8rpx;
}

.list-text {
  font-size: 26rpx;
  color: #666;
}

.service-link {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #999;
  text-align: center;
}

.service-link__btn {
  color: #3dba6e;
  margin-left: 8rpx;
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
  border-radius: 44rpx;
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
