import { attr, kid, kids, numAttr, path, all } from './xml'
import { readColor, type ColorCtx } from './color'

export type ImageResolver = (embedId: string) => string | undefined

export function findFillEl(spPr: Element | undefined): Element | undefined {
  if (!spPr) return undefined
  const names = ['noFill', 'solidFill', 'gradFill', 'blipFill', 'pattFill', 'grpFill']
  return kids(spPr, '*').find((c) => names.includes(c.localName))
}

export function parseFillEl(
  el: Element | undefined,
  ctx: ColorCtx,
  img: ImageResolver,
): string | null {
  if (!el) return null
  switch (el.localName) {
    case 'noFill':
      return null
    case 'solidFill':
      return readColor(el.children[0], ctx)
    case 'gradFill':
      return gradient(el, ctx)
    case 'blipFill':
      return imageFill(el, img)
    case 'pattFill': {
      const fg = kid(el, 'fgClr')
      return fg ? readColor(fg.children[0], ctx) : null
    }
    default:
      return null
  }
}

export function parseFill(
  spPr: Element | undefined,
  ctx: ColorCtx,
  img: ImageResolver,
): string | null {
  if (!spPr) return null
  for (const el of kids(spPr, '*')) {
    switch (el.localName) {
      case 'noFill':
        return null
      case 'solidFill':
        return readColor(el.children[0], ctx)
      case 'gradFill':
        return gradient(el, ctx)
      case 'blipFill':
        return imageFill(el, img)
      case 'pattFill': {
        const fg = kid(el, 'fgClr')
        return fg ? readColor(fg.children[0], ctx) : null
      }
      case 'grpFill':
        return null
    }
  }
  return null
}

function gradient(el: Element, ctx: ColorCtx): string {
  const stops = kids(kid(el, 'gsLst'), 'gs')
    .map((gs) => {
      const pos = numAttr(gs, 'pos') / 1000
      const color = readColor(gs.children[0], ctx) ?? 'rgba(0,0,0,1)'
      return { pos, color }
    })
    .sort((a, b) => a.pos - b.pos)
  if (!stops.length) return 'transparent'
  const list = stops.map((s) => `${s.color} ${s.pos}%`).join(', ')
  const lin = kid(el, 'lin')
  const radial = kid(el, 'path')
  if (radial) {
    const fillTo = attr(radial, 'fillTo') ?? 'ctr'
    const at = fillTo === 't' ? 'center top' : fillTo === 'b' ? 'center bottom'
      : fillTo === 'l' ? 'left center' : fillTo === 'r' ? 'right center' : 'center'
    return `radial-gradient(circle at ${at}, ${list})`
  }
  const ang = lin ? numAttr(lin, 'ang', 0) / 60000 + 90 : 90
  return `linear-gradient(${ang}deg, ${list})`
}

export function imageFill(el: Element, img: ImageResolver): string | null {
  const blip = path(el, ['blip']) ?? kid(el, 'blip')
  const embed = blip ? findEmbed(blip) : undefined
  const src = embed ? img(embed) : undefined
  if (!src) return null
  const srcRect = kid(el, 'srcRect')
  const l = numAttr(srcRect, 'l') / 100000
  const t = numAttr(srcRect, 't') / 100000
  const r = numAttr(srcRect, 'r') / 100000
  const b = numAttr(srcRect, 'b') / 100000
  const tile = kid(el, 'tile')
  if (tile) return `url("${src}") left top / auto repeat`
  const w = 1 - l - r
  const h = 1 - t - b
  const size = w > 0 && h > 0 ? `${100 / w}% ${100 / h}%` : '100% 100%'
  const px = l + r > 0 ? (l / (l + r)) * 100 : 0
  const py = t + b > 0 ? (t / (t + b)) * 100 : 0
  return `url("${src}") ${px}% ${py}% / ${size} no-repeat`
}

export function findEmbed(el: Element): string | undefined {
  for (const a of Array.from(el.attributes)) {
    if (a.localName === 'embed' || a.localName === 'link') return a.value
  }
  const svg = all(el, 'svgBlip')[0]
  if (svg) {
    const a = Array.from(svg.attributes).find((x) => x.localName === 'embed')
    if (a) return a.value
  }
  return undefined
}

export function hasShadow(spPr: Element | undefined): boolean {
  const effect = kid(spPr, 'effectLst')
  if (!effect) return false
  return kids(effect, '*').some((e) => e.localName === 'outerShdw')
}
