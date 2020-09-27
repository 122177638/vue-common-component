/*
 * @Author: Anles💯
 * @Date: 2020-09-23 15:24:16
 * @LastEditors: Anles💯
 * @LastEditTime: 2020-09-25 11:08:30
 * @Description: 👉
 */
import { DatePickerOptions } from 'element-ui/types/date-picker'

/** 当前表单支持的类型 elementui类型 */
export type TFormItemType = 'date' | 'select' | 'input' | 'dropdown' | 'custom'
export type TDateType =
  | 'year'
  | 'month'
  | 'dates'
  | 'week'
  | 'datetime'
  | 'date'
  | 'daterange'
  | 'monthrange'
  | 'datetimerange'
export interface IOption {
  label: string
  value: string | number
}

export interface IQueryItem extends IQueryDateModel, IQuerySelectModel {
  label?: string
  /** 表单name值 */
  key: string
  /** 表单类型 */
  type: TFormItemType
  /** 宽度 */
  width?: number
  /** 是否显示删除按钮 */
  clearable?: boolean
  /** 提示 */
  placeholder?: string
  /** 缓存数值的key，比如select组件会保存结果，切换到其他页面时，如果是相同的key直接取上次选择的结果 */
  cacheKey?: string
  /** promise 接口数据 */
  request?: any
  /** 获取数据处理 返回option */
  requested?: (payload: any, formItem: any) => IOption[]
  /** 异步处理唯一Id, 只读 */
  readonly _fid?: string
}

export interface IQuerySelectModel {
  /** 数据(select) */
  options?: IOption[]
  /** 是否默认选中第一个(select) */
  autoSelect?: boolean
}

export interface IQueryDateModel {
  /** element date type */
  dateType?: TDateType
  /** 日期格式化 默认‘yyyy-MM-dd’ */
  pickerOptions?: DatePickerOptions
  /** 日期格式化 默认‘yyyy-MM-dd’ */
  valueFormat?: string
  /** 只有当dateType为range时有效 默认‘至’ */
  rangeSeparator?: string
  /** 只有当dateType为range时有效 默认‘开始日期’ */
  startPlaceholder?: string
  /** 只有当dateType为range时有效 默认‘结束日期’ */
  endPlaceholder?: string
  /** 只有当dateType为range时有效 默认‘[00:00:00', '08:00:00]’ */
  defaultTime?: any[]
}
