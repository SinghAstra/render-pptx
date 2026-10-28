import type { Line } from '../import/types'

export function arrowD(kind: string): string {
  switch (kind) {
    case 'oval':
      return 'M5 1 A4 4 0 1 0 5.01 1 Z'
    case 'diamond':
      return 'M0 5 L5 1 L10 5 L5 9 Z'
    case 'stealth':
      return 'M0 1 L10 5 L0 9 L3 5 Z'
    default:
      return 'M0 1 L10 5 L0 9 Z'
  }
}

export function ArrowMarker({ id, line, start }: { id: string; line: Line; start: boolean }) {
  const kind = start ? line.beginArrow : line.endArrow
  if (!kind) return null
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX={start ? 0 : 10}
      refY="5"
      markerWidth="4"
      markerHeight="4"
      orient={start ? 'auto-start-reverse' : 'auto'}
      markerUnits="strokeWidth"
    >
      <path d={arrowD(kind)} fill={line.color ?? '#000'} />
    </marker>
  )
}
