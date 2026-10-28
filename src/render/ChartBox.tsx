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
  const title = node.chart.title
  return (
    <>
      <div ref={ref} style={{ position: 'absolute', inset: 0, background: node.chart.transparent ? 'transparent' : undefined }} />
      {title ? (
        <div
          style={{
            position: 'absolute',
            left: `${title.left * 100}%`,
            top: `${title.top * 100}%`,
            width: `${title.width * 100}%`,
            textAlign: title.align,
            lineHeight: 1.2,
            pointerEvents: 'none',
            whiteSpace: 'pre-wrap',
          }}
        >
          {title.runs.map((r, i) => (
            <span
              key={i}
              style={{
                fontSize: r.size,
                color: r.color,
                fontWeight: r.bold ? 700 : 400,
                fontFamily: `"${r.font}", "Segoe UI", Arial, sans-serif`,
                whiteSpace: 'pre-wrap',
              }}
            >
              {r.text}
            </span>
          ))}
        </div>
      ) : null}
    </>
  )
}
