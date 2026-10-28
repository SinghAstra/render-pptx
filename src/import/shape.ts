import { kid, attr } from './xml'
import { colorElement, readColor } from './color'
import { parseFillEl, findFillEl, hasShadow } from './fill'
import { parseLine } from './line'
import { parseGeom } from './geometry'
import { parseXfrm, xfrmOf, hidden, shapeName } from './xfrm'
import { parseTextBody, type TextEnv } from './text'
import { styleRefs, themeFill, themeLine } from './style'
import { findPlaceholder, phOf, textStyleKey, type PartCtx, type Placeholders } from './context'
import type { ShapeNode } from './types'

export const uid = () => Math.random().toString(36).slice(2, 10)

const lst = (sp: Element | undefined) => kid(kid(sp, 'txBody'), 'lstStyle')
const bodyPr = (sp: Element | undefined) => kid(kid(sp, 'txBody'), 'bodyPr')

export function chainOf(sp: Element, phs?: Placeholders): Element[] {
  if (!phs) return [sp]
  const info = phOf(sp)
  const lp = findPlaceholder(info, phs.layout)
  const mp = findPlaceholder(info, phs.master)
  return [sp, lp, mp].filter((e): e is Element => !!e)
}

export function textEnv(sp: Element, chain: Element[], ctx: PartCtx): TextEnv {
  const info = phOf(sp)
  const key = info ? textStyleKey(info.type ?? 'body') : 'otherStyle'
  const style = kid(ctx.styles, key)
  const sources = [...chain.map((c) => lst(c)), ...(style ? [style] : []), ...ctx.textDefaults]
    .filter((e): e is Element => !!e)
  const bodyPrs = chain.map((c) => bodyPr(c)).filter((e): e is Element => !!e)
  return { theme: ctx.theme, colors: ctx.colors, sources, bodyPrs }
}

export async function parseShape(sp: Element, ctx: PartCtx, phs?: Placeholders): Promise<ShapeNode | null> {
  if (hidden(sp)) return null
  const chain = chainOf(sp, phs)
  const spPrs = chain.map((c) => kid(c, 'spPr')).filter((e): e is Element => !!e)
  const xfrm = spPrs.map((p) => parseXfrm(xfrmOf(p))).find((x) => !!x)
  if (!xfrm) return null
  const refs = styleRefs(sp)
  const phClrOf = (ref: Element | undefined) => (ref ? readColor(colorElement(ref), ctx.colors) ?? undefined : undefined)
  const fillEl = spPrs.map(findFillEl).find((e) => !!e)
  let fill = fillEl ? parseFillEl(fillEl, ctx.colors, imgResolver(ctx)) : null
  if (!fill && !fillEl) {
    const tf = themeFill(refs.fillRef, ctx.fmt)
    if (tf) fill = parseFillEl(tf, { ...ctx.colors, phClr: phClrOf(refs.fillRef) }, imgResolver(ctx))
  }
  const lnEl = spPrs.map((p) => kid(p, 'ln')).find((e) => !!e)
  let line = lnEl ? parseLine(lnEl, ctx.colors) : null
  if (!line) {
    const tl = themeLine(refs.lnRef, ctx.fmt)
    if (tl) line = parseLine(tl, { ...ctx.colors, phClr: phClrOf(refs.lnRef) })
  }
  const geom = spPrs.map(parseGeom).find((g) => !!g) ?? null
  const text = parseTextBody(kid(sp, 'txBody'), textEnv(sp, chain, ctx))
  const fontColor = refs.fontRef ? readColor(colorElement(refs.fontRef), ctx.colors) : null
  if (text && fontColor) {
    text.paragraphs.forEach((p) => p.runs.forEach((r) => (r.color = r.color ?? fontColor)))
  }
  return {
    kind: 'shape',
    id: uid(),
    name: shapeName(sp),
    rect: xfrm.rect,
    rot: xfrm.rot,
    flipH: xfrm.flipH,
    flipV: xfrm.flipV,
    hidden: false,
    geom,
    fill,
    line,
    text,
    shadow: hasShadow(spPrs[0]),
  }
}

export function imgResolver(ctx: PartCtx) {
  return (embedId: string) => ctx.images.get(embedId) ?? ''
}

export function cropRect(el: Element | undefined) {
  const n = (name: string) => Number(attr(el, name) ?? 0) / 100000
  return { l: n('l'), t: n('t'), r: n('r'), b: n('b') }
}
