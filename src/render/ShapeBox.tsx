import { useId } from 'react'
import type { ShapeNode } from '../import/types'
import { shapePath, strokeStyle } from './paths'
import { TextBlock } from './TextBlock'
import { ArrowMarker } from './ArrowMarker'

export function ShapeBox({ node }: { node: ShapeNode }) {
  const { rect: r, geom, fill, line, text } = node
  const { d, box } = shapePath(geom, r.w, r.h)
  const stroke = strokeStyle(line)
  const id = useId().replace(/:/g, '')
  const endId = `${id}-end`
  const startId = `${id}-start`
  const flip = `translate(${box.w} 0) scale(${node.flipH ? -1 : 1} 1) translate(0 ${box.h}) scale(1 ${node.flipV ? -1 : 1})`
  return (
    <>
      {fill ? (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div
            style={{
              width: box.w,
              height: box.h,
              background: fill,
              clipPath: `path("${d}")`,
              transform: `scale(${r.w / box.w}, ${r.h / box.h})`,
              transformOrigin: '0 0',
              filter: node.shadow ? 'drop-shadow(1px 2px 2px rgba(0,0,0,0.3))' : undefined,
            }}
          />
        </div>
      ) : null}
      <svg
        style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
        width={r.w}
        height={r.h}
        viewBox={`0 0 ${box.w} ${box.h}`}
        preserveAspectRatio="none"
      >
        <defs>
          <ArrowMarker id={endId} line={line ?? emptyLine} start={false} />
          <ArrowMarker id={startId} line={line ?? emptyLine} start />
        </defs>
        <g transform={flip}>
          <path
            d={d}
            fill="none"
            {...stroke}
            vectorEffect="non-scaling-stroke"
            markerEnd={line?.endArrow ? `url(#${endId})` : undefined}
            markerStart={line?.beginArrow ? `url(#${startId})` : undefined}
          />
        </g>
      </svg>
      {text ? <TextBlock body={text} /> : null}
    </>
  )
}

const emptyLine = { color: null, width: 0, dash: null, beginArrow: null, endArrow: null, cap: 'flat' as const }
