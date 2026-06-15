import {
  PAGE_MODE,
  buildPageBody,
  buildLogPageBody,
  buildSnPageBody,
  dayToTimeRange,
  fetchAllPages,
  fetchIndexPage,
  fetchPage,
} from '@/common/page-load'

/**
 * 通用游标分页 mixin（多页面可引用）
 *
 * 用法示例：
 * mixins: [pageLoadMixin],
 * methods: {
 *   async loadList() {
 *     await this.fetchPageFirst({
 *       requestFn: getDeviceStay,
 *       sn: this.deviceId,
 *       getTimeRange: () => dayToTimeRange(this.currentDate),
 *       extra: { stopTime: 60 },
 *       mode: PAGE_MODE.DEFAULT,
 *     })
 *   },
 * }
 */
export default {
  data() {
    return {
      pageList: [],
      pageLoading: false,
      pageFinished: false,
      pageCursor: {},
      pageIndex: 0,
    }
  },
  methods: {
    resetPage() {
      this.pageList = []
      this.pageLoading = false
      this.pageFinished = false
      this.pageCursor = {}
      this.pageIndex = 0
    },

    /** 由页面传入 sn，或 options.sn */
    resolvePageSn(options = {}) {
      return options.sn ?? this.pageSn ?? this.deviceId ?? ''
    },

    resolveTimeRange(options = {}) {
      if (options.timeBegin != null && options.timeEnd != null) {
        return { timeBegin: options.timeBegin, timeEnd: options.timeEnd }
      }
      if (typeof options.getTimeRange === 'function') {
        return options.getTimeRange.call(this)
      }
      if (options.date) {
        return dayToTimeRange(options.date)
      }
      if (this.currentDate) {
        return dayToTimeRange(this.currentDate)
      }
      return dayToTimeRange()
    },

    createPageGetBody(options = {}) {
      const sn = this.resolvePageSn(options)
      const { timeBegin, timeEnd } = this.resolveTimeRange(options)
      const limitSize = options.limitSize
      const extra = options.extra || {}
      const mode = options.mode || PAGE_MODE.DEFAULT

      return (cursor = {}) => buildPageBody({
        sn,
        timeBegin,
        timeEnd,
        limitSize,
        cursor,
        extra,
        mode,
      })
    },

    /** 设备操作日志：sn + beginTime/endTime(ms) + lastImei/lastTime */
    createLogPageGetBody(options = {}) {
      const sn = this.resolvePageSn(options)
      const limitSize = options.limitSize
      const extra = options.extra || {}
      const beginTime = options.beginTime ?? 0
      const endTime = options.endTime ?? 0
      return (cursor = {}) => buildLogPageBody({
        sn,
        beginTime,
        endTime,
        limitSize,
        cursor,
        extra,
      })
    },

    /** 仅 sn + limitSize + lastSfid（围栏列表等，无需时间） */
    createSnPageGetBody(options = {}) {
      const sn = this.resolvePageSn(options)
      const limitSize = options.limitSize
      const extra = options.extra || {}
      return (cursor = {}) => buildSnPageBody({ sn, limitSize, cursor, extra })
    },

    resolvePageGetBody(options = {}) {
      if (typeof options.getBody === 'function') {
        return options.getBody.bind(this)
      }
      if (options.mode === PAGE_MODE.SFID) {
        return this.createSnPageGetBody(options)
      }
      if (options.mode === PAGE_MODE.LOG) {
        return this.createLogPageGetBody(options)
      }
      return this.createPageGetBody(options)
    },

    async fetchPageFirst(options = {}) {
      this.resetPage()
      return this.loadPageMore(options)
    },
 
    async loadPageMore(options = {}) {
      if (this.pageLoading) return this.pageList
      if (this.pageFinished) return this.pageList

      // 页码分页：仅 page / size / sort，不要求 sn
      if (options.mode === PAGE_MODE.INDEX) {
        return this.loadIndexPageMore(options)
      }

      const sn = this.resolvePageSn(options)
      if (!sn) {
        uni.$u?.toast?.('未找到设备号')
        return []
      }

      this.pageLoading = true
      try {
        const result = await fetchPage({
          requestFn: options.requestFn,
          getBody: this.resolvePageGetBody(options),
          cursor: this.pageCursor,
          mode: options.mode || PAGE_MODE.DEFAULT,
          getCursor: options.getCursor,
          errorMsg: options.errorMsg,
        })
        this.pageList = [...this.pageList, ...result.list]
        this.pageCursor = result.cursor
        this.pageFinished = result.isFinish
        return this.pageList
      } catch (err) {
        if (!this.pageList.length) this.pageFinished = true
        uni.$u?.toast?.(err?.message || options.errorMsg || '加载失败')
        throw err
      } finally {
        this.pageLoading = false
      }
    },

    /** 页码分页（page + size） */
    async loadIndexPageMore(options = {}) {
      this.pageLoading = true
      try {
        const result = await fetchIndexPage({
          requestFn: options.requestFn,
          page: this.pageIndex,
          size: options.size ?? options.pageSize ?? 20,
          sort: options.sort,
          extra: options.extra,
          errorMsg: options.errorMsg,
        })

        this.pageList = [...this.pageList, ...result.list]
        this.pageIndex = result.nextPage
        this.pageFinished = result.isFinish
        return this.pageList
      } catch (err) {
        if (!this.pageList.length) this.pageFinished = true
        uni.$u?.toast?.(err?.message || options.errorMsg || '加载失败')
        throw err
      } finally {
        this.pageLoading = false
      }
    },

    async fetchAllPageList(options = {}) {
      const sn = this.resolvePageSn(options)
      if (!sn) {
        uni.$u?.toast?.('未找到设备号')
        return []
      }

      this.pageLoading = true
      this.pageFinished = false
      try {
        const list = await fetchAllPages({
          requestFn: options.requestFn,
          getBody: this.resolvePageGetBody(options),
          mode: options.mode || PAGE_MODE.DEFAULT,
          maxPages: options.maxPages,
          errorMsg: options.errorMsg,
        })
        this.pageList = list
        this.pageFinished = true
        return list
      } catch (err) {
        this.pageList = []
        this.pageFinished = true
        uni.$u?.toast?.(err?.message || options.errorMsg || '加载失败')
        throw err
      } finally {
        this.pageLoading = false
      }
    },
  },
}

export { PAGE_MODE, dayToTimeRange, buildPageBody, buildLogPageBody, buildSnPageBody }
