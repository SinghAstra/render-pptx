import { kid, kids, numAttr, attr } from './xml'
import { readColor } from './color'
import { parseLine } from './line'
import { parseTextBody } from './text'
import type { PartCtx } from './context'
import type { TableData, TableNode, Cell, TextBody } from './types'
import { EMU, parseXfrm, hidden, shapeName } from './xfrm'
import { uid } from './shape'

export function parseTable(frame: Element, ctx: PartCtx): TableNode | null {
  if (hidden(frame)) return null
  const xfrm = parseXfrm(kid(frame, 'xfrm'))
  const tbl = kid(kid(kid(frame, 'graphic'), 'graphicData'), 'tbl')
  if (!xfrm || !tbl) return null
  const cols = kids(kid(tbl, 'tblGrid'), 'gridCol').map((c) => numAttr(c, 'w') / EMU)
  const rowsEl = kids(tbl, 'tr')
  const rows = rowsEl.map((tr) => ({
    h: numAttr(tr, 'h') / EMU,
    cells: kids(tr, 'tc').map((tc) => parseCell(tc, ctx)),
  }))
  const table: TableData = { cols, rows }
  return {
    kind: 'table',
    id: uid(),
    name: shapeName(frame),
    rect: xfrm.rect,
    rot: xfrm.rot,
    flipH: xfrm.flipH,
    flipV: xfrm.flipV,
    hidden: false,
    table,
  }
}

function parseCell(tc: Element, ctx: PartCtx): Cell {
  const tcPr = kid(tc, 'tcPr')
  const fillEl = kids(tcPr ?? tc, '*').find((c) => c.localName.endsWith('Fill'))
  const body = kid(tc, 'txBody')
  const text = parseTextBody(body, {
    theme: ctx.theme,
    colors: ctx.colors,
    sources: [kid(body, 'lstStyle'), ...ctx.textDefaults].filter((e): e is Element => !!e),
  })
  if (text) applyCellMetrics(text, tcPr)
  return {
    text,
    fill: fillEl ? readColor(fillEl.children[0], ctx.colors) : null,
    borders: {
      t: parseLine(kid(tcPr, 'lnT'), ctx.colors),
      r: parseLine(kid(tcPr, 'lnR'), ctx.colors),
      b: parseLine(kid(tcPr, 'lnB'), ctx.colors),
      l: parseLine(kid(tcPr, 'lnL'), ctx.colors),
    },
    colspan: Math.max(1, numAttr(tcPr, 'gridSpan', 1)),
    rowspan: Math.max(1, numAttr(tcPr, 'rowSpan', 1)),
    skip: numAttr(tcPr, 'hMerge') === 1 || numAttr(tcPr, 'vMerge') === 1,
    anchor: 'top',
  }
}

function applyCellMetrics(text: TextBody, tcPr: Element | undefined) {
  const margin = (name: string, d: number) => {
    const v = attr(tcPr, name)
    return v === undefined ? d : Number(v) / EMU
  }
  text.lIns = margin('marL', text.lIns)
  text.rIns = margin('marR', text.rIns)
  text.tIns = margin('marT', text.tIns)
  text.bIns = margin('marB', text.bIns)
  const anchor = attr(tcPr, 'anchor')
  if (anchor === 'ctr') text.anchor = 'middle'
  else if (anchor === 'b') text.anchor = 'bottom'
}
