<script>
import http from '@/common/request'
import { API_BASE_URL } from '@/common/config'

export default {
  globalData: {
    http,
    apiBaseUrl: API_BASE_URL,
  },
  onLaunch() {
    // 全局挂载，页面内可用 uni.$http 或 this.$http（Options API）
    uni.$http = http
    if (!API_BASE_URL) {
      console.warn('[App] 请在 .env.production / .env.mp-weixin 配置 VITE_API_BASE_URL')
    }
  },
  onShow() {},
  onHide() {},
}
</script>

<style lang="scss">
@import "uview-plus/index.scss";
</style>
