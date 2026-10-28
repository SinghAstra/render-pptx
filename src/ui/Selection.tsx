import type { RefObject } from 'react'
import type { SlideNode } from '../import/types'
import { useDeck } from '../store'
import { startDrag, type Mode } from './drag'

const CURSORS: Record<string, string> = {
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  rotate: 'grab',
}

export function Selection({ node, scale, stage }: { node: SlideNode; scale: number; stage: RefObject<HTMLDivElement> }) {
  const patchNode = useDeck((s) => s.patchNode)
  const begin = useDeck((s) => s.begin)
  const down = (mode: Mode) => (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    startDrag({
      node,
      mode,
      clientX: e.clientX,
      clientY: e.clientY,
      shiftKey: e.shiftKey,
      scale,
      stage,
      begin,
      patch: (patch) => patchNode(node.id, patch),
    })
  }
  const handle = (mode: Mode, style: React.CSSProperties) => {
    const size = 9 / scale
    return (
      <div
        key={mode}
        onPointerDown={down(mode)}
        style={{
          position: 'absolute',
          width: size,
          height: size,
          background: '#fff',
          border: `${1.5 / scale}px solid #2563eb`,
          borderRadius: 1,
          cursor: CURSORS[mode],
          ...style,
        }}
      />
    )
  }
  const line = 1.5 / scale
  return (
    <div
      onPointerDown={down('move')}
      style={{
        position: 'absolute',
        left: node.rect.x,
        top: node.rect.y,
        width: node.rect.w,
        height: node.rect.h,
        transform: `rotate(${node.rot}deg)`,
        transformOrigin: 'center center',
        outline: `${line}px solid #2563eb`,
        cursor: 'move',
        zIndex: 40,
      }}
    >
      <div
        onPointerDown={down('rotate')}
        style={{
          position: 'absolute',
          left: '50%',
          top: -26 / scale,
          width: 12 / scale,
          height: 12 / scale,
          marginLeft: -6 / scale,
          borderRadius: '50%',
          background: '#2563eb',
          border: `${line}px solid #fff`,
          cursor: 'grab',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: -20 / scale,
          width: line,
          height: 20 / scale,
          background: '#2563eb',
          marginLeft: -line / 2,
        }}
      />
      {handle('nw', { left: -5 / scale, top: -5 / scale })}
      {handle('n', { left: '50%', top: -5 / scale, marginLeft: -5 / scale })}
      {handle('ne', { right: -5 / scale, top: -5 / scale })}
      {handle('e', { right: -5 / scale, top: '50%', marginTop: -5 / scale })}
      {handle('se', { right: -5 / scale, bottom: -5 / scale })}
      {handle('s', { left: '50%', bottom: -5 / scale, marginLeft: -5 / scale })}
      {handle('sw', { left: -5 / scale, bottom: -5 / scale })}
      {handle('w', { left: -5 / scale, top: '50%', marginTop: -5 / scale })}
    </div>
  )
}
