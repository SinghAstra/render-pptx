import type { Pkg } from './package'
import type { Rels } from './rels'

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  ico: 'image/x-icon',
}

export type MediaCache = {
  resolve: (rels: Rels, embedId: string | undefined) => Promise<string | null>
}

export function createMedia(pkg: Pkg): MediaCache {
  const cache = new Map<string, Promise<string | null>>()
  const load = async (path: string): Promise<string | null> => {
    const ext = path.split('.').pop()?.toLowerCase() ?? ''
    const mime = MIME[ext]
    if (!mime) return null
    const data = await pkg.base64(path)
    return data ? `data:${mime};base64,${data}` : null
  }
  return {
    resolve: async (rels, embedId) => {
      const rel = rels.byId(embedId)
      if (!rel || rel.external) return null
      let job = cache.get(rel.target)
      if (!job) {
        job = load(rel.target)
        cache.set(rel.target, job)
      }
      return job
    },
  }
}
