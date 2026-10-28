import { attr, kid, numAttr, boolAttr } from './xml'
import type { Rect } from './types'

export const EMU = 9525

export type Xfrm = { rect: Rect; rot: number; flipH: boolean; flipV: boolean }

export function parseXfrm(el: Element | undefined): Xfrm | null {
  if (!el) return null
  const off = kid(el, 'off')
  const ext = kid(el, 'ext')
  if (!off || !ext) return null
  return {
    rect: {
      x: numAttr(off, 'x') / EMU,
      y: numAttr(off, 'y') / EMU,
      w: numAttr(ext, 'cx') / EMU,
      h: numAttr(ext, 'cy') / EMU,
    },
    rot: numAttr(el, 'rot') / 60000,
    flipH: boolAttr(el, 'flipH'),
    flipV: boolAttr(el, 'flipV'),
  }
}

export function xfrmOf(pr: Element | undefined): Element | undefined {
  return kid(pr, 'xfrm')
}

export function groupXfrm(grpSp: Element) {
  const xfrm = kid(kid(grpSp, 'grpSpPr'), 'xfrm')
  const base = parseXfrm(xfrm)
  const chOff = kid(xfrm, 'chOff')
  const chExt = kid(xfrm, 'chExt')
  return {
    base: base ?? { rect: { x: 0, y: 0, w: 0, h: 0 }, rot: 0, flipH: false, flipV: false },
    chOff: { x: numAttr(chOff, 'x') / EMU, y: numAttr(chOff, 'y') / EMU },
    chSize: { w: numAttr(chExt, 'cx') / EMU, h: numAttr(chExt, 'cy') / EMU },
  }
}

export function hidden(el: Element): boolean {
  const nv = Array.from(el.children).find((c) => c.localName.startsWith('nv'))
  return attr(kid(nv, 'cNvPr'), 'hidden') === '1'
}

export function shapeName(el: Element): string | undefined {
  const nv = Array.from(el.children).find((c) => c.localName.startsWith('nv'))
  return attr(kid(nv, 'cNvPr'), 'name')
}
