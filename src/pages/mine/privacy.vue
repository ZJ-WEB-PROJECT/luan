<template>
  <view class="page">
    <up-navbar :title="navTitle" :bg-color="THEME_GREEN" title-color="#fff" left-icon="arrow-left"
      left-icon-color="#fff" :auto-back="true" :placeholder="true" :safe-area-inset-top="true"></up-navbar>

    <view v-if="loading" class="loading-wrap">
      <up-loading-icon mode="circle" color="#3dba6e"></up-loading-icon>
      <text class="loading-wrap__text">加载中...</text>
    </view>

    <scroll-view v-else class="content" scroll-y>
      <view class="doc">
        <text v-if="updateTime" class="doc__meta">更新日期：{{ updateTime }}</text>

        <!-- 后端返回 HTML 时直接渲染 -->
        <rich-text v-if="htmlContent" class="doc__rich" :nodes="htmlContent"></rich-text>

        <!-- 结构化段落（接口 sections 或本地 mock） -->
        <template v-else>
          <template v-for="(block, index) in sections" :key="index">
            <text v-if="block.type === 'h2'" class="doc__section">{{ block.text }}</text>
            <text v-else-if="block.type === 'p'" class="doc__p">{{ block.text }}</text>
            <view v-else-if="block.type === 'ol'" class="doc__ol">
              <view v-for="(item, i) in block.items" :key="i" class="doc__item">
                <text class="doc__item-no">{{ i + 1 }}</text>
                <text class="doc__item-text">{{ item }}</text>
              </view>
            </view>
          </template>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { THEME_GREEN } from '@/common/theme.js'
import { contentConfig } from '@/api/user'
export default {
  data() {
    return {
      THEME_GREEN,
      protocolType: 'privacy',
      navTitle: '隐私政策',
      updateTime: '',
      htmlContent: '',
      sections: [],
      renderMode: 'sections',
      loading: true,
    }
  },
  onLoad(options) {
    this.protocolType = options.type
    this.loadProtocol()
  },
  methods: {
    async loadProtocol() {
      this.loading = true
      try {
        const data = await contentConfig({ type: this.protocolType })
        this.navTitle = data.title || '协议'
        this.htmlContent = data.content || ''
        this.updateTime = data.updateTime || ''
      } catch (e) {
        uni.$u.toast(e?.message || '加载失败')
      } finally {
        this.loading = false
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
}

.loading-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  padding: 80rpx 0;
}

.loading-wrap__text {
  font-size: 28rpx;
  color: #999;
}

.content {
  flex: 1;
  height: 0;
}

.doc {
  padding: 32rpx 36rpx 48rpx;
}

.doc__title {
  display: block;
  text-align: center;
  font-size: 36rpx;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.5;
  margin-bottom: 16rpx;
}

.doc__meta {
  display: block;
  text-align: center;
  font-size: 26rpx;
  color: #999;
  margin-bottom: 32rpx;
}

.doc__rich {
  font-size: 28rpx;
  color: #555;
  line-height: 1.75;
}

.doc__section {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #2c3e50;
  margin: 36rpx 0 20rpx;
}

.doc__p {
  display: block;
  font-size: 28rpx;
  color: #555;
  line-height: 1.75;
  margin-bottom: 20rpx;
  text-align: justify;
}

.doc__item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.doc__item-no {
  flex-shrink: 0;
  width: 36rpx;
  font-size: 28rpx;
  color: #999;
  line-height: 1.75;
}

.doc__item-text {
  flex: 1;
  font-size: 28rpx;
  color: #555;
  line-height: 1.75;
  text-align: justify;
}
</style>
