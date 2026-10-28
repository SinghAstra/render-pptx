import { kid, attr } from './xml'
import { parseXfrm, xfrmOf, groupXfrm, hidden, shapeName } from './xfrm'
import { parseShape, uid } from './shape'
import { parsePicture } from './picture'
import { parseTable } from './table'
import { parseChart } from './chart'
import { parseLine } from './line'
import { parseGeom } from './geometry'
import type { PartCtx, Placeholders } from './context'
import type { GroupNode, LineNode, SlideNode, Rect } from './types'

export async function parseTree(tree: Element, ctx: PartCtx, phs?: Placeholders): Promise<SlideNode[]> {
  const out: SlideNode[] = []
  for (const el of Array.from(tree.children)) {
    const node = await parseElement(el, ctx, phs)
    if (node) out.push(node)
  }
  return out
}

export async function parseElement(el: Element, ctx: PartCtx, phs?: Placeholders): Promise<SlideNode | null> {
  switch (el.localName) {
    case 'sp':
      return parseShape(el, ctx, phs)
    case 'pic':
      return parsePicture(el, ctx, phs)
    case 'grpSp':
      return parseGroup(el, ctx, phs)
    case 'cxnSp':
      return parseConnector(el, ctx)
    case 'graphicFrame':
      return parseFrame(el, ctx)
    default:
      return null
  }
}

async function parseFrame(el: Element, ctx: PartCtx): Promise<SlideNode | null> {
  const data = kid(kid(el, 'graphic'), 'graphicData')
  const uri = attr(data, 'uri') ?? ''
  if (uri.endsWith('/table')) return parseTable(el, ctx)
  if (uri.endsWith('/chart')) return parseChart(el, ctx)
  return null
}

async function parseGroup(grpSp: Element, ctx: PartCtx, phs?: Placeholders): Promise<GroupNode | null> {
  if (hidden(grpSp)) return null
  const { base, chOff, chSize } = groupXfrm(grpSp)
  const children = await parseTree(grpSp, ctx, phs)
  if (!children.length) return null
  const rect = base.rect.w && base.rect.h ? base.rect : bbox(children)
  return {
    kind: 'group',
    id: uid(),
    name: shapeName(grpSp),
    rect,
    rot: base.rot,
    flipH: base.flipH,
    flipV: base.flipV,
    hidden: false,
    children,
    chOff,
    chSize: { w: chSize.w || rect.w, h: chSize.h || rect.h },
  }
}

function bbox(nodes: SlideNode[]): Rect {
  const xs = nodes.map((n) => n.rect.x)
  const ys = nodes.map((n) => n.rect.y)
  const x2 = nodes.map((n) => n.rect.x + n.rect.w)
  const y2 = nodes.map((n) => n.rect.y + n.rect.h)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, w: Math.max(...x2) - x, h: Math.max(...y2) - y }
}

function parseConnector(el: Element, ctx: PartCtx): LineNode | null {
  if (hidden(el)) return null
  const spPr = kid(el, 'spPr')
  const xfrm = parseXfrm(xfrmOf(spPr))
  if (!xfrm) return null
  const line = parseLine(kid(spPr, 'ln'), ctx.colors)
  const geom = parseGeom(spPr)
  return {
    kind: 'line',
    id: uid(),
    name: shapeName(el),
    rect: xfrm.rect,
    rot: xfrm.rot,
    flipH: xfrm.flipH,
    flipV: xfrm.flipV,
    hidden: false,
    line: line ?? { color: 'rgba(0,0,0,1)', width: 1, dash: null, beginArrow: null, endArrow: null, cap: 'flat' },
    preset: geom?.preset ?? 'line',
  }
}
