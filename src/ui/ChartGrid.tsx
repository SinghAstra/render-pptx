import { useEffect, useRef, useState } from 'react'
import type { ChartNode } from '../import/types'
import { useDeck } from '../store'
import { emptySeries } from '../chartEdit'

export function ChartGrid({ node }: { node: ChartNode }) {
  const patchChart = useDeck((s) => s.patchChart)
  const begin = useDeck((s) => s.begin)
  const [rev, setRev] = useState(0)
  const dirty = useRef(false)
  const chart = node.chart
  const cats = chart.categories
  const series = chart.series
  const start = () => {
    if (dirty.current) return
    dirty.current = true
    begin()
  }
  const commit = (nextCats: string[], nextSeries: typeof series) => {
    start()
    patchChart(node.id, nextCats, nextSeries)
  }
  const setCategory = (row: number, value: string) => {
    const next = [...cats]
    next[row] = value
    commit(next, series)
  }
  const setValue = (col: number, row: number, value: number | null) => {
    const next = series.map((s, i) => (i === col ? { ...s, values: s.values.map((v, r) => (r === row ? value : v)) } : s))
    commit(cats, next)
  }
  const setSeriesName = (col: number, name: string) => {
    commit(cats, series.map((s, i) => (i === col ? { ...s, name } : s)))
  }
  const addRow = () => {
    commit([...cats, `Category ${cats.length + 1}`], series.map((s) => ({ ...s, values: [...s.values, 0] })))
    setRev((v) => v + 1)
  }
  const removeRow = (row: number) => {
    commit(cats.filter((_, i) => i !== row), series.map((s) => ({ ...s, values: s.values.filter((_, i) => i !== row) })))
    setRev((v) => v + 1)
  }
  const addSeries = () => {
    commit(cats, [...series, emptySeries(`Series ${series.length + 1}`, cats.length)])
    setRev((v) => v + 1)
  }
  const removeSeries = (col: number) => {
    if (series.length <= 1) return
    commit(cats, series.filter((_, i) => i !== col))
    setRev((v) => v + 1)
  }
  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain')
    if (!/[\t\n]/.test(text)) return
    const el = e.target as HTMLElement
    const row = Number(el.dataset.row)
    const col = Number(el.dataset.col)
    if (!Number.isFinite(row) || !Number.isFinite(col)) return
    e.preventDefault()
    const rows = text
      .replace(/\r/g, '')
      .split('\n')
      .filter((line) => line.length)
      .map((line) => line.split('\t'))
    const nextCats = [...cats]
    const nextSeries = series.map((s) => ({ ...s, values: [...s.values] }))
    while (nextCats.length < row + rows.length) nextCats.push(`Category ${nextCats.length + 1}`)
    for (const s of nextSeries) while (s.values.length < nextCats.length) s.values.push(0)
    while (nextSeries.length < col + (rows[0]?.length ?? 1)) nextSeries.push(emptySeries(`Series ${nextSeries.length + 1}`, nextCats.length))
    rows.forEach((line, r) =>
      line.forEach((cell, c) => {
        const num = Number(cell.replace(/[%$,]/g, ''))
        const target = nextSeries[col + c]
        if (!target) return
        target.values[row + r] = Number.isFinite(num) && cell.trim() !== '' ? num : null
      }),
    )
    commit(nextCats, nextSeries)
    setRev((v) => v + 1)
  }
  useEffect(() => {
    dirty.current = false
  }, [node.id])
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-[#6b7280]">Chart data</span>
        <div className="flex gap-1">
          <TinyButton onClick={addRow} title="Add row">
            + Row
          </TinyButton>
          <TinyButton onClick={addSeries} title="Add series">
            + Series
          </TinyButton>
        </div>
      </div>
      <div className="max-h-[300px] overflow-auto rounded border border-[#e3e5e8]" key={rev} onPaste={onPaste}>
        <table className="border-collapse text-[11px] w-full">
          <thead className="sticky top-0 bg-[#f7f8fa]">
            <tr>
              <th className="text-left font-normal text-[#6b7280] px-1.5 py-1 border-b border-[#e3e5e8]">Category</th>
              {series.map((s, col) => (
                <th key={col} className="border-b border-l border-[#e3e5e8] p-0">
                  <div className="flex items-center">
                    <input
                      value={s.name}
                      onChange={(e) => setSeriesName(col, e.target.value)}
                      className="w-full min-w-[64px] bg-transparent px-1.5 py-1 text-[11px] font-normal focus:outline-none"
                    />
                    <button
                      onClick={() => removeSeries(col)}
                      title="Remove series"
                      className="px-1 text-[#9ca3af] hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cats.map((cat, row) => (
              <tr key={row} className="group">
                <td className="px-0 border-b border-[#f1f2f4]">
                  <div className="flex items-center">
                    <input
                      value={cat}
                      onChange={(e) => setCategory(row, e.target.value)}
                      className="w-full min-w-[80px] bg-transparent px-1.5 py-1 text-[11px] focus:outline-none"
                    />
                    <button
                      onClick={() => removeRow(row)}
                      title="Remove row"
                      className="px-1 text-[#c9ccd1] opacity-0 group-hover:opacity-100 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                </td>
                {series.map((s, col) => (
                  <td key={col} className="border-b border-l border-[#f1f2f4] p-0">
                    <Cell
                      value={s.values[row]}
                      row={row}
                      col={col}
                      onCommit={(v) => setValue(col, row, v)}
                      onDone={() => {
                        dirty.current = false
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-1.5 text-[10px] text-[#9ca3af]">Paste from Excel: select a cell, then Ctrl+V</div>
    </div>
  )
}

function Cell({
  value,
  row,
  col,
  onCommit,
  onDone,
}: {
  value: number | null
  row: number
  col: number
  onCommit: (v: number | null) => void
  onDone: () => void
}) {
  const shown = value === null || value === undefined ? '' : String(Math.round(value * 10000) / 10000)
  const [text, setText] = useState(shown)
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setText(shown)
  }, [shown])
  return (
    <input
      data-row={row}
      data-col={col}
      value={text}
      onFocus={(e) => {
        focused.current = true
        e.target.select()
      }}
      onBlur={() => {
        focused.current = false
        setText(shown)
        onDone()
      }}
      onChange={(e) => {
        setText(e.target.value)
        const cleaned = e.target.value.replace(/[%$,]/g, '').trim()
        onCommit(cleaned === '' ? null : Number.isFinite(Number(cleaned)) ? Number(cleaned) : null)
      }}
      className="w-full min-w-[52px] bg-transparent px-1.5 py-1 text-right tabular-nums focus:outline-none focus:bg-[#eff6ff]"
    />
  )
}

function TinyButton({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="h-5 px-1.5 rounded border border-[#d5d9df] bg-white text-[10px] text-[#4b5563] hover:border-[#2563eb] hover:text-[#2563eb]"
    >
      {children}
    </button>
  )
}
