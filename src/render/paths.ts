import { presetPath } from '../import/geometry'
import type { Geom, Line } from '../import/types'

export function shapePath(geom: Geom | null, w: number, h: number) {
  if (geom?.preset === 'custom' && geom.path && geom.box) {
    const box = geom.box
    return { d: geom.path, box: { w: box.w || w, h: box.h || h } }
  }
  return { d: presetPath(geom?.preset ?? 'rect', w, h, geom?.adj), box: { w, h } }
}

export function strokeStyle(line: Line | null | undefined) {
  if (!line || !line.color) return { stroke: 'none', strokeWidth: 0 }
  return {
    stroke: line.color,
    strokeWidth: line.width,
    strokeDasharray: line.dash ? line.dash.join(' ') : undefined,
    strokeLinecap: (line.cap === 'round' ? 'round' : line.cap === 'square' ? 'square' : 'butt') as
      | 'round'
      | 'square'
      | 'butt',
  }
}

export function connectorPath(preset: string, w: number, h: number): string {
  if (preset.startsWith('bent')) {
    if (preset.includes('2')) return `M0 0 H${w} V${h}`
    return `M0 0 H${w / 2} V${h} H${w}`
  }
  if (preset.startsWith('curved')) {
    return `M0 0 Q0 ${h / 2} ${w / 2} ${h / 2} T${w} ${h}`
  }
  return `M0 0 L${w} ${h}`
}
