import type { Pkg } from './package'
import { relsPath, resolvePath } from './package'
import { kids, attr } from './xml'

export type Rel = { id: string; type: string; target: string; external: boolean }
export type Rels = {
  list: Rel[]
  byId: (id: string | undefined) => Rel | undefined
  byType: (suffix: string) => Rel[]
  target: (id: string | undefined) => string | undefined
}

export const emptyRels: Rels = {
  list: [],
  byId: () => undefined,
  byType: () => [],
  target: () => undefined,
}

export async function loadRels(pkg: Pkg, part: string): Promise<Rels> {
  const doc = await pkg.xml(relsPath(part))
  const list: Rel[] = []
  if (doc) {
    for (const el of kids(doc.documentElement, 'Relationship')) {
      const target = attr(el, 'Target')
      const id = attr(el, 'Id')
      if (!target || !id) continue
      const external = attr(el, 'TargetMode') === 'External'
      list.push({
        id,
        type: attr(el, 'Type') ?? '',
        target: external ? target : resolvePath(part, target),
        external,
      })
    }
  }
  const map = new Map(list.map((r) => [r.id, r]))
  return {
    list,
    byId: (id) => (id ? map.get(id) : undefined),
    byType: (suffix) => list.filter((r) => r.type.endsWith(suffix)),
    target: (id) => (id ? map.get(id)?.target : undefined),
  }
}
