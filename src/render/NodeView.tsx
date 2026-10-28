import type { SlideNode } from '../import/types'
import { ShapeBox } from './ShapeBox'
import { ImageBox } from './ImageBox'
import { LineBox } from './LineBox'
import { TableBox } from './TableBox'
import { ChartBox } from './ChartBox'

export function NodeView({ node }: { node: SlideNode }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: node.rect.x,
    top: node.rect.y,
    width: node.rect.w,
    height: node.rect.h,
    transform: node.rot ? `rotate(${node.rot}deg)` : undefined,
    transformOrigin: 'center center',
  }
  if (node.kind === 'group') {
    const sx = node.chSize.w ? node.rect.w / node.chSize.w : 1
    const sy = node.chSize.h ? node.rect.h / node.chSize.h : 1
    return (
      <div style={style}>
        <div
          style={{
            position: 'absolute',
            left: -node.chOff.x,
            top: -node.chOff.y,
            width: node.chSize.w,
            height: node.chSize.h,
            transform: `scale(${sx}, ${sy})`,
            transformOrigin: '0 0',
          }}
        >
          {node.children.map((child) => (
            <NodeView key={child.id} node={child} />
          ))}
        </div>
      </div>
    )
  }
  return (
    <div style={style}>
      {node.kind === 'shape' ? <ShapeBox node={node} /> : null}
      {node.kind === 'image' ? <ImageBox node={node} /> : null}
      {node.kind === 'line' ? <LineBox node={node} /> : null}
      {node.kind === 'table' ? <TableBox node={node} /> : null}
      {node.kind === 'chart' ? <ChartBox node={node} /> : null}
    </div>
  )
}
