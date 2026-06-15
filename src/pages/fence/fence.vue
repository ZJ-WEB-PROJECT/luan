<template>
  <view class="page">
    <up-navbar
      title="围栏"
      :bg-color="THEME_GREEN"
      title-color="#fff"
      left-icon="arrow-left"
      left-icon-color="#fff"
      :auto-back="true"
      :placeholder="true"
      :safe-area-inset-top="true"
    ></up-navbar>

    <scroll-view class="content" scroll-y @scrolltolower="onPageScrollToLower">
      <template v-if="pageList.length">
        <view
          v-for="item in pageList"
          :key="item.sfid || item.id"
          class="fence-item"
          @click="onEditFence(item)"
        >
          <view class="fence-item__main">
            <text class="fence-item__name">{{ item.name }}</text>
            <text class="fence-item__meta">{{ fenceTypeLabel(item.type) }}</text>
          </view>
          <up-icon name="arrow-right" color="#ccc" size="16"></up-icon>
        </view>
      </template>

      <view v-else-if="pageLoading" class="empty-wrap">
        <text class="loading-tip">加载中...</text>
      </view>
      <view v-else class="empty-wrap">
        <up-empty mode="data" text="暂无围栏"></up-empty>
      </view>

      <view v-if="pageList.length && pageLoading" class="list-footer">
        <text>加载中...</text>
      </view>
      <view v-else-if="pageList.length && pageFinished" class="list-footer">
        <text>没有更多了</text>
      </view>
      <view v-else-if="pageList.length" class="list-footer">
        <text>上拉加载更多</text>
      </view>
    </scroll-view>

    <view class="footer-bar">
      <view class="footer-bar__btn" @click="onCreate">
        <text>创建围栏</text>
      </view>
    </view>
  </view>
</template>

<script>
import { THEME_GREEN } from '@/common/theme.js'
import { getFenceList, FENCE_TYPE_LABELS } from '@/api/device'
import pageLoadMixin, { PAGE_MODE } from '@/mixins/page-load'

export default {
  mixins: [pageLoadMixin],
  data() {
    return {
      THEME_GREEN,
      deviceId: '',
      pageLimitSize: 50,
    }
  },
  onLoad(options) {
    if (options.deviceId) this.deviceId = options.deviceId
    else {
      const dev = uni.getStorageSync('currentDevice')
      this.deviceId = dev?.sn || dev?.imei || ''
    }
  },
  onShow() {
    this.loadFenceList()
  },
  methods: {
    getPageLoadOptions() {
      return {
        requestFn: getFenceList,
        sn: this.deviceId,
        limitSize: this.pageLimitSize,
        mode: PAGE_MODE.SFID,
        errorMsg: '加载围栏失败',
      }
    },
    async loadFenceList() {
      if (!this.deviceId) {
        this.resetPage()
        return
      }
      try {
        await this.fetchPageFirst(this.getPageLoadOptions())
      } catch {
        // toast 已在 mixin 中处理
      }
    },
    onPageScrollToLower() {
      if (this.pageFinished || this.pageLoading) return
      this.loadPageMore(this.getPageLoadOptions())
    },
    fenceTypeLabel(type) {
      return FENCE_TYPE_LABELS[type] || type || ''
    },
    onCreate() {
      uni.navigateTo({
        url: `/pages/fence/create?deviceId=${this.deviceId || ''}`,
      })
    },
    onEditFence(item) {
      uni.navigateTo({
        url: `/pages/fence/create?deviceId=${this.deviceId || ''}&id=${item.sfid || item.id}`,
      })
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

.empty-wrap {
  padding-top: 120rpx;
}

.loading-tip {
  display: block;
  text-align: center;
  font-size: 28rpx;
  color: #999;
}

.fence-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 12rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.fence-item__name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 8rpx;
}

.fence-item__meta {
  font-size: 24rpx;
  color: #999;
}

.list-footer {
  text-align: center;
  padding: 40rpx 0 160rpx;
  font-size: 26rpx;
  color: #ccc;
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
