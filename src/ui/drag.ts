import type { RefObject } from 'react'
import type { SlideNode } from '../import/types'
import { MIN_SIZE } from '../model'

export type Mode = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate'

const AXES: Record<string, [number, number]> = {
  nw: [-1, -1],
  n: [0, -1],
  ne: [1, -1],
  e: [1, 0],
  se: [1, 1],
  s: [0, 1],
  sw: [-1, 1],
  w: [-1, 0],
}

type Options = {
  node: SlideNode
  mode: Mode
  clientX: number
  clientY: number
  shiftKey: boolean
  scale: number
  stage: RefObject<HTMLDivElement>
  begin: () => void
  patch: (patch: { x?: number; y?: number; w?: number; h?: number; rot?: number }) => void
}

export function startDrag(opts: Options) {
  const { node, mode, scale, stage } = opts
  const box = stage.current?.getBoundingClientRect()
  const toDeck = (cx: number, cy: number) => ({
    x: box ? (cx - box.left) / scale : 0,
    y: box ? (cy - box.top) / scale : 0,
  })
  const startPoint = toDeck(opts.clientX, opts.clientY)
  const rect = { ...node.rect }
  const rot = node.rot
  const center = { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }
  const angle = Math.atan2(startPoint.y - center.y, startPoint.x - center.x)
  let moved = false
  const move = (e: PointerEvent) => {
    const p = toDeck(e.clientX, e.clientY)
    if (!moved) {
      if (!e.shiftKey && Math.abs(p.x - startPoint.x) < 0.3 && Math.abs(p.y - startPoint.y) < 0.3) return
      moved = true
      opts.begin()
    }
    if (mode === 'move') {
      opts.patch({ x: rect.x + p.x - startPoint.x, y: rect.y + p.y - startPoint.y })
      return
    }
    if (mode === 'rotate') {
      const now = Math.atan2(p.y - center.y, p.x - center.x)
      let deg = rot + ((now - angle) * 180) / Math.PI
      if (e.shiftKey) deg = Math.round(deg / 15) * 15
      opts.patch({ rot: Math.round(deg * 10) / 10 })
      return
    }
    const [ax, ay] = AXES[mode]
    const rad = (-rot * Math.PI) / 180
    const dx = p.x - startPoint.x
    const dy = p.y - startPoint.y
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad)
    const ly = dx * Math.sin(rad) + dy * Math.cos(rad)
    const w = Math.max(MIN_SIZE, rect.w + ax * lx)
    const h = Math.max(MIN_SIZE, rect.h + ay * ly)
    const th = (rot * Math.PI) / 180
    const cos = Math.cos(th)
    const sin = Math.sin(th)
    const alx = (-ax * rect.w) / 2
    const aly = (-ay * rect.h) / 2
    const anchor = { x: center.x + alx * cos - aly * sin, y: center.y + alx * sin + aly * cos }
    const ox = (ax * w) / 2
    const oy = (ay * h) / 2
    const ncx = anchor.x + ox * cos - oy * sin
    const ncy = anchor.y + ox * sin + oy * cos
    opts.patch({ x: ncx - w / 2, y: ncy - h / 2, w, h })
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}
