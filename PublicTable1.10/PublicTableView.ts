import { Vue, Component, Watch } from 'vue-property-decorator'
import { IColumnItem } from './PublicTable'
import { IQueryItem } from '../PublicQuery/PublicQuery'
import { SaveCsvDataAs } from '../../utils/download'
import { formatDate, handleTableData } from '@/utils/utils'
import ModuleView from '@/views/base/ModuleView'

@Component
export default class PublicTableView extends ModuleView {
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
  protected tableData: any[] = []
  /** 表格加载中 */
  protected tableLoading: boolean = false
  /** 过滤缓存对比key */
  protected ignoreKeys: string[] = ['page']
  /** 是否滚动加载表格 对应组件isScroll参数 */
  protected isScroll: boolean = false
  /** api接口 */
  protected queryMethod: TserveApi = null as any
  /** 下载接口 */
  protected downloadMethod: TserveApi = null as any
  /** 数据处理 返回表格数据 */
  protected processData(payload: any): any[] {
    return payload || []
  }
  /** 上次请求参数 */
  protected lastQueryParams: any = {}
  /** 缓存翻页数据 */
  protected tableDataCacheMap: Map<any, any> = new Map()

  protected getQueryParams(queryParams?: any): any {
    return queryParams
  }
  /**
   * 如果是改变表格项长度或者搜索参数修改，请使用onQuery({ page: 1, isUseCache: false}) 由于表格项长度有变化，不请求当页，返回第一页
   * 如果是修改表格项，请使用onQuery({ isUseCache: false }) 会请求当前页 优化用户体验
   **/
  protected onQuery($pageParams?: number | IOnQueryParams) {
    try {
      const pageParams: IOnQueryParams = this._getPageParamsInit($pageParams)
      let queryParams = this.getQueryParams(this.queryParams)
      this.pageData.pageSize = queryParams.pageSize || this.pageData.pageSize
      this.pageData.page = queryParams.page || pageParams.page || this.pageData.page
      queryParams = {
        page: this.pageData.page,
        pageSize: this.pageData.pageSize,
        ...queryParams,
      }
      if (!this.isScroll) {
        /** 是否使用缓存 */
        if (pageParams.isUseCache) {
          const isNewCondition = this._deepCompare(queryParams, this.lastQueryParams, this.ignoreKeys)
          /** 如果参数和上一次一致并过滤page使用缓存，如果缓存中找不到数据重新请求 */
          if (isNewCondition) {
            const cacheTableData = this.tableDataCacheMap.get(queryParams.page)
            if (Array.isArray(cacheTableData)) {
              this.tableData = cacheTableData
              this.processPageData(cacheTableData)
              return
            }
          } else {
            /** 如果page页一致。证明是修改参数并不是切换页码，重置页码并清除内存中数据 */
            if (queryParams.page === this.lastQueryParams.page) {
              queryParams.page = 1
              this.pageData.page = 1
              this.clearCacheData()
            }
          }
        } else {
          /** 不使用缓存，清除缓存 */
          this.clearCacheData()
        }
      }
      this.doQuery(queryParams, pageParams.isUseCache!)
    } catch (error) {
      console.error('table api error', error)
    }
  }

  protected doQuery(queryParams: any, isUseCache: boolean) {
    this.toggleLoding()
    this.queryMethod(queryParams)
      .then(payload => {
        this.onGetQueryResult(payload)
        /** 请求成功后 记录上次请求 */
        this.lastQueryParams = { ...queryParams }
        if (isUseCache) this.tableDataCacheMap.set(queryParams.page, this.tableData)
      })
      .catch(() => {
        this.tableData = []
        this.pageData.pageCount = 0
        this.clearCacheData()
        this.processPageData(this.tableData)
      })
      .finally(() => {
        this.toggleLoding(false)
      })
  }

  protected onGetQueryResult(payload: any) {
    this.pageData.pageCount = payload.total_pages || (payload.paginate && payload.paginate.total_pages) || 0
    const list = this.processData(payload)
    list.forEach(item => handleTableData(item))
    this.processPageData(list)
    /** 滚动加载合并数据 */
    if (this.isScroll) {
      this.tableData = this.tableData.concat(list)
    } else {
      this.tableData = list
    }
  }

  /** onQuery初始化参数 */
  private _getPageParamsInit(pageParams?: number | IOnQueryParams): IOnQueryParams {
    const toString = Object.prototype.toString
    /** 默认参数 */
    let result: IOnQueryParams = {
      isUseCache: true,
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
    this.tableDataCacheMap.clear()
  }

  /** 参数比较 */
  private _deepCompare(a: any, b: any, ignoreKeys?: string[]): boolean {
    const toString = Object.prototype.toString
    if (toString.call(a) !== toString.call(b)) return false
    if (toString.call(a) === '[object Object]') {
      if (
        Object.keys(a).filter(k => !ignoreKeys || !ignoreKeys.includes(k)).length !==
        Object.keys(b).filter(k => !ignoreKeys || !ignoreKeys.includes(k)).length
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
      this.tableLoading = loading
    } else {
      this.tableLoading = !this.tableLoading
    }
  }
  /** 上一页 OR 下一页 按钮禁用处理 */
  protected processPageData(tableList: any[]) {
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
    const loading = this.$loading({})
    this.downloadMethod(this.getQueryParams(this.queryParams))
      .then(resp => {
        try {
          if (/^https?:\/\//.test(resp)) {
            window.open(resp)
          } else {
            SaveCsvDataAs(resp as any, this.getFileName())
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
}

type TserveApi = (params: any) => Promise<any>
export interface IOnQueryParams {
  /** 跳转页数 */
  page?: number
  /** 有缓存是否使用缓存 默认使用 */
  isUseCache?: boolean
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
