import { kid, numAttr } from './xml'
import { readColor, colorElement } from './color'
import { parseFillEl, findFillEl } from './fill'
import { parseElement } from './tree'
import { phOf, type PartCtx, type Placeholders } from './context'
import { imgResolver } from './shape'
import type { SlideNode } from './types'

export function buildClrMap(colors: Record<string, string>, clrMap: Element | undefined): Record<string, string> {
  if (!clrMap) return colors
  const out: Record<string, string> = { ...colors }
  for (const a of Array.from(clrMap.attributes)) {
    const mapped = colors[a.value]
    if (mapped) out[a.localName] = mapped
  }
  return out
}

export function clrMapOverride(doc: Document | null): Element | undefined {
  return kid(kid(doc?.documentElement, 'clrMapOvr'), 'overrideClrMapping')
}

export function applyClrOverride(colors: Record<string, string>, override: Element | undefined): Record<string, string> {
  return override ? buildClrMap(colors, override) : colors
}

export function masterTxStyles(master: Document | null): Element | undefined {
  return kid(master?.documentElement, 'txStyles')
}

export function textStyleKey(type: string | undefined): string {
  if (type === 'title' || type === 'ctrTitle') return 'titleStyle'
  if (type === 'body' || type === 'subTitle' || type === 'obj' || !type) return 'bodyStyle'
  return 'otherStyle'
}

export function parseBg(bg: Element | undefined, ctx: PartCtx): string | null {
  if (!bg) return null
  const pr = kid(bg, 'bgPr')
  if (pr) {
    const fill = findFillEl(pr)
    if (fill) return parseFillEl(fill, ctx.colors, imgResolver(ctx))
    return 'white'
  }
  const ref = kid(bg, 'bgRef')
  if (ref) {
    const idx = numAttr(ref, 'idx', 1)
    const i = idx >= 1001 ? idx - 1001 : idx - 1
    const fill = ctx.fmt.bgs[i]
    if (!fill) return null
    const phClr = readColor(colorElement(ref), ctx.colors) ?? undefined
    return parseFillEl(fill, { ...ctx.colors, phClr }, imgResolver(ctx))
  }
  return null
}

export function backgroundOf(docs: (Document | null)[], ctx: PartCtx): string {
  for (const doc of docs) {
    const bg = kid(kid(doc?.documentElement, 'cSld'), 'bg')
    const parsed = parseBg(bg, ctx)
    if (parsed) return parsed
  }
  return '#ffffff'
}

export async function shapesOf(tree: Element | undefined, ctx: PartCtx, phs?: Placeholders, skipPlaceholders = false): Promise<SlideNode[]> {
  if (!tree) return []
  const out: SlideNode[] = []
  for (const el of Array.from(tree.children)) {
    if (skipPlaceholders && phOf(el)) continue
    const node = await parseElement(el, ctx, phs)
    if (node) out.push(node)
  }
  return out
}

export function spTreeOf(doc: Document | null): Element | undefined {
  return kid(kid(doc?.documentElement, 'cSld'), 'spTree')
}
