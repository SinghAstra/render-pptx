import type { ChartData, ChartSeriesData } from './import/types'

type SeriesLike = { type?: string; data?: unknown[]; [key: string]: unknown }

export function applyChartData(data: ChartData): Record<string, unknown> {
  const option = { ...data.option } as Record<string, unknown>
  const list = Array.isArray(option.series) ? (option.series as SeriesLike[]) : []
  option.series = list.map((series, i) => {
    const def = data.series[i]
    if (!def) return series
    const prev = Array.isArray(series.data) ? series.data : []
    const next = def.values.map((value, index) => {
      const item = prev[index]
      const style = item && typeof item === 'object' ? (item as { itemStyle?: unknown }).itemStyle : undefined
      if (data.pie || series.type === 'pie') {
        return { value, name: data.categories[index] ?? '', ...(style ? { itemStyle: style } : {}) }
      }
      return style ? { value, itemStyle: style } : value
    })
    return { ...series, name: def.name, data: next }
  })
  for (const key of ['xAxis', 'yAxis']) {
    const axis = option[key] as { type?: string; data?: unknown } | undefined
    if (axis && axis.type === 'category') option[key] = { ...axis, data: data.categories }
  }
  return option
}

export function emptySeries(name: string, rows: number): ChartSeriesData {
  return { name, values: new Array(rows).fill(0), format: '' }
}
