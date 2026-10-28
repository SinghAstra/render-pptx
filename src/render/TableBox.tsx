import type { TableNode, Cell, Line } from '../import/types'
import { TextBlock } from './TextBlock'

export function TableBox({ node }: { node: TableNode }) {
  const { cols, rows } = node.table
  const xs: number[] = []
  let x = 0
  for (const w of cols) {
    xs.push(x)
    x += w
  }
  let y = 0
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {rows.map((row, ri) => {
        const top = y
        y += row.h
        return row.cells.map((cell, ci) => {
          if (cell.skip || ci >= cols.length) return null
          const width = spanWidth(cols, ci, cell.colspan)
          return (
            <div
              key={`${ri}-${ci}`}
              style={{
                position: 'absolute',
                left: xs[ci],
                top,
                width,
                height: row.h,
                background: cell.fill ?? undefined,
              }}
            >
              {cell.text ? <TextBlock body={cell.text} /> : null}
              <Edges cell={cell} width={width} height={row.h} />
            </div>
          )
        })
      })}
    </div>
  )
}

function spanWidth(cols: number[], start: number, span: number) {
  let w = 0
  for (let i = start; i < Math.min(cols.length, start + span); i++) w += cols[i]
  return w || cols[start] || 0
}

function Edges({ cell, width, height }: { cell: Cell; width: number; height: number }) {
  return (
    <>
      <Edge line={cell.borders.t} style={{ left: 0, top: 0, width, height: 0, borderTop: border(cell.borders.t) }} />
      <Edge line={cell.borders.b} style={{ left: 0, top: height, width, height: 0, borderTop: border(cell.borders.b) }} />
      <Edge line={cell.borders.l} style={{ left: 0, top: 0, width: 0, height, borderLeft: border(cell.borders.l) }} />
      <Edge line={cell.borders.r} style={{ left: width, top: 0, width: 0, height, borderLeft: border(cell.borders.r) }} />
    </>
  )
}

function border(line: Line | null) {
  if (!line || !line.color || !line.width) return undefined
  return `${Math.max(0.5, line.width)}px ${line.dash ? 'dashed' : 'solid'} ${line.color}`
}

function Edge({ style }: { line: Line | null; style: React.CSSProperties }) {
  return <div style={{ position: 'absolute', ...style }} />
}
