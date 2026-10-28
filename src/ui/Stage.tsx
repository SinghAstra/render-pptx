import { useEffect, useRef, useState } from 'react'
import { useDeck } from '../store'
import { SlideStage } from '../render/SlideStage'
import { Selection } from './Selection'
import { startDrag } from './drag'
import { findNode } from '../model'
import type { SlideNode } from '../import/types'

export function Stage() {
  const deck = useDeck((s) => s.deck)
  const current = useDeck((s) => s.current)
  const selected = useDeck((s) => s.selected)
  const pick = useDeck((s) => s.pick)
  const box = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!box.current || !deck) return
    const el = box.current
    const measure = () => {
      const aspect = deck.width / deck.height
      const w = Math.min(el.clientWidth - 72, (el.clientHeight - 72) * aspect)
      setWidth(Math.max(120, w))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [deck])
  if (!deck) return null
  const slide = deck.slides[current]
  if (!slide) return null
  const selectedNode = findNode(slide.nodes, selected)
  return (
    <div ref={box} className="flex-1 flex items-center justify-center overflow-hidden">
      <div className="shadow-[0_10px_40px_rgba(0,0,0,0.22)]" style={{ width, height: (width * deck.height) / deck.width }}>
        <SlideStage deck={deck} slide={slide} width={width} stageRef={stage} onBackgroundDown={() => pick(null)}>
          {slide.nodes.map((node) => (
            <HitBox
              key={node.id}
              node={node}
              scale={width / deck.width}
              stage={stage}
              onPick={() => pick(node.id)}
            />
          ))}
          {selectedNode ? <Selection node={selectedNode} scale={width / deck.width} stage={stage} /> : null}
        </SlideStage>
      </div>
    </div>
  )
}

function HitBox({
  node,
  scale,
  stage,
  onPick,
}: {
  node: SlideNode
  scale: number
  stage: React.RefObject<HTMLDivElement>
  onPick: () => void
}) {
  const begin = useDeck((s) => s.begin)
  const patchNode = useDeck((s) => s.patchNode)
  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onPick()
        startDrag({
          node,
          mode: 'move',
          clientX: e.clientX,
          clientY: e.clientY,
          shiftKey: e.shiftKey,
          scale,
          stage,
          begin,
          patch: (patch) => patchNode(node.id, patch),
        })
      }}
      style={{
        position: 'absolute',
        left: node.rect.x,
        top: node.rect.y,
        width: node.rect.w,
        height: node.rect.h,
        transform: node.rot ? `rotate(${node.rot}deg)` : undefined,
        transformOrigin: 'center center',
        cursor: 'move',
      }}
    />
  )
}
