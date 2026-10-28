import { attr, kid, kids } from './xml'
import type { Geom } from './types'

const F = (n: number) => Number(n.toFixed(2))

function poly(pts: [number, number][]): string {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${F(p[0])} ${F(p[1])}`).join(' ') + ' Z'
}

function star(w: number, h: number, points: number, inner = 0.38): string {
  const cx = w / 2, cy = h / 2
  const pts: [number, number][] = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? 0.5 : inner
    const a = (Math.PI * i) / points - Math.PI / 2
    pts.push([cx + Math.cos(a) * w * r, cy + Math.sin(a) * h * r])
  }
  return poly(pts)
}

function polygon(w: number, h: number, sides: number): string {
  const cx = w / 2, cy = h / 2
  const pts: [number, number][] = []
  for (let i = 0; i < sides; i++) {
    const a = (Math.PI * 2 * i) / sides - Math.PI / 2
    pts.push([cx + Math.cos(a) * (w / 2), cy + Math.sin(a) * (h / 2)])
  }
  return poly(pts)
}

function arrow(w: number, h: number, dir: string, adj1 = 0.5, adj2 = 0.5): string {
  const shaft = h * Math.min(1, adj1)
  const headW = Math.min(w, h) * Math.min(1, adj2) * 1.2
  const y0 = (h - shaft) / 2, y1 = (h + shaft) / 2
  if (dir === 'right') return poly([[0, y0], [w - headW, y0], [w - headW, 0], [w, h / 2], [w - headW, h], [w - headW, y1], [0, y1]])
  if (dir === 'left') return poly([[w, y0], [headW, y0], [headW, 0], [0, h / 2], [headW, h], [headW, y1], [w, y1]])
  const sx0 = (w - shaft) / 2, sx1 = (w + shaft) / 2
  if (dir === 'up') return poly([[sx0, h], [sx0, headW], [0, headW], [w / 2, 0], [w, headW], [sx1, headW], [sx1, h]])
  return poly([[sx0, 0], [sx0, h - headW], [0, h - headW], [w / 2, h], [w, h - headW], [sx1, h - headW], [sx1, 0]])
}

export function presetPath(preset: string, w: number, h: number, adj: number[] = []): string {
  const a = (i: number, d: number) => (adj[i] === undefined ? d : adj[i] / 100000)
  switch (preset) {
    case 'ellipse':
    case 'circle':
      return `M0 ${F(h / 2)} A ${F(w / 2)} ${F(h / 2)} 0 1 0 ${F(w)} ${F(h / 2)} A ${F(w / 2)} ${F(h / 2)} 0 1 0 0 ${F(h / 2)} Z`
    case 'roundRect': {
      const r = Math.min(w, h) * a(0, 0.16667)
      return `M${F(r)} 0 H${F(w - r)} A${F(r)} ${F(r)} 0 0 1 ${F(w)} ${F(r)} V${F(h - r)} A${F(r)} ${F(r)} 0 0 1 ${F(w - r)} ${F(h)} H${F(r)} A${F(r)} ${F(r)} 0 0 1 0 ${F(h - r)} V${F(r)} A${F(r)} ${F(r)} 0 0 1 ${F(r)} 0 Z`
    }
    case 'snip1Rect': {
      const r = Math.min(w, h) * a(0, 0.16667)
      return poly([[0, 0], [w - r, 0], [w, r], [w, h], [0, h]])
    }
    case 'snip2SameRect':
    case 'snipRoundRect': {
      const r = Math.min(w, h) * a(0, 0.16667)
      return poly([[r, 0], [w - r, 0], [w, r], [w, h - r], [w - r, h], [r, h], [0, h - r], [0, r]])
    }
    case 'triangle':
    case 'isosTriangle':
      return poly([[w / 2, 0], [w, h], [0, h]])
    case 'rtTriangle':
      return poly([[0, 0], [0, h], [w, h]])
    case 'diamond':
      return poly([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]])
    case 'parallelogram':
      return poly([[w * a(0, 0.25), 0], [w, 0], [w * (1 - a(0, 0.25)), h], [0, h]])
    case 'trapezoid':
      return poly([[w * a(0, 0.25), 0], [w * (1 - a(0, 0.25)), 0], [w, h], [0, h]])
    case 'pentagon':
      return polygon(w, h, 5)
    case 'hexagon':
      return poly([[w * 0.25, 0], [w * 0.75, 0], [w, h / 2], [w * 0.75, h], [w * 0.25, h], [0, h / 2]])
    case 'heptagon':
      return polygon(w, h, 7)
    case 'octagon': {
      const k = 0.2929
      return poly([[w * k, 0], [w * (1 - k), 0], [w, h * k], [w, h * (1 - k)], [w * (1 - k), h], [w * k, h], [0, h * (1 - k)], [0, h * k]])
    }
    case 'star4':
      return star(w, h, 4, 0.32)
    case 'star5':
      return star(w, h, 5)
    case 'star6':
      return star(w, h, 6, 0.44)
    case 'star8':
      return star(w, h, 8, 0.55)
    case 'star12':
      return star(w, h, 12, 0.62)
    case 'star24':
      return star(w, h, 24, 0.72)
    case 'star32':
      return star(w, h, 32, 0.78)
    case 'rightArrow':
      return arrow(w, h, 'right', a(0, 0.5), a(1, 0.5))
    case 'leftArrow':
      return arrow(w, h, 'left', a(0, 0.5), a(1, 0.5))
    case 'upArrow':
      return arrow(w, h, 'up', a(0, 0.5), a(1, 0.5))
    case 'downArrow':
      return arrow(w, h, 'down', a(0, 0.5), a(1, 0.5))
    case 'leftRightArrow': {
      const s = h * a(0, 0.5)
      const hw = Math.min(w, h) * a(1, 0.5) * 0.9
      return poly([[0, h / 2], [hw, 0], [hw, (h - s) / 2], [w - hw, (h - s) / 2], [w - hw, 0], [w, h / 2], [w - hw, h], [w - hw, (h + s) / 2], [hw, (h + s) / 2], [hw, h]])
    }
    case 'upDownArrow': {
      const s = w * a(0, 0.5)
      const hh = Math.min(w, h) * a(1, 0.5) * 0.9
      return poly([[w / 2, 0], [w, hh], [(w + s) / 2, hh], [(w + s) / 2, h - hh], [w, h - hh], [w / 2, h], [0, h - hh], [(w - s) / 2, h - hh], [(w - s) / 2, hh], [0, hh]])
    }
    case 'chevron': {
      const k = w * a(0, 0.5)
      return poly([[0, 0], [k, 0], [w, h / 2], [k, h], [0, h], [w - k, h / 2]])
    }
    case 'homePlate': {
      const k = Math.min(w, h) * a(0, 0.5)
      return poly([[0, 0], [w - k, 0], [w, h / 2], [w - k, h], [0, h]])
    }
    case 'plus':
    case 'mathPlus': {
      const s = Math.min(w, h) * a(0, 0.25)
      return poly([[s, 0], [w - s, 0], [w - s, s], [w, s], [w, h - s], [w - s, h - s], [w - s, h], [s, h], [s, h - s], [0, h - s], [0, s], [s, s]])
    }
    case 'minus':
    case 'mathMinus':
    case 'mathEqual': {
      const s = h * a(0, 0.25)
      return poly([[0, s], [w, s], [w, h - s], [0, h - s]])
    }
    case 'mathMultiply': {
      const s = Math.min(w, h) * a(0, 0.3)
      return poly([[s, 0], [w / 2, h / 2 - s], [w - s, 0], [w, s], [w / 2 + s, h / 2], [w, h - s], [w - s, h], [w / 2, h / 2 + s], [s, h], [0, h - s], [w / 2 - s, h / 2], [0, s]])
    }
    case 'donut': {
      const t = Math.min(w, h) * a(0, 0.25)
      const R = `M0 ${F(h / 2)} A ${F(w / 2)} ${F(h / 2)} 0 1 0 ${F(w)} ${F(h / 2)} A ${F(w / 2)} ${F(h / 2)} 0 1 0 0 ${F(h / 2)} Z`
      const ri = `M${F(t)} ${F(h / 2)} A ${F(w / 2 - t)} ${F(h / 2 - t)} 0 1 1 ${F(w - t)} ${F(h / 2)} A ${F(w / 2 - t)} ${F(h / 2 - t)} 0 1 1 ${F(t)} ${F(h / 2)} Z`
      return `${R} ${ri}`
    }
    case 'can': {
      const ry = Math.min(h * 0.14, w * 0.5)
      return `M0 ${F(ry)} A ${F(w / 2)} ${F(ry)} 0 0 1 ${F(w)} ${F(ry)} V${F(h - ry)} A ${F(w / 2)} ${F(ry)} 0 0 1 0 ${F(h - ry)} Z`
    }
    case 'cloud': {
      const p = (x: number, y: number) => `${F(x * w)} ${F(y * h)}`
      return `M ${p(0.25, 0.97)} C ${p(0.05, 0.97)} ${p(0, 0.72)} ${p(0.13, 0.6)} C ${p(0.02, 0.42)} ${p(0.14, 0.16)} ${p(0.34, 0.2)} C ${p(0.44, 0.02)} ${p(0.72, 0.02)} ${p(0.8, 0.2)} C ${p(0.98, 0.2)} ${p(1.02, 0.44)} ${p(0.9, 0.6)} C ${p(1.02, 0.76)} ${p(0.92, 0.97)} ${p(0.75, 0.97)} Z`
    }
    case 'heart':
      return `M ${F(w / 2)} ${F(h)} C ${F(-w * 0.12)} ${F(h * 0.62)} ${F(w * 0.06)} ${F(h * 0.06)} ${F(w / 2)} ${F(h * 0.26)} C ${F(w * 0.94)} ${F(h * 0.06)} ${F(w * 1.12)} ${F(h * 0.62)} ${F(w / 2)} ${F(h)} Z`
    case 'sun': {
      const r = Math.min(w, h) * 0.28
      const cx = w / 2, cy = h / 2
      let d = `M${F(cx - r)} ${F(cy)} A ${F(r)} ${F(r)} 0 1 0 ${F(cx + r)} ${F(cy)} A ${F(r)} ${F(r)} 0 1 0 ${F(cx - r)} ${F(cy)} Z`
      for (let i = 0; i < 12; i++) {
        const a0 = (i * Math.PI) / 6
        const w0 = 0.08
        const x1 = cx + Math.cos(a0 - w0) * w / 2, y1 = cy + Math.sin(a0 - w0) * h / 2
        const x2 = cx + Math.cos(a0 + w0) * w / 2, y2 = cy + Math.sin(a0 + w0) * h / 2
        const xm = cx + Math.cos(a0) * r * 0.9, ym = cy + Math.sin(a0) * r * 0.9
        d += ` M${F(x1)} ${F(y1)} L${F(xm)} ${F(ym)} L${F(x2)} ${F(y2)} Z`
      }
      return d
    }
    case 'moon':
      return `M ${F(w * 0.72)} 0 A ${F(w * 0.5)} ${F(h * 0.5)} 0 1 1 ${F(w * 0.72)} ${F(h)} A ${F(w * 0.62)} ${F(h * 0.5)} 0 1 0 ${F(w * 0.72)} 0 Z`
    case 'lightningBolt':
      return poly([[w * 0.38, 0], [w * 0.9, 0], [w * 0.6, h * 0.38], [w * 0.85, h * 0.38], [w * 0.2, h], [w * 0.4, h * 0.55], [w * 0.14, h * 0.55]])
    case 'teardrop':
      return `M ${F(w / 2)} 0 C ${F(w * 0.62)} ${F(h * 0.25)} ${F(w)} ${F(h * 0.38)} ${F(w)} ${F(h * 0.62)} A ${F(w / 2)} ${F(h * 0.38)} 0 0 1 0 ${F(h * 0.62)} C 0 ${F(h * 0.38)} ${F(w * 0.38)} ${F(h * 0.25)} ${F(w / 2)} 0 Z`
    case 'plaque': {
      const r = Math.min(w, h) * 0.18
      return `M${F(r)} 0 H${F(w - r)} A${F(r)} ${F(r)} 0 0 1 ${F(w - r + r * 0.4)} ${F(r * 0.4)} L${F(w)} ${F(r)} V${F(h - r)} A${F(r)} ${F(r)} 0 0 1 ${F(w - r)} ${F(h)} H${F(r)} A${F(r)} ${F(r)} 0 0 1 0 ${F(h - r)} V${F(r)} A${F(r)} ${F(r)} 0 0 1 ${F(r)} 0 Z`
    }
    case 'frame': {
      const t = Math.min(w, h) * a(0, 0.125)
      const outer = `M0 0 H${F(w)} V${F(h)} H0 Z`
      const inner = `M${F(t)} ${F(t)} H${F(w - t)} V${F(h - t)} H${F(t)} Z`
      return `${outer} ${inner}`
    }
    case 'halfFrame': {
      const t = Math.min(w, h) * a(0, 0.333)
      return poly([[0, 0], [w, 0], [w, t], [t, t], [t, h], [0, h]])
    }
    case 'bevel': {
      const t = Math.min(w, h) * a(0, 0.16667)
      return poly([[t, 0], [w - t, 0], [w, t], [w, h - t], [w - t, h], [t, h], [0, h - t], [0, t]])
    }
    case 'foldedCorner': {
      const t = Math.min(w, h) * a(0, 0.25)
      return poly([[0, 0], [w - t, 0], [w, t], [w, h], [0, h]])
    }
    case 'wedgeRectCallout': {
      const tx = w * a(0, 0.5)
      return poly([[0, 0], [w, 0], [w, h * 0.7], [w * 0.55, h * 0.7], [tx, h], [w * 0.42, h * 0.7], [0, h * 0.7]])
    }
    case 'flowchartProcess':
    case 'flowChartProcess':
    case 'textBox':
    case 'rect':
    case 'flowchartAlternateProcess':
      return poly([[0, 0], [w, 0], [w, h], [0, h]])
    case 'flowchartDecision':
      return poly([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]])
    case 'flowchartTerminator': {
      const r = h / 2
      return `M${F(r)} 0 H${F(w - r)} A${F(r)} ${F(r)} 0 0 1 ${F(w - r)} ${F(h)} H${F(r)} A${F(r)} ${F(r)} 0 0 1 ${F(r)} 0 Z`
    }
    case 'flowchartData':
      return poly([[w * 0.15, 0], [w, 0], [w * 0.85, h], [0, h]])
    case 'flowchartDocument':
      return `M0 0 H${F(w)} V${F(h * 0.78)} C ${F(w * 0.72)} ${F(h * 1.05)} ${F(w * 0.3)} ${F(h * 0.62)} 0 ${F(h * 0.86)} Z`
    case 'arc': {
      const cx = w / 2, cy = h / 2
      return `M${F(cx + w / 2)} ${F(cy)} A ${F(w / 2)} ${F(h / 2)} 0 0 0 ${F(cx)} ${F(cy - h / 2)}`
    }
    case 'pie':
      return `M${F(w / 2)} ${F(h / 2)} L${F(w)} ${F(h / 2)} A ${F(w / 2)} ${F(h / 2)} 0 0 0 ${F(w / 2)} 0 Z`
    case 'chord':
      return `M${F(w)} ${F(h / 2)} A ${F(w / 2)} ${F(h / 2)} 0 0 0 ${F(w / 2)} 0 L${F(w)} ${F(h / 2)} Z`
    case 'blockArc': {
      const t = Math.min(w, h) * a(0, 0.25)
      return `M${F(w / 2)} ${F(h / 2)} L${F(w)} ${F(h / 2)} A ${F(w / 2)} ${F(h / 2)} 0 0 0 ${F(w / 2)} 0 L${F(w / 2)} ${F(t)} A ${F(w / 2 - t)} ${F(h / 2 - t)} 0 0 1 ${F(w - t)} ${F(h / 2)} Z`
    }
    case 'leftBrace':
    case 'rightBrace':
      return poly([[w, 0], [w * 0.5, h * 0.15], [w * 0.5, h * 0.4], [0, h * 0.5], [w * 0.5, h * 0.6], [w * 0.5, h * 0.85], [w, h]])
    case 'cube': {
      const d = Math.min(w, h) * 0.25
      return poly([[0, d], [d, 0], [w, 0], [w, h - d], [w - d, h], [0, h]]) + ` M0 ${F(d)} L${F(w - d)} ${F(d)} L${F(w)} 0 M${F(w - d)} ${F(d)} L${F(w - d)} ${F(h)}`
    }
    default:
      return poly([[0, 0], [w, 0], [w, h], [0, h]])
  }
}

export function parseGeom(spPr: Element | undefined): Geom | null {
  const prst = kid(spPr, 'prstGeom')
  if (prst) {
    const av = kid(prst, 'avLst')
    const adj = kids(av, 'gd').map((g) => Number(attr(g, 'fmla')?.replace('val ', '') ?? 0))
    return { preset: attr(prst, 'prst') ?? 'rect', adj }
  }
  const cust = kid(spPr, 'custGeom')
  if (cust) {
    const pathLst = kid(cust, 'pathLst')
    const paths = kids(pathLst, 'path')
    let d = ''
    let box = { w: 0, h: 0 }
    for (const p of paths) {
      const pw = Number(attr(p, 'w') ?? 0)
      const ph = Number(attr(p, 'h') ?? 0)
      box = { w: pw, h: ph }
      for (const cmd of kids(p, '*')) {
        const pts = kids(cmd, 'pt').map((pt) => [Number(attr(pt, 'x') ?? 0), Number(attr(pt, 'y') ?? 0)] as [number, number])
        const n = cmd.localName
        if (n === 'moveTo' && pts[0]) d += `M${pts[0][0]} ${pts[0][1]} `
        else if (n === 'lnTo' && pts[0]) d += `L${pts[0][0]} ${pts[0][1]} `
        else if (n === 'cubicBezTo' && pts.length === 3) d += `C${pts[0][0]} ${pts[0][1]} ${pts[1][0]} ${pts[1][1]} ${pts[2][0]} ${pts[2][1]} `
        else if (n === 'quadBezTo' && pts.length === 2) d += `Q${pts[0][0]} ${pts[0][1]} ${pts[1][0]} ${pts[1][1]} `
        else if (n === 'arcTo') {
          const wR = Number(attr(cmd, 'wR') ?? 0), hR = Number(attr(cmd, 'hR') ?? 0)
          const st = Number(attr(cmd, 'stAng') ?? 0) / 60000
          const sw = Number(attr(cmd, 'swAng') ?? 0) / 60000
          const end = [(st + sw) * Math.PI / 180]
          d += `A${wR} ${hR} 0 0 1 ${Math.cos(end[0]) * wR} ${Math.sin(end[0]) * hR} `
        } else if (n === 'close') d += 'Z '
      }
    }
    return { preset: 'custom', path: d.trim(), box }
  }
  return null
}
