import type { TableNode, Cell, Line } from '../import/types'
import { TextBlock } from './TextBlock'

export function TableBox({ node }: { node: TableNode }) {
  const { cols, rows } = node.table
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        display: 'grid',
        gridTemplateColumns: cols.map((w) => `${w}px`).join(' '),
        gridTemplateRows: rows.map((r) => `minmax(${r.h}px, auto)`).join(' '),
        alignContent: 'start',
        alignItems: 'stretch',
      }}
    >
      {rows.map((row, ri) =>
        row.cells.map((cell, ci) => {
          if (cell.skip || ci >= cols.length) return null
          return (
            <div
              key={`${ri}-${ci}`}
              style={{
                gridColumn: `${ci + 1} / span ${Math.min(cell.colspan, cols.length - ci)}`,
                gridRow: `${ri + 1} / span ${Math.min(cell.rowspan, rows.length - ri)}`,
                position: 'relative',
                background: cell.fill ?? undefined,
                minWidth: 0,
              }}
            >
              {cell.text ? <TextBlock body={cell.text} flow /> : null}
              <Edges cell={cell} />
            </div>
          )
        }),
      )}
    </div>
  )
}

function Edges({ cell }: { cell: Cell }) {
  return (
    <>
      <Edge style={{ left: 0, right: 0, top: 0, height: 0, borderTop: border(cell.borders.t) }} />
      <Edge style={{ left: 0, right: 0, bottom: 0, height: 0, borderTop: border(cell.borders.b) }} />
      <Edge style={{ top: 0, bottom: 0, left: 0, width: 0, borderLeft: border(cell.borders.l) }} />
      <Edge style={{ top: 0, bottom: 0, right: 0, width: 0, borderLeft: border(cell.borders.r) }} />
    </>
  )
}

function border(line: Line | null) {
  if (!line || !line.color || !line.width) return undefined
  return `${Math.max(0.5, line.width)}px ${line.dash ? 'dashed' : 'solid'} ${line.color}`
}

function Edge({ style }: { style: React.CSSProperties }) {
  return <div style={{ position: 'absolute', pointerEvents: 'none', ...style }} />
}
