import { formatNumber, formatDate } from '@/utils/utils'
import { ColumnOptionFormatter, ButtonOptionItem, DropdownOptionItem } from './PublicTable'
export function createMapFormatter(map: { [key: string]: any }): ColumnOptionFormatter {
  return (value: any, item: any) => ({
    value: map[value] || '-',
  })
}

export function createButtonsFormatter(buttons: ButtonOptionItem[]): ColumnOptionFormatter {
  return (_: any, item: any) => ({
    value: _,
    buttons: buttons.filter(b => !b.filter || b.filter(item)),
  })
}

export function createOptionsFormatter(dropdowns: DropdownOptionItem[]): ColumnOptionFormatter {
  return (_: any, item: any) => ({
    value: _,
    options: dropdowns.filter(b => !b.filter || b.filter(item)),
  })
}

export const DateFormatter: ColumnOptionFormatter = (value: number, item: any) => ({ value: formatDate(value) })

export const MoneyNumberFormatter: ColumnOptionFormatter = (value: number | string) => ({
  value: value === '' ? '-' : formatNumber(value),
})

export function statusFormatter(mapData: any): ColumnOptionFormatter {
  return (value, _item) => ({
    value: mapData[value],
  })
}
