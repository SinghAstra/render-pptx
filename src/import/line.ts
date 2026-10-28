import { attr, kid, kids, numAttr } from './xml'
import { readColor, type ColorCtx } from './color'
import type { Line } from './types'

const DASHES: Record<string, number[]> = {
  solid: [],
  dot: [1, 3],
  sysDot: [1, 2],
  dash: [4, 3],
  sysDash: [3, 1],
  lgDash: [8, 3],
  dashDot: [4, 3, 1, 3],
  sysDashDot: [3, 1, 1, 1],
  lgDashDot: [8, 3, 1, 3],
  lgDashDotDot: [8, 3, 1, 3, 1, 3],
}

const ARROWS: Record<string, string> = {
  none: '',
  triangle: 'triangle',
  stealth: 'stealth',
  arrow: 'arrow',
  oval: 'oval',
  diamond: 'diamond',
}

export function parseLine(ln: Element | undefined, ctx: ColorCtx): Line | null {
  if (!ln) return null
  const noFill = kids(ln, 'noFill').length > 0
  const solid = kid(ln, 'solidFill') ?? kid(ln, 'gradFill')
  const color = noFill ? null : solid ? readColor(solid.children[0], ctx) : null
  const widthEmu = numAttr(ln, 'w', 0)
  if (!color && !noFill) return { color: null, width: 0, dash: null, beginArrow: null, endArrow: null, cap: 'flat' }
  const width = widthEmu ? widthEmu / 9525 : 1
  const dashEl = kid(ln, 'prstDash')
  const dashKey = dashEl ? attr(dashEl, 'val') ?? 'solid' : 'solid'
  const dash = (DASHES[dashKey] ?? []).map((d) => d * Math.max(width, 0.5))
  const head = kid(ln, 'headEnd')
  const tail = kid(ln, 'tailEnd')
  const capAttr = attr(ln, 'cap')
  return {
    color,
    width,
    dash: dash.length ? dash : null,
    beginArrow: head ? ARROWS[attr(head, 'type') ?? 'none'] || null : null,
    endArrow: tail ? ARROWS[attr(tail, 'type') ?? 'none'] || null : null,
    cap: capAttr === 'rnd' ? 'round' : capAttr === 'sq' ? 'square' : 'flat',
  }
}

export function arrowPath(kind: string, size: number): string {
  const s = size
  switch (kind) {
    case 'oval':
      return `M0 ${-s / 2} a ${s / 2} ${s / 2} 0 1 0 0.01 0 Z`
    case 'diamond':
      return `M0 0 L${-s} ${-s / 2} L${-s * 1.6} 0 L${-s} ${s / 2} Z`
    case 'stealth':
      return `M0 0 L${-s * 1.6} ${-s / 2} L${-s * 1.1} 0 L${-s * 1.6} ${s / 2} Z`
    default:
      return `M0 0 L${-s * 1.6} ${-s / 2} L${-s * 1.6} ${s / 2} Z`
  }
}
