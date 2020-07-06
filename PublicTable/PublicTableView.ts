import { Vue, Component, Watch } from 'vue-property-decorator'
import { ICol, IPageData } from './PublicTable'
import { IFormItem } from '../PublicQuery/PublicQuery'
import { SaveCsvDataAs } from '../../utils/download'
import { formatDate, handleTableData } from '@/utils/utils'
import BaseClass from '@/virtual-class/baseClass'

@Component
export default class PublicTableView extends BaseClass {
  protected pageData: IPageData = {
    pageSize: 10,
    pageNum: 1,
    /** 总条数大于零将使用分页切换，否则使用上一页or下一页 */
    pageCount: 0,
    hasPrevPage: false,
    hasNextPage: false,
  }
  /** 是否在请求api中获取参数 */
  private isRequestQuery: boolean = false
  /** 表格列配置 */
  protected columns: ICol[] = []
  /** 搜索参数 */
  protected queryParams: any = {}
  /** 搜索列表 */
  protected queryItems: IFormItem[] = []
  /** 表格数据 */
  protected tableData: any[] = []
  /** 表格加载中 */
  protected tableLoading: boolean = false
  /** api接口 */
  protected queryMethod: TserveApi = null as any
  /** 下载接口 */
  protected downloadMethod: TserveApi = null as any
  /** 过滤不需要实时变化的参数 */
  protected ignoreKeys: string[] = ['pageNum']
  /** 数据处理 返回表格数据 */
  protected processData(payload: any): any[] {
    return []
  }
  /** 上次请求参数 */
  protected lastQueryParams: any = {}
  /** * 缓存翻页数据 不缓存参数变换数据 */
  protected tableDataCacheMap: Map<any, any> = new Map()

  protected getQueryParams(queryParams?: any): any {
    return queryParams
  }

  protected onQuery(pageParams?: number | IOnQueryParams) {
    try {
      console.log('onQuery')
      const pageObj: IOnQueryParams = this._getPageParamsInit(pageParams)
      let queryParams = this.getQueryParams(this.queryParams)
      const pageNum = pageObj.pageNum || this.pageData.pageNum
      this.pageData.pageSize = queryParams.pageSize || this.pageData.pageSize
      queryParams = {
        pageNum,
        pageSize: this.pageData.pageSize,
        ...queryParams,
      }
      this.pageData.pageNum = pageNum
      const isNewCondition = this._deepCompare(queryParams, this.lastQueryParams, this.ignoreKeys)
      /** 是否使用缓存 */
      if (pageObj.isUseCache) {
        /** 如果参数和上一次一致并过滤ignoreKeys使用缓存，如果缓存中找不到数据重新请求 */
        if (isNewCondition) {
          const cacheTableData = this.tableDataCacheMap.get(queryParams.pageNum)
          if (Array.isArray(cacheTableData)) {
            this.tableData = cacheTableData
            this.hasPageDisabled(cacheTableData)
            return
          }
        } else {
          /** 如果page页一致。证明是修改参数并不是切换页码，重置页码并清除内存中数据 */
          if (queryParams.pageNum === this.lastQueryParams.pageNum) {
            queryParams.pageNum = 1
            this.pageData.pageNum = 1
            this.clearCacheData()
          }
        }
      }
      // if (isNewCondition) {
      //   this.tableDataCacheMap.clear()
      //   this.lastQueryParams = queryParams
      // }
      this.doQuery(queryParams, pageObj)
    } catch (error) {
      console.error('table api error', error)
    }
  }

  protected doQuery(queryParams: any, pageObj: any) {
    this.toggleLoding()
    this.queryMethod(queryParams)
      .then(payload => {
        this.onGetQueryResult(payload)
        this.lastQueryParams = queryParams
        if (pageObj.isUseCache) this.tableDataCacheMap.set(queryParams.pageNum, this.tableData)
      })
      .catch(() => {
        this.tableData = []
        this.hasPageDisabled(this.tableData)
      })
      .finally(() => {
        this.toggleLoding(false)
      })
  }

  protected onGetQueryResult(payload: any) {
    const list = this.processData(payload)
    list.forEach(item => handleTableData(item))
    this.hasPageDisabled(list)
    this.tableData = list
  }

  /** onQuery初始化参数 */
  private _getPageParamsInit(pageParams?: number | IOnQueryParams): IOnQueryParams {
    const toString = Object.prototype.toString
    /** 默认参数 */
    let result: any = {
      isUseCache: true,
      pageNum: this.pageData.pageNum,
    }
    if (toString.call(pageParams) === '[object Object]') {
      result = { ...result, ...(pageParams as IOnQueryParams) }
    } else if (toString.call(pageParams) === '[object Number]') {
      result = { ...result, pageNum: pageParams }
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
      if (Object.keys(a).length !== Object.keys(b).length) return false
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
  protected hasPageDisabled(tableList: any[]) {
    if (!tableList.length && this.pageData.pageNum > 1) {
      this.pageData.hasPrevPage = true
      this.pageData.hasNextPage = false
    } else {
      if (tableList.length >= this.pageData.pageSize) {
        this.pageData.hasNextPage = true
      } else {
        this.pageData.hasNextPage = false
      }
      if (this.pageData.pageNum > 1) {
        this.pageData.hasPrevPage = true
      } else {
        this.pageData.hasPrevPage = false
      }
    }
  }
  /** 上一页 */
  protected onPrev() {
    this.pageData.pageNum--
    if (!this.pageData.pageCount) {
      this.onQuery()
    }
  }
  /** 下一页 */
  protected onNext() {
    this.pageData.pageNum++
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
            SaveCsvDataAs(resp as any, this.getDownloadFileName())
          }
        } catch (err) {
          this.$message(err)
        }
      })
      .finally(() => {
        loading.close()
      })
  }

  protected setFileName(): string {
    return ''
  }

  protected getDownloadFileName(): string {
    return this.setFileName() + formatDate(new Date().getTime(), 'YYYY-MM-DD HH:mm:ss') + '.csv'
  }
}

type TserveApi = (params: any) => Promise<any>
export interface IOnQueryParams {
  /** 跳转页数 */
  pageNum?: number
  /** 有缓存是否使用缓存 默认使用 */
  isUseCache?: boolean
}
