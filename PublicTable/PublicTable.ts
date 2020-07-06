type TColType = 'custom'
type TColSortable = boolean|'custom'
type TColChildren = ICol[]
export interface ICol {
  /** 表格单项标题 */
  label: string
  /** 表格渲染key */
  prop: string
  /** custom 可通过slot连接Prop自定义 */
  type?: TColType
  /** 表格宽度 */
  width?: string
  /** 最小宽度 */
  minWidth?: string|number
  /** 开启排序 */
  sortable?: TColSortable
  /** 多级表头 */
  children?: TColChildren
  [propName: string] : any
}

export interface IPageData {
  /** 数据大小 */
  pageSize: number
  /** 页码 */
  pageNum: number
  /** 总页码 */
  pageCount?: number
  /** 是否有上一页 */
  hasPrevPage: boolean
  /** 是否有下一页 */
  hasNextPage: boolean
}
