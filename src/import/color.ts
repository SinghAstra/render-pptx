import { attr, kids } from './xml'

export type ColorCtx = { scheme: Record<string, string>; phClr?: string }

const PRESETS: Record<string, string> = {
  black: '000000', white: 'FFFFFF', red: 'FF0000', green: '008000', blue: '0000FF',
  yellow: 'FFFF00', gray: '808080', grey: '808080', orange: 'FFA500', purple: '800080',
  silver: 'C0C0C0', maroon: '800000', navy: '000080', teal: '008080', lime: '00FF00',
  aqua: '00FFFF', fuchsia: 'FF00FF', olive: '808000', brown: 'A52A2A', pink: 'FFC0CB',
  cyan: '00FFFF', magenta: 'FF00FF', darkblue: '00008B', darkgray: 'A9A9A9',
  lightgray: 'D3D3D3', lightgrey: 'D3D3D3', darkred: '8B0000', darkgreen: '006400',
  gold: 'FFD700', beige: 'F5F5DC', ivory: 'FFFFF0', khaki: 'F0E68C', indigo: '4B0082',
}

export const BLACK = 'rgba(0,0,0,1)'

function hex2rgb(h: string): [number, number, number] {
  const s = h.trim()
  const css = s.match(/^rgba?\(([^)]+)\)$/i)
  if (css) {
    const p = css[1].split(',').map((v) => Number(v.trim()))
    return [p[0] || 0, p[1] || 0, p[2] || 0]
  }
  const raw = s.replace('#', '')
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw.slice(0, 6).padEnd(6, '0')
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)]
}
function alphaOf(h: string): number {
  const css = h.trim().match(/^rgba\(([^)]+)\)$/i)
  if (!css) return 1
  const p = css[1].split(',')
  return p[3] === undefined ? 1 : Number(p[3])
}
function rgb2hex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}
function rgb2hsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6
  return [h, s, l]
}
function hsl2rgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const f = (t: number) => {
    let x = t
    if (x < 0) x += 1
    if (x > 1) x -= 1
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]
}

export function baseColor(el: Element, ctx: ColorCtx): string | null {
  const name = el.localName
  if (name === 'srgbClr') return attr(el, 'val') ?? null
  if (name === 'sysClr') return attr(el, 'lastClr') ?? '000000'
  if (name === 'prstClr') return PRESETS[(attr(el, 'val') ?? '').toLowerCase()] ?? null
  if (name === 'scrgbClr') {
    const p = (n: string) => Math.round((Number(attr(el, n) ?? 0) / 100000) * 255)
    return rgb2hex(p('r'), p('g'), p('b'))
  }
  if (name === 'hslClr') {
    const h = Number(attr(el, 'hue') ?? 0) / 21600000
    const s = Number(attr(el, 'sat') ?? 0) / 100000
    const l = Number(attr(el, 'lum') ?? 0) / 100000
    return rgb2hex(...hsl2rgb(h, s, l))
  }
  if (name === 'schemeClr') {
    const v = attr(el, 'val') ?? ''
    if (v === 'phClr') return ctx.phClr ?? null
    return ctx.scheme[v] ?? null
  }
  return null
}

export function readColor(el: Element | undefined, ctx: ColorCtx): string | null {
  if (!el) return null
  const base = baseColor(el, ctx)
  if (!base) return null
  let [r, g, b] = hex2rgb(base)
  let hsl = rgb2hsl(r, g, b)
  let alpha = alphaOf(base)
  for (const mod of kids(el, '*')) {
    const v = Number(attr(mod, 'val') ?? 0) / 100000
    switch (mod.localName) {
      case 'alpha':
        alpha = v
        break
      case 'lumMod':
        hsl[2] = hsl[2] * v
        break
      case 'lumOff':
        hsl[2] = Math.min(1, hsl[2] + v)
        break
      case 'satMod':
        hsl[1] *= v
        break
      case 'satOff':
        hsl[1] = Math.min(1, hsl[1] + v)
        break
      case 'hueMod':
        hsl[0] = (hsl[0] * v) % 1
        break
      case 'hueOff':
        hsl[0] = (hsl[0] + v + 1) % 1
        break
      case 'tint':
        hsl[2] = hsl[2] + (1 - hsl[2]) * (1 - v)
        break
      case 'shade':
        hsl[2] = hsl[2] * v
        break
      case 'comp':
        hsl[0] = (hsl[0] + 0.5) % 1
        break
      case 'inv':
        return `rgba(${255 - r},${255 - g},${255 - b},${alpha})`
      case 'gray': {
        const y = 0.299 * r + 0.587 * g + 0.114 * b
        return `rgba(${y},${y},${y},${alpha})`
      }
    }
    const d = (mod.getAttribute('val') ?? '').trim()
    if (d === '1' && mod.localName === 'alpha') alpha = 1
  }
  ;[r, g, b] = hsl2rgb(hsl[0], Math.max(0, Math.min(1, hsl[1])), Math.max(0, Math.min(1, hsl[2])))
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`
}

export function colorElement(parent: Element | undefined): Element | undefined {
  if (!parent) return undefined
  const names = ['srgbClr', 'schemeClr', 'sysClr', 'prstClr', 'scrgbClr', 'hslClr']
  return kids(parent, '*').find((c) => names.includes(c.localName))
}

export function solidColor(el: Element | undefined, ctx: ColorCtx): string | null {
  return readColor(colorElement(el), ctx)
}

export function brighten(rgba: string, amount: number): string {
  const m = rgba.match(/rgba?\(([^)]+)\)/)
  if (!m) return rgba
  const parts = m[1].split(',').map((s) => Number(s.trim()))
  const [r, g, b] = parts
  const a = parts[3] ?? 1
  const [h, s, l] = rgb2hsl(r, g, b)
  const [nr, ng, nb] = hsl2rgb(h, s, Math.max(0, Math.min(1, l + amount)))
  return `rgba(${Math.round(nr)},${Math.round(ng)},${Math.round(nb)},${a})`
}
