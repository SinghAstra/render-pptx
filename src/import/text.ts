import { attr, kid, kids, numAttr, boolAttr } from './xml'
import { colorElement, readColor, type ColorCtx } from './color'
import type { TextBody, TextParagraph, TextRun } from './types'
import type { Theme } from './theme'

export type TextEnv = { theme: Theme; colors: ColorCtx; sources: Element[]; bodyPrs?: Element[] }

const PT = 96 / 72
const EMU = 9525

type LevelProps = { ppr: Element[]; rpr: Element[] }

function levelProps(env: TextEnv, lvl: number): LevelProps {
  const ppr: Element[] = []
  const rpr: Element[] = []
  for (const src of env.sources) {
    const lvlEl = kid(src, `lvl${lvl + 1}pPr`)
    if (lvlEl) {
      ppr.push(lvlEl)
      const d = kid(lvlEl, 'defRPr')
      if (d) rpr.push(d)
    }
    const def = kid(src, 'defPPr')
    if (def) {
      ppr.push(def)
      const d = kid(def, 'defRPr')
      if (d) rpr.push(d)
    }
  }
  return { ppr, rpr }
}

function pickAttr(els: Element[], name: string): string | undefined {
  for (const el of els) {
    const v = attr(el, name)
    if (v !== undefined) return v
  }
  return undefined
}

function pickChild(els: Element[], name: string): Element | undefined {
  for (const el of els) {
    const c = kid(el, name)
    if (c) return c
  }
  return undefined
}

function pickColor(els: Element[], ctx: ColorCtx): string | null | undefined {
  for (const el of els) {
    const fill = kid(el, 'solidFill') ?? kid(el, 'gradFill')
    if (fill) return readColor(colorElement(fill), ctx) ?? null
    if (kid(el, 'noFill')) return null
  }
  return undefined
}

export function fontFace(face: string, theme: Theme): string {
  if (face.startsWith('+mj')) return theme.majorFont
  if (face.startsWith('+mn')) return theme.minorFont
  return face
}

function fontName(rpr: Element[], theme: Theme): string {
  for (const el of rpr) {
    const face = attr(kid(el, 'latin'), 'typeface') ?? attr(kid(el, 'ea'), 'typeface')
    if (face) return fontFace(face, theme)
  }
  return theme.minorFont
}

function runStyle(rpr: Element[], env: TextEnv, level: LevelProps): Omit<TextRun, 'text'> {
  const all = [...rpr, ...level.rpr]
  const sizePt = Number(pickAttr(all, 'sz') ?? 1800) / 100
  const baseline = Number(pickAttr(all, 'baseline') ?? 0)
  const bold = all.find((e) => attr(e, 'b') !== undefined)
  const italic = all.find((e) => attr(e, 'i') !== undefined)
  const under = all.find((e) => attr(e, 'u') !== undefined)
  const strike = all.find((e) => attr(e, 'strike') !== undefined)
  const highlight = pickChild(all, 'highlight')
  return {
    size: sizePt * PT,
    bold: boolAttr(bold, 'b'),
    italic: boolAttr(italic, 'i'),
    underline: (attr(under, 'u') ?? 'none') !== 'none',
    strike: (attr(strike, 'strike') ?? 'noStrike') !== 'noStrike',
    color: pickColor(all, env.colors) ?? null,
    font: fontName(all, env.theme),
    sup: baseline > 0,
    sub: baseline < 0,
    spacing: (Number(pickAttr(all, 'spc') ?? 0) / 100) * PT,
    highlight: highlight ? readColor(colorElement(highlight), env.colors) : null,
  } as Omit<TextRun, 'text'>
}

function lineHeightOf(ppr: Element[], fallback: number): number {
  const ln = pickChild(ppr, 'lnSpc')
  if (!ln) return fallback
  const pct = kid(ln, 'spcPct')
  if (pct) return (numAttr(pct, 'val', 100000) / 100000) * 1.2
  const pts = kid(ln, 'spcPts')
  if (pts) return numAttr(pts, 'val', 0) / 100
  return fallback
}

function spacingOf(ppr: Element[], name: string, fontSize: number): number {
  const el = pickChild(ppr, name)
  if (!el) return 0
  const pct = kid(el, 'spcPct')
  if (pct) return (numAttr(pct, 'val', 0) / 100000) * 1.2 * fontSize
  const pts = kid(el, 'spcPts')
  if (pts) return (numAttr(pts, 'val', 0) / 100) * PT
  return 0
}

