import { Vue, Component } from 'vue-property-decorator'
import { IColumnItem } from './PublicTable'
import { IQueryItem } from '../PublicQuery/PublicQuery'
import { formatDate } from '@/utils'

@Component
export default class PublicTableView extends Vue {
  public created() {
    this.options = {
      ...this.options,
      ...this.getOptions(),
    }
    this.ignoreKeys = this.ignoreKeys.concat([this.options.page])
  }
  protected getOptions(): ITableOptions {
    return {}
  }
  /** 高级配置 */
  private options = {
    isScroll: false,
    page: 'page',
    pageSize: 'limit',
  }
  protected pageData: IPageData = {
    pageSize: 10,
    page: 1,
    /** 总条数大于零将使用分页切换，否则使用上一页or下一页 */
    pageCount: 0,
    hasPrevPage: false,
    hasNextPage: false,
  }
  /** 表格列配置 */
  protected columns: IColumnItem[] = []
  /** 搜索参数 */
  protected queryParams: any = {}
  /** 搜索列表 */
  protected queryItems: IQueryItem[] = []
  /** 表格数据 */
  protected data: any[] = []
  /** 表格加载中 */
  protected isLoading: boolean = false
  /** 过滤缓存对比key */
  protected ignoreKeys: string[] = []
  /** api接口 */
  protected queryApi: TserveApi = null as any
  /** 下载接口 */
  protected downloadApi: TserveApi = null as any
  /** 数据处理 返回表格数据 */
  protected handleData(payload: any): any[] {
    return payload || []
  }
  /** 上次请求参数 */
  protected lastQueryParams: any = {}
  /** 缓存翻页数据 */
  protected dataCacheMap: Map<any, any> = new Map()

  protected getQueryParams(queryParams?: any): any {
    return queryParams
  }
  /**
   * @example
   * onQuery({ page: 1, useCache: false}) // 如果是改变表格项长度或者搜索参数修改，由于表格项长度有变化，请求第一页使用
   * onQuery({ useCache: false }) // 如果是修改表格项,会请求当前页 优化用户体验
   **/
  protected onQuery($pageParams?: number | IOnQueryParams) {
    try {
      const pageParams: IOnQueryParams = this._getPageParamsInit($pageParams)
      let queryParams = this.getQueryParams(this.queryParams)
      this.pageData.pageSize = queryParams.pageSize || this.pageData.pageSize
      this.pageData.page = queryParams.page || pageParams.page || this.pageData.page
      queryParams = {
        [this.options.page]: this.pageData.page,
        [this.options.pageSize]: this.pageData.pageSize,
        ...queryParams,
      }
      if (!this.options.isScroll) {
        /** 是否使用缓存 */
        if (pageParams.useCache) {
          const isNewCondition = this._deepCompare(queryParams, this.lastQueryParams, this.ignoreKeys)
          /** 如果参数和上一次一致并过滤page使用缓存，如果缓存中找不到数据重新请求 */
          if (isNewCondition) {
            const cachedata = this.dataCacheMap.get(queryParams[this.options.page])
            if (Array.isArray(cachedata)) {
              this.data = cachedata
              this.handlePageData(cachedata)
              return
            }
          } else {
            /** 如果page页一致。证明是修改参数并不是切换页码，重置页码并清除内存中数据 */
            if (queryParams[this.options.page] === this.lastQueryParams[this.options.page]) {
              queryParams[this.options.page] = 1
              this.pageData.page = 1
              this.clearCacheData()
            }
          }
        } else {
          /** 不使用缓存，清除缓存 */
          this.clearCacheData()
        }
      } else {
        /** 如果请求页相同或者请求第一页,回到第一页并清空所有数据 */
        if (
          queryParams[this.options.page] === this.lastQueryParams[this.options.page] ||
          queryParams[this.options.page] === 1
        ) {
          queryParams[this.options.page] = 1
          this.pageData.page = 1
          this.data = []
        }
      }
      this.doQuery(queryParams, pageParams.useCache!)
    } catch (error) {
      console.error('table api error', error)
    }
  }

  protected doQuery(queryParams: any, useCache: boolean) {
    this.toggleLoding()
    this.queryApi(queryParams)
      .then((payload) => {
        this.onGetQueryResult(payload)
        /** 请求成功后 记录上次请求 */
        this.lastQueryParams = { ...queryParams }
        if (useCache && !this.options.isScroll) this.dataCacheMap.set(queryParams[this.options.page], this.data)
      })
      .catch(() => {
        this.data = []
        this.pageData.pageCount = 0
        this.clearCacheData()
        this.handlePageData(this.data)
      })
      .finally(() => {
        this.toggleLoding(false)
      })
  }

  protected onGetQueryResult(payload: any) {
    const list = this.handleData(payload)
    this.handlePageData(list)
    /** 滚动加载合并数据 */
    if (this.options.isScroll) {
      this.data = this.data.concat(list)
    } else {
      this.data = list
    }
  }

