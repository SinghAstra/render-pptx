import type { Deck, Slide } from '../import/types'
import { NodeView } from './NodeView'

export function SlideStage({ deck, slide, width }: { deck: Deck; slide: Slide; width: number }) {
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
      </div>
    </div>
  )
}
