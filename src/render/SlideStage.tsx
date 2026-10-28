import type { ReactNode, RefObject } from 'react'
import type { Deck, Slide } from '../import/types'
import { NodeView } from './NodeView'

type Props = {
  deck: Deck
  slide: Slide
  width: number
  children?: ReactNode
  stageRef?: RefObject<HTMLDivElement>
  onBackgroundDown?: () => void
}

export function SlideStage({ deck, slide, width, children, stageRef, onBackgroundDown }: Props) {
  const scale = width / deck.width
  return (
    <div
      style={{
        width,
        height: deck.height * scale,
        position: 'relative',
        overflow: 'hidden',
        background: slide.background,
      }}
    >
      <div
        ref={stageRef}
        onPointerDown={onBackgroundDown}
        style={{
          width: deck.width,
          height: deck.height,
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {slide.nodes.map((node) => (
          <NodeView key={node.id} node={node} />
        ))}
        {children}
      </div>
    </div>
  )
}
