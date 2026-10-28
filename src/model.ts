import type { Deck, Rect, Slide, SlideNode } from './import/types'

export const uid = () => Math.random().toString(36).slice(2, 10)

export function findNode(nodes: SlideNode[], id: string | null): SlideNode | null {
  if (!id) return null
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.kind === 'group') {
      const hit = findNode(node.children, id)
      if (hit) return hit
    }
  }
  return null
}

export function mapNodes(nodes: SlideNode[], id: string, fn: (node: SlideNode) => SlideNode): SlideNode[] {
  return nodes.map((node) => {
    if (node.id === id) return fn(node)
    if (node.kind === 'group') return { ...node, children: mapNodes(node.children, id, fn) }
    return node
  })
}

export function removeNode(nodes: SlideNode[], id: string): SlideNode[] {
  return nodes.filter((node) => node.id !== id).map((node) => (node.kind === 'group' ? { ...node, children: removeNode(node.children, id) } : node))
}

export function patchSlide(deck: Deck, index: number, fn: (slide: Slide) => Slide): Deck {
  return { ...deck, slides: deck.slides.map((slide, i) => (i === index ? fn(slide) : slide)) }
}

export function patchRect(node: SlideNode, rect: Rect, rot?: number): SlideNode {
  return { ...node, rect, rot: rot === undefined ? node.rot : rot }
}

export function cloneNodes(nodes: SlideNode[]): SlideNode[] {
  return nodes.map((node) => {
    const copy: SlideNode = { ...node, id: uid() }
    if (copy.kind === 'group' && node.kind === 'group') copy.children = cloneNodes(node.children)
    return copy
  })
}

export function cloneSlide(slide: Slide): Slide {
  return { ...slide, id: uid(), nodes: cloneNodes(slide.nodes) }
}

export const MIN_SIZE = 8

export function normalizeRect(rect: Rect): Rect {
  return {
    x: rect.w < 0 ? rect.x + rect.w : rect.x,
    y: rect.h < 0 ? rect.y + rect.h : rect.y,
    w: Math.max(MIN_SIZE, Math.abs(rect.w)),
    h: Math.max(MIN_SIZE, Math.abs(rect.h)),
  }
}
