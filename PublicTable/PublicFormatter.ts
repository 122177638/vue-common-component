import { ColumnOptionFormatter, ButtonOptionItem, DropdownOptionItem } from './PublicTable'
import { formatDate, formatNumber } from '@/utils'
export function ColumnMapFormatter(map: { [key: string]: any }): ColumnOptionFormatter {
  return (value: any, item: any) => {
    const type = Object.prototype.toString.call(map)
    let result
    if (type === '[object Map]') {
      result = map.get(value)
    } else {
      result = map[value]
    }
    if (Object.prototype.toString.call(result) === '[object Object]') {
      return result
    }
    return {
      value: result || '-',
    }
  }
}

export function ColumnButtonsFormatter(buttons: ButtonOptionItem[]): ColumnOptionFormatter {
  return (_: any, item: any) => ({
    value: _,
    buttons: buttons.filter(b => !b.filter || b.filter(item)),
  })
}

export function ColumnOptionsFormatter(dropdowns: DropdownOptionItem[]): ColumnOptionFormatter {
  return (_: any, item: any) => ({
    value: _,
    options: dropdowns.filter(b => !b.filter || b.filter(item)),
  })
}

export const ColumnDateFormatter: ColumnOptionFormatter = (value: number, item: any) => ({ value: formatDate(value) })

export const ColumnMoneyNumberFormatter: ColumnOptionFormatter = (value: number | string) => ({
  value: value === '' ? '-' : formatNumber(value),
})

export const ColumnPositiveAndNegativeFormatter = (value: any) => ({
  value: /[\d.]+/.test(String(value)) ? formatNumber(value, 2) : value,
  class: Number(value) >= 0 ? 'win' : 'lose',
})
