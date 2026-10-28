import JSZip from 'jszip'
import { parseXml } from './xml'

export type Pkg = {
  text: (p: string) => Promise<string | null>
  xml: (p: string) => Promise<Document | null>
  blob: (p: string) => Promise<Blob | null>
  base64: (p: string) => Promise<string | null>
  has: (p: string) => boolean
}

export function dirOf(p: string): string {
  const i = p.lastIndexOf('/')
  return i < 0 ? '' : p.slice(0, i)
}

export function resolvePath(base: string, target: string): string {
  if (/^[a-z]+:/i.test(target)) return target
  const stack = target.startsWith('/') ? [] : dirOf(base).split('/').filter(Boolean)
  for (const seg of target.split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') stack.pop()
    else stack.push(seg)
  }
  return stack.join('/')
}

export function relsPath(part: string): string {
  const dir = dirOf(part)
  const name = part.slice(dir.length + 1)
  return `${dir}/_rels/${name}.rels`
}

export async function openPackage(data: ArrayBuffer | Blob): Promise<Pkg> {
  const zip = await JSZip.loadAsync(data)
  const pick = (p: string) => zip.file(p.replace(/^\//, ''))
  return {
    has: (p) => !!pick(p),
    text: async (p) => pick(p)?.async('string') ?? null,
    xml: async (p) => {
      const t = pick(p)?.async('string')
      return t ? parseXml(await t) : null
    },
    blob: async (p) => pick(p)?.async('blob') ?? null,
    base64: async (p) => pick(p)?.async('base64') ?? null,
  }
}
