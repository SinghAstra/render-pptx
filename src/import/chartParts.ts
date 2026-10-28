import { attr, kid, kids, numAttr } from './xml'
import { colorElement, readColor, type ColorCtx } from './color'
import { parseLine } from './line'
import type { Theme } from './theme'

export type ChartCtx = { colors: ColorCtx; theme: Theme; width: number; height: number }

const PT = 96 / 72

export function readFont(el: Element | undefined, colors: ColorCtx, theme: Theme) {
  const defRPr = kid(el, 'defRPr') ?? kid(kid(kid(el, 'p'), 'pPr'), 'defRPr')
  const size = Number(attr(defRPr, 'sz') ?? 1200) / 100
  const latin = kid(defRPr, 'latin')
  const face = attr(latin, 'typeface')
  const font = !face || face.startsWith('+mn') ? theme.minorFont : face.startsWith('+mj') ? theme.majorFont : face
  return {
    size: size * PT,
    family: font,
    color: readColor(colorElement(kid(defRPr, 'solidFill')), colors) ?? '#404040',
    bold: attr(defRPr, 'b') === '1',
  }
}

export function titleText(chart: Element): string {
  const title = kid(chart, 'title')
  if (!title) return ''
  const tx = kid(title, 'tx')
  const rich = kid(tx, 'rich')
  if (rich) {
    return kids(rich, 'p')
      .map((p) => kids(p, 'r').map((r) => kid(r, 't')?.textContent ?? '').join(''))
      .join('\n')
  }
  return ''
}

export function numFmt(el: Element | undefined): string {
  return attr(kid(el, 'numFmt'), 'formatCode') ?? ''
}

export function formatNumber(value: number, code: string): string {
  if (!Number.isFinite(value)) return ''
  const pct = code.includes('%')
  const v = pct ? value * 100 : value
  const decimals = (code.split('.')[1] ?? '').replace(/[^0#]/g, '').length
  const group = code.includes(',')
  let out = v.toFixed(decimals)
  if (group) {
    const parts = out.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    out = parts.join('.')
  }
  if (pct) out += '%'
  if (code.includes('$')) out = `$${out}`
  return out
}

export function cacheValues(cache: Element | undefined): { cats: (string | number)[]; values: (number | null)[] } {
  const cats: (string | number)[] = []
  const values: (number | null)[] = []
  const pts = kids(cache, 'pt')
  for (const pt of pts) {
    const idx = numAttr(pt, 'idx', 0)
    const v = kid(pt, 'v')?.textContent ?? ''
    cats[idx] = v
    const n = Number(v)
    values[idx] = Number.isFinite(n) ? n : null
  }
  return { cats, values }
}

export function seriesColor(ser: Element, ctx: ChartCtx, fallback: string): string {
  const spPr = kid(ser, 'spPr')
  const fill = kid(spPr, 'solidFill')
  if (fill) return readColor(colorElement(fill), ctx.colors) ?? fallback
  return fallback
}

export function dataLabelInfo(ser: Element, chartLevel: Element | undefined): { show: boolean; pos?: string; format?: string } {
  const own = kid(ser, 'dLbls')
  const glob = chartLevel ? kid(chartLevel, 'dLbls') : undefined
  const pick = (name: string) => kid(own, name) ?? kid(glob, name)
  const show = attr(pick('showVal'), 'val') === '1'
  return { show, pos: attr(pick('dLblPos'), 'val'), format: numFmt(pick('numFmt')) }
}

export function chartGridLine(axis: Element | undefined, ctx: ChartCtx): string | null {
  const grid = kid(axis, 'majorGridlines')
  if (!grid) return null
  const ln = kid(kid(grid, 'spPr'), 'ln')
  if (!ln) return 'rgba(0,0,0,0.15)'
  const line = parseLine(ln, ctx.colors)
  return line?.color ?? 'rgba(0,0,0,0.15)'
}

export function axisFont(axis: Element | undefined, ctx: ChartCtx) {
  return readFont(kid(axis, 'txPr'), ctx.colors, ctx.theme)
}
