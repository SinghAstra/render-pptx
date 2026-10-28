export function parseXml(text: string): Document {
  return new DOMParser().parseFromString(text, 'application/xml')
}
export function kids(el: Element | null | undefined, name: string): Element[] {
  if (!el) return []
  const list = Array.from(el.children)
  return name === '*' ? list : list.filter((c) => c.localName === name)
}
export function kid(el: Element | null | undefined, name: string): Element | undefined {
  return kids(el, name)[0]
}
export function path(el: Element | null | undefined, names: string[]): Element | undefined {
  let cur = el ?? undefined
  for (const name of names) {
    if (!cur) return undefined
    cur = kid(cur, name)
  }
  return cur
}
export function all(el: Element | null | undefined, name: string): Element[] {
  if (!el) return []
  return Array.from(el.getElementsByTagName('*')).filter((c) => c.localName === name)
}
export function attr(el: Element | null | undefined, name: string): string | undefined {
  if (!el) return undefined
  const v = el.getAttribute(name)
  return v === null ? undefined : v
}
export function attrAny(el: Element | null | undefined, names: string[]): string | undefined {
  for (const name of names) {
    const v = attr(el, name)
    if (v !== undefined) return v
  }
  return undefined
}
export function numAttr(el: Element | null | undefined, name: string, fallback = 0): number {
  const v = attr(el, name)
  if (v === undefined) return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}
export function relId(el: Element | null | undefined): string | undefined {
  if (!el) return undefined
  const named = el.getAttribute('r:id')
  if (named) return named
  for (const a of Array.from(el.attributes)) {
    if (a.localName === 'id' && a.prefix) return a.value
  }
  return undefined
}
export function boolAttr(el: Element | null | undefined, name: string, fallback = false): boolean {
  const v = attr(el, name)
  if (v === undefined) return fallback
  return v === '1' || v === 'true'
}
