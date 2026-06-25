<template>
  <up-popup :show="show" mode="center" round="24" :close-on-click-overlay="true" @close="onLater">
    <view class="modal">
      <view class="modal__icon-wrap">
        <view class="modal__bell">
          <up-icon name="bell-fill" color="#fff" size="56"></up-icon>
        </view>
        <view class="modal__bubble">
          <up-icon name="chat-fill" color="#3dba6e" size="22"></up-icon>
        </view>
      </view>

      <text class="modal__title">定位分享充值</text>
      <text class="modal__msg">当前设备无定位分享服务，是否前往开通</text>

      <text class="modal__subtitle">将为您提供以下服务</text>
      <view class="modal__list">
        <text v-for="(item, i) in benefits" :key="i" class="modal__list-item">{{ i + 1 }}. {{ item }}</text>
      </view>

      <view class="modal__actions">
        <view class="modal__btn modal__btn--later" @click="onLater">
          <text>以后再说</text>
        </view>
        <view class="modal__btn modal__btn--order" @click="onOrder">
          <text>前往订购</text>
        </view>
      </view>
    </view>
  </up-popup>
</template>

<script>
export default {
  name: 'ShareLocationModal',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    deviceId: [String, Number],
  },
  emits: ['close', 'later', 'order'],
  data() {
    return {
      benefits: [
        '限时定位分享功能使用权限',
        '7*16小时远程技术服务支持保障',
        '终身售后服务，1对1全程服务',
        '更多APP创新功能抢先免费体验',
      ],
    }
  },
  methods: {
    onLater() {
      this.$emit('later')
      this.$emit('close')
    },
    onOrder() {
      this.$emit('order', this.deviceId)
      this.$emit('close')
    },
  },
}
</script>

<style lang="scss" scoped>
.modal {
  width: 600rpx;
  padding: 48rpx 40rpx 40rpx;
  background: #fff;
  border-radius: 24rpx;
  box-sizing: border-box;
}

.modal__icon-wrap {
  position: relative;
  width: 140rpx;
  height: 140rpx;
  margin: 0 auto 32rpx;
}

.modal__bell {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: linear-gradient(145deg, #5ed48a, #3dba6e);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 32rpx rgba(61, 186, 110, 0.35);
}

.modal__bubble {
  position: absolute;
  left: -8rpx;
  top: 8rpx;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.modal__title {
  display: block;
  text-align: center;
  font-size: 36rpx;
  font-weight: 700;
  color: #3dba6e;
  margin-bottom: 20rpx;
}

.modal__msg {
  display: block;
  text-align: center;
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
  margin-bottom: 32rpx;
}

.modal__subtitle {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.modal__list-item {
  display: block;
  font-size: 24rpx;
  color: #888;
  line-height: 1.8;
  padding-left: 8rpx;
}

.modal__actions {
  display: flex;
  gap: 24rpx;
  margin-top: 40rpx;
}

.modal__btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 30rpx;
  }
}

.modal__btn--later {
  background: #f5f5f5;

  text {
    color: #666;
  }
}

.modal__btn--order {
  background: #3dba6e;

  text {
    color: #fff;
    font-weight: 500;
  }
}
</style>