function bulletOf(ppr: Element[]): { text: string | null; start: number } {
  if (pickChild(ppr, 'buNone')) return { text: null, start: 0 }
  const char = attr(pickChild(ppr, 'buChar'), 'char')
  if (char) return { text: char, start: 0 }
  const auto = pickChild(ppr, 'buAutoNum')
  if (auto) return { text: 'auto', start: Number(attr(auto, 'startAt') ?? 1) }
  return { text: null, start: 0 }
}

export function parseTextBody(txBody: Element | undefined, env: TextEnv): TextBody | null {
  if (!txBody) return null
  const bodyPr = kid(txBody, 'bodyPr')
  const bodyPrs = [bodyPr, ...(env.bodyPrs ?? [])].filter((b): b is Element => !!b)
  const bodyAttr = (name: string): string | undefined => {
    for (const b of bodyPrs) {
      const v = attr(b, name)
      if (v !== undefined) return v
    }
    return undefined
  }
  const bodyChild = (name: string): Element | undefined => {
    for (const b of bodyPrs) {
      const c = kid(b, name)
      if (c) return c
    }
    return undefined
  }
  const autoFit = bodyChild('normAutofit')
  const scale = autoFit ? numAttr(autoFit, 'fontScale', 100000) / 100000 : 1
  const lnReduction = autoFit ? numAttr(autoFit, 'lnSpcReduction', 0) / 100000 : 0
  const anchorAttr = bodyAttr('anchor') ?? 't'
  const vert = bodyAttr('vert') ?? 'horz'
  const ins = (name: string, fallback: number) => {
    const v = bodyAttr(name)
    return v === undefined ? fallback : Number(v) / EMU
  }
  const paragraphs = kids(txBody, 'p')
    .map((p) => parseParagraph(p, env, scale, lnReduction))
    .filter((p): p is TextParagraph => !!p)
  if (!paragraphs.length) return null
  const anchor = anchorAttr === 'ctr' ? 'middle' : anchorAttr === 'b' ? 'bottom' : 'top'
  return {
    paragraphs,
    anchor,
    lIns: ins('lIns', 91440 / EMU),
    rIns: ins('rIns', 91440 / EMU),
    tIns: ins('tIns', 45720 / EMU),
    bIns: ins('bIns', 45720 / EMU),
    wrap: bodyAttr('wrap') !== 'none',
    vertical: vert === 'vert' || vert === 'vert270' || vert === 'wordArtVert',
    rot: vert === 'vert270' ? -90 : 90,
    sizeScale: scale,
    shrink: !!autoFit && autoFit.getAttribute('fontScale') === null,
  }
}

function parseParagraph(p: Element, env: TextEnv, scale: number, lnReduction: number): TextParagraph | null {
  const pPr = kid(p, 'pPr')
  const endPr = kid(p, 'endParaRPr')
  const lvl = numAttr(pPr, 'lvl', 0)
  const level = levelProps(env, lvl)
  const pprs = [...(pPr ? [pPr] : []), ...level.ppr]
  const runs: TextRun[] = []
  const base = runStyle(endPr ? [endPr] : [], env, level)
  for (const child of Array.from(p.children)) {
    const name = child.localName
    if (name !== 'r' && name !== 'fld' && name !== 'br') continue
    if (name === 'br') {
      runs.push({ text: '\n', ...base })
      continue
    }
    const rPr = kid(child, 'rPr')
    const text = kid(child, 't')?.textContent ?? ''
    runs.push({ text, ...runStyle(rPr ? [rPr] : [], env, level) })
  }
  if (!runs.length) runs.push({ text: '', ...base })
  const size = (runs[0]?.size ?? base.size) * scale
  const bullet = bulletOf(pprs)
  return {
    runs: runs.map((r) => ({ ...r, size: r.size * scale })),
    align: alignOf(pickAttr(pprs, 'algn')),
    level: lvl,
    bullet: bullet.text === 'auto' ? `${bullet.start}.` : bullet.text,
    bulletIndent: -Number(pickAttr(pprs, 'indent') ?? 0) / EMU,
    marL: Number(pickAttr(pprs, 'marL') ?? 0) / EMU,
    indent: Number(pickAttr(pprs, 'indent') ?? 0) / EMU,
    lineHeight: Math.max(0.75, lineHeightOf(pprs, 1.2) - lnReduction),
    spaceBefore: spacingOf(pprs, 'spcBef', size),
    spaceAfter: spacingOf(pprs, 'spcAft', size),
    rtl: false,
  }
}

function alignOf(v: string | undefined): TextParagraph['align'] {
  if (v === 'ctr') return 'center'
  if (v === 'r') return 'right'
  if (v === 'just' || v === 'dist' || v === 'thaiDist') return 'justify'
  return 'left'
}
