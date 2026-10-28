import { attr, kid, kids, numAttr } from './xml'

export type StyleRefs = {
  fillRef?: Element
  lnRef?: Element
  fontRef?: Element
  effectRef?: Element
}

export function styleRefs(sp: Element | undefined): StyleRefs {
  const st = kid(sp, 'style')
  if (!st) return {}
  return {
    fillRef: kid(st, 'fillRef'),
    lnRef: kid(st, 'lnRef'),
    fontRef: kid(st, 'fontRef'),
    effectRef: kid(st, 'effectRef'),
  }
}

export type ThemeFmt = { fills: Element[]; lines: Element[]; bgs: Element[] }

export function parseThemeFmt(doc: Document | null): ThemeFmt {
  const fmt = doc ? kid(kid(doc.documentElement, 'themeElements'), 'fmtScheme') : null
  return {
    fills: kids(kid(fmt, 'fillStyleLst'), '*'),
    lines: kids(kid(fmt, 'lnStyleLst'), 'ln'),
    bgs: kids(kid(fmt, 'bgFillStyleLst'), '*'),
  }
}

export function themeFill(ref: Element | undefined, fmt: ThemeFmt): Element | undefined {
  if (!ref) return undefined
  const idx = numAttr(ref, 'idx', 0)
  if (idx <= 0 || !fmt.fills.length) return undefined
  return fmt.fills[(idx - 1) % fmt.fills.length]
}

export function themeLine(ref: Element | undefined, fmt: ThemeFmt): Element | undefined {
  if (!ref) return undefined
  const idx = numAttr(ref, 'idx', 0)
  if (idx <= 0 || !fmt.lines.length) return undefined
  return fmt.lines[(idx - 1) % fmt.lines.length]
}

export function refIdx(ref: Element | undefined): number {
  return numAttr(ref, 'idx', 0)
}

export function styleFont(ref: Element | undefined): { major: boolean; color?: Element } {
  const idx = attr(ref, 'idx') ?? 'minor'
  return { major: idx === 'major', color: ref ? kids(ref, '*')[0] : undefined }
}
