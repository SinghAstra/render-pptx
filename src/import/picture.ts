import { kid } from './xml'
import { findEmbed } from './fill'
import { parseXfrm, xfrmOf, hidden, shapeName } from './xfrm'
import { chainOf, cropRect, uid } from './shape'
import type { PartCtx, Placeholders } from './context'
import type { ImageNode } from './types'

export function parsePicture(pic: Element, ctx: PartCtx, phs?: Placeholders): ImageNode | null {
  if (hidden(pic)) return null
  const chain = chainOf(pic, phs)
  const spPrs = chain.map((c) => kid(c, 'spPr'))
  const xfrm = spPrs.map((p) => parseXfrm(xfrmOf(p))).find((x) => !!x)
  if (!xfrm) return null
  const blipFill = chain.map((c) => kid(c, 'blipFill')).find((e) => !!e)
  const blip = kid(blipFill, 'blip')
  const embed = findEmbed(blip ?? pic)
  const src = embed ? ctx.images.get(embed) : undefined
  if (!src) return null
  const prst = spPrs.map((p) => kid(p, 'prstGeom')).find((e) => !!e)
  const preset = prst?.getAttribute('prst') ?? ''
  return {
    kind: 'image',
    id: uid(),
    name: shapeName(pic),
    rect: xfrm.rect,
    rot: xfrm.rot,
    flipH: xfrm.flipH,
    flipV: xfrm.flipV,
    hidden: false,
    src,
    crop: cropRect(kid(blipFill, 'srcRect')),
    rounded: preset === 'roundRect' || preset === 'ellipse',
  }
}
