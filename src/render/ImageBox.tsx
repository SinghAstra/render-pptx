import type { ImageNode } from '../import/types'

export function ImageBox({ node }: { node: ImageNode }) {
  const { crop, rect: r } = node
  const w = Math.max(0.0001, 1 - crop.l - crop.r)
  const h = Math.max(0.0001, 1 - crop.t - crop.b)
  const bw = r.w / w
  const bh = r.h / h
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        borderRadius: node.rounded ? '8%' : undefined,
        backgroundImage: `url("${node.src}")`,
        backgroundSize: `${bw}px ${bh}px`,
        backgroundPosition: `${-crop.l * bw}px ${-crop.t * bh}px`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  )
}