  /** onQuery初始化参数 */
  private _getPageParamsInit(pageParams?: number | IOnQueryParams): IOnQueryParams {
    const toString = Object.prototype.toString
    /** 默认参数 */
    let result: IOnQueryParams = {
      useCache: true,
      page: this.pageData.page,
    }
    if (toString.call(pageParams) === '[object Object]') {
      result = { ...result, ...(pageParams as IOnQueryParams) }
    } else if (toString.call(pageParams) === '[object Number]') {
      result = { ...result, page: pageParams as number }
    }
    return result as IOnQueryParams
  }

  /** 清空内存数据 */
  protected clearCacheData() {
    this.dataCacheMap.clear()
  }

  /** 参数比较 */
  private _deepCompare(a: any, b: any, ignoreKeys?: string[]): boolean {
    const toString = Object.prototype.toString
    if (toString.call(a) !== toString.call(b)) return false
    if (toString.call(a) === '[object Object]') {
      if (
        Object.keys(a).filter((k) => !ignoreKeys || !ignoreKeys.includes(k)).length !==
        Object.keys(b).filter((k) => !ignoreKeys || !ignoreKeys.includes(k)).length
      )
        return false
      return Object.entries(a).every(([key, val]) => {
        /** 过滤掉某些参数 必须携带key */
        if (Array.isArray(ignoreKeys) && ignoreKeys.some((filterKey: string) => filterKey === key)) return true
        return this._deepCompare(val, b[key], ignoreKeys)
      })
    } else if (toString.call(a) === '[object Array]') {
      if (a.length !== b.length) return false
      return a.every((as: any) => b.some((bs: any) => this._deepCompare(as, bs, ignoreKeys)))
    } else {
      return a === b
    }
  }
  /** 切换loading */
  protected toggleLoding(loading?: boolean) {
    if (loading !== undefined) {
      this.isLoading = loading
    } else {
      this.isLoading = !this.isLoading
    }
  }
  /** 上一页 OR 下一页 按钮禁用处理 */
  private handlePageData(tableList: any[]) {
    if (!tableList.length && this.pageData.page > 1) {
      this.pageData.hasPrevPage = true
      this.pageData.hasNextPage = false
    } else {
      if (tableList.length >= this.pageData.pageSize) {
        this.pageData.hasNextPage = true
      } else {
        this.pageData.hasNextPage = false
      }
      if (this.pageData.page > 1) {
        this.pageData.hasPrevPage = true
      } else {
        this.pageData.hasPrevPage = false
      }
    }
  }
  /** 上一页 */
  protected onPrev() {
    this.pageData.page--
    if (!this.pageData.pageCount) {
      this.onQuery()
    }
  }
  /** 下一页 */
  protected onNext() {
    this.pageData.page++
    if (!this.pageData.pageCount) {
      this.onQuery()
    }
  }
  /** 下载 */
  protected onDownload() {
    const loading = this.$loading({ target: '.app-main' })
    this.downloadApi(this.getQueryParams(this.queryParams))
      .then((resp) => {
        try {
          if (/^https?:\/\//.test(resp)) {
            window.open(resp)
          } else {
            this.SaveCsvDataAs(resp as any, this.getFileName())
          }
        } catch (err) {
          this.$message(err)
        }
      })
      .finally(() => {
        loading.close()
      })
  }

  protected getDownloadFileName(): string {
    return ''
  }

  protected getFileName(): string {
    return this.getDownloadFileName() + formatDate(new Date().getTime(), 'YYYY-MM-DD HH:mm:ss') + '.csv'
  }

  private SaveCsvDataAs(csvData: string, fileName: string) {
    const alink = document.createElement('a')
    alink.id = 'linkDwnldLink'
    alink.href = this.getCsvDownloadUrl(csvData)
    document.body.appendChild(alink)
    const linkDom: any = document.getElementById('linkDwnldLink')
    linkDom.setAttribute('download', fileName)
    linkDom.click()
    document.body.removeChild(linkDom)
  }

  private getCsvDownloadUrl(csvData: string): string {
    const _utf: string = '\uFEFF' // 为了使Excel以utf-8的编码模式，同时也是解决中文乱码的问题
    return 'data:attachment/csv;charset=utf-8,' + _utf + encodeURIComponent(csvData)
  }
}

type TserveApi = (params: any) => Promise<any>
export interface IOnQueryParams {
  /** 跳转页数 */
  page?: number
  /** 有缓存是否使用缓存 默认使用 */
  useCache?: boolean
}
export interface IPageData {
  /** 数据大小 */
  pageSize: number
  /** 页码 */
  page: number
  /** 总页码 */
  pageCount?: number
  /** 是否有上一页 */
  hasPrevPage: boolean
  /** 是否有下一页 */
  hasNextPage: boolean
}
export interface ITableOptions {
  /** 配置别名 */
  page?: string
  /** 配置别名 */
  pageSize?: string
  /** 是否滚动加载表格 对应组件isScroll参数 */
  isScroll?: boolean
}
