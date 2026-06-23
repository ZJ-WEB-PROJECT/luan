<template>
  <view class="page">
    <up-navbar title="充值订单" :bg-color="THEME_GREEN" title-color="#fff" left-icon="arrow-left" left-icon-color="#fff"
      :auto-back="true" :placeholder="true" :safe-area-inset-top="true"></up-navbar>

    <scroll-view class="content" scroll-y>
      <view v-for="item in orderList" :key="item.orderNo" class="order-card" @click="onOrderDetail(item)">
        <view class="order-card__head">
          <text class="order-card__no">订单号：{{ item.orderNo }}</text>
          <text class="order-card__status"
            :class="item.status === 1 ? 'order-card__status--paid' : 'order-card__status--closed'">
            {{ getOrderStatus(item.status) }}
          </text>
        </view>

        <view class="order-card__divider"></view>

        <view class="order-card__body">
          <text class="order-card__name">{{ item.title }}</text>
          <text class="order-card__price">¥{{ item.payAmountCent / 100 }}</text>
        </view>

        <view class="order-card__foot">
          <text class="order-card__time">
            创建时间：{{ item.createTime }}
          </text>
        </view>
        <view class="order-card__foot" v-if="item.paidTime">
          <text class="order-card__time">
            支付时间：{{ item.paidTime }}
          </text>
        </view>
      </view>

      <view v-if="!orderList.length" class="empty-wrap">
        <up-empty mode="order" text="暂无充值订单"></up-empty>
      </view>

      <view v-else class="list-footer">
        <text>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { THEME_GREEN } from '@/common/theme.js'
import { getOrderList } from '@/api/order'
export default {
  data() {
    return {
      THEME_GREEN,
      orderList: [],
      statusMap: {
        0: '待支付',
        1: '已支付',
        2: '已关闭',
        3: '已退款/部分退款',
      },
    }
  },
  onLoad() {
    this.loadOrders()
  },
  methods: {
    async loadOrders() {
      const res = await getOrderList()
      this.orderList = res
    },
    onOrderDetail(item) {
      uni.$u.toast(`订单 ${item.orderNo}`)
    },
    getOrderStatus(status) {
      return this.statusMap[status]
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

.order-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 0 28rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.order-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0 20rpx;
  gap: 16rpx;
}

.order-card__no {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  color: #999;
  word-break: break-all;
}

.order-card__status {
  flex-shrink: 0;
  font-size: 26rpx;
}

.order-card__status--paid {
  color: #3dba6e;
}

.order-card__status--closed {
  color: #999;
}

.order-card__divider {
  height: 1rpx;
  background: #f0f0f0;
}

.order-card__body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  gap: 16rpx;
}

.order-card__name {
  flex: 1;
  font-size: 30rpx;
  color: #222;
  font-weight: 500;
}

.order-card__price {
  font-size: 32rpx;
  font-weight: 700;
  color: #222;
  flex-shrink: 0;
}

.order-card__foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;
  padding: 0 0 24rpx;
}

.order-card__time {
  font-size: 24rpx;
  color: #999;
}

.empty-wrap {
  padding: 120rpx 0;
}

.list-footer {
  text-align: center;
  padding: 32rpx 0 48rpx;

  text {
    font-size: 26rpx;
    color: #ccc;
  }
}
</style>
