import { useId } from 'react'
import type { LineNode } from '../import/types'
import { connectorPath, strokeStyle } from './paths'
import { ArrowMarker } from './ArrowMarker'

export function LineBox({ node }: { node: LineNode }) {
  const { rect: r, line } = node
  const id = useId().replace(/:/g, '')
  const d = connectorPath(node.preset, r.w, r.h)
  return (
    <svg
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
      width={r.w}
      height={r.h}
      viewBox={`0 0 ${r.w} ${r.h}`}
      preserveAspectRatio="none"
    >
      <defs>
        <ArrowMarker id={`${id}-e`} line={line} start={false} />
        <ArrowMarker id={`${id}-s`} line={line} start />
      </defs>
      <path
        d={d}
        fill="none"
        {...strokeStyle(line)}
        vectorEffect="non-scaling-stroke"
        markerEnd={line.endArrow ? `url(#${id}-e)` : undefined}
        markerStart={line.beginArrow ? `url(#${id}-s)` : undefined}
      />
    </svg>
  )
}
