import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { ChartNode } from '../import/types'

export function ChartBox({ node }: { node: ChartNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current, undefined, { renderer: 'svg' })
    chart.setOption(node.chart.option as never, true)
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(ref.current)
    return () => {
      ro.disconnect()
      chart.dispose()
    }
  }, [node])
  return <div ref={ref} style={{ position: 'absolute', inset: 0, background: node.chart.transparent ? 'transparent' : undefined }} />
}
