import type { Pkg } from './package'
import type { Rels } from './rels'
import type { ColorCtx } from './color'
import type { Theme } from './theme'
import type { MediaCache } from './media'
import type { ThemeFmt } from './style'
import { attr, kid } from './xml'
export type ImportCtx = {
  pkg: Pkg
  theme: Theme
  fmt: ThemeFmt
  media: MediaCache
  defaultTextStyle?: Element
}

export type PartCtx = ImportCtx & {
  rels: Rels
  colors: ColorCtx
  textDefaults: Element[]
  styles?: Element
  images: Map<string, string>
}

export function textStyleKey(type: string | undefined): string {
  if (type === 'title' || type === 'ctrTitle') return 'titleStyle'
  if (type === 'body' || type === 'subTitle' || type === 'obj' || !type) return 'bodyStyle'
  return 'otherStyle'
}

export type PhInfo = { type?: string; idx?: string }

export type PhIndex = Map<string, Element>

export type Placeholders = { layout: PhIndex; master: PhIndex }

export function phOf(sp: Element): PhInfo | undefined {
  const nv = Array.from(sp.children).find((c) => c.localName.startsWith('nv'))
  const ph = kid(kid(nv, 'nvPr'), 'ph')
  if (!ph) return undefined
  return { type: attr(ph, 'type'), idx: attr(ph, 'idx') }
}

export function phName(sp: Element): string | undefined {
  const nv = Array.from(sp.children).find((c) => c.localName.startsWith('nv'))
  return attr(kid(nv, 'cNvPr'), 'name')
}

export function indexPlaceholders(tree: Element | undefined): PhIndex {
  const map: PhIndex = new Map()
  if (!tree) return map
  for (const sp of Array.from(tree.children)) {
    const info = phOf(sp)
    if (!info) continue
    if (info.idx !== undefined && !map.has(`i:${info.idx}`)) map.set(`i:${info.idx}`, sp)
    const type = info.type ?? 'body'
    if (!map.has(`t:${type}`)) map.set(`t:${type}`, sp)
  }
  return map
}

export function findPlaceholder(info: PhInfo | undefined, ...maps: PhIndex[]): Element | undefined {
  if (!info) return undefined
  for (const map of maps) {
    if (info.idx !== undefined) {
      const hit = map.get(`i:${info.idx}`)
      if (hit) return hit
    }
  }
  const type = info.type ?? 'body'
  for (const map of maps) {
    const hit = map.get(`t:${type}`)
    if (hit) return hit
  }
  if (type === 'ctrTitle') return findPlaceholder({ type: 'title' }, ...maps)
  if (type === 'subTitle') return findPlaceholder({ type: 'body' }, ...maps)
  return undefined
}
