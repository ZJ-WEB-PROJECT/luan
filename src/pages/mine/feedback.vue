<template>
  <view class="page">
    <view class="card">
      <textarea v-model="content" class="feedback-input" :maxlength="maxLen" placeholder="点赞还是吐槽，我们都很期待..."
        placeholder-class="feedback-placeholder" />
      <view v-if="imageList.length" class="image-list">
        <view v-for="(item, index) in imageList" :key="item.path" class="image-item">
          <image class="image-item__img" :src="item.path" mode="aspectFill" />
          <view class="image-item__del" @click.stop="removeImage(index)">
            <up-icon name="close" color="#fff" size="12"></up-icon>
          </view>
        </view>
      </view>
      <view class="footer">
        <view class="footer__left" @click="pickImage">
          <up-icon name="photo" color="#666" size="22"></up-icon>
          <text class="counter">{{ content.length }} / {{ maxLen }}</text>
        </view>
        <view class="footer__right">
          <text class="btn-cancel" @click="onCancel">取消</text>
          <view class="btn-publish" :class="{ 'btn-publish--disabled': submitting }" @click="onPublish">
            <text>{{ submitting ? '发布中' : '发布' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { uploadFeedbackImage, submitFeedback } from '@/api/user'

const MAX_IMAGES = 9

export default {
  data() {
    return {
      content: '',
      maxLen: 500,
      imageList: [],
      submitting: false,
    }
  },
  methods: {
    pickImage() {
      if (this.imageList.length >= MAX_IMAGES) {
        uni.$u.toast(`最多上传${MAX_IMAGES}张图片`)
        return
      }
      uni.chooseImage({
        count: MAX_IMAGES - this.imageList.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          console.log(res)
          const paths = res.tempFilePaths || []
          const added = paths.map((path) => ({ path, url: '' }))
          this.imageList = [...this.imageList, ...added]
        },
      })
    },
    removeImage(index) {
      this.imageList.splice(index, 1)
    },
    onCancel() {
      uni.navigateBack()
    },
    async uploadAllImages() {
      const urls = []
      for (const item of this.imageList) {
        if (item.url) {
          urls.push(item.url)
          continue
        }
        const url = await uploadFeedbackImage(item.path)
        if (!url) {
          throw new Error('图片上传失败')
        }
        item.url = url
        urls.push(url)
      }
      return urls
    },
    async onPublish() {
      const text = this.content.trim()
      if (!text) {
        uni.$u.toast('请输入意见内容')
        return
      }
      if (this.submitting) return

      this.submitting = true
      uni.showLoading({ title: '提交中', mask: true })
      try {
        const imageUrls = await this.uploadAllImages()
        await submitFeedback({
          content: text,
          imageUrls,
        })
        uni.$u.toast('发布成功')
        // setTimeout(() => uni.navigateBack(), 300)
      } catch (err) {
        uni.$u.toast(err?.message || '发布失败')
      } finally {
        this.submitting = false
        uni.hideLoading()
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #efefef;
  padding: 14rpx;
  box-sizing: border-box;
}

.card {
  background: #fff;
  border-radius: 14rpx;
  padding: 18rpx 20rpx;
}

.feedback-input {
  width: 100%;
  height: 250rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

.feedback-placeholder {
  color: #bbb;
  font-size: 28rpx;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 16rpx;
}

.image-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  overflow: hidden;
}

.image-item__img {
  width: 100%;
  height: 100%;
}

.image-item__del {
  position: absolute;
  top: 0;
  right: 0;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom-left-radius: 8rpx;
}

.footer {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer__left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.counter {
  font-size: 30rpx;
  color: #666;
}

.footer__right {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.btn-cancel {
  font-size: 30rpx;
  color: #999;
}

.btn-publish {
  min-width: 92rpx;
  height: 56rpx;
  border-radius: 10rpx;
  background: #2f7cff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 18rpx;

  text {
    color: #fff;
    font-size: 28rpx;
  }
}

.btn-publish--disabled {
  opacity: 0.6;
}
</style>
