export * from './PublicFormatter'
export const enum ColumnType {
  BUTTONS = 'buttons',
  DROPDOWN = 'dropdown',
  LINK = 'link',
  SWITCH = 'switch',
  TAG = 'tag',
}
type ColSortable = boolean | 'custom'
type ElementButtonType = 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'text'

export type ColumnOptionFormatter = (value: any, item: any, ...args: any[]) => FormatedCellData

type FormatedButtonsCellData = {
  value: string | number
  buttons: ButtonOptionItem[]
}
type FormatedDropdownCellData = {
  value: string | number
  label?: string | number
  trigger?: 'hover' | 'click'
  placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end'
  options: DropdownOptionItem[]
}
type FormatedLinkCellData = {
  value: string | number
  label: string
}
type FormatedSwitchCellData = {
  value: string | number | boolean
  handler: Function
}
type FormatedTagCellData = {
  value: string | number | boolean
  type?: ElementButtonType
  color?: string
  effect?: 'dark' | 'light' | 'plain'
  hit?: boolean
}

export type FormatedCellData =
  | FormatedButtonsCellData
  | FormatedDropdownCellData
  | FormatedLinkCellData
  | FormatedSwitchCellData
  | FormatedTagCellData

export interface DropdownOptionItem {
  label: string
  handler?: Function
  divided?: boolean
  disabled?: boolean
  icon?: string
  [propName: string]: any
}
export interface ButtonOptionItem {
  label: string
  handler?: Function
  class?: string
  type?: ElementButtonType
  size?: 'medium' | 'small' | 'mini'
  plain?: boolean
  [propName: string]: any
}

export interface IColumnItem {
  /** 表格单项标题 */
  label: string
  /** 表格渲染key */
  prop: string
  /** 可通过slot连接Prop自定义 */
  type?: ColumnType
  formatter?: ColumnOptionFormatter
  /** 表格宽度 */
  width?: string | number
  /** 最小宽度 */
  minWidth?: string | number
  /** 开启排序 */
  sortable?: ColSortable
  /** 自定义属性 */
  [propName: string]: any
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
