import { create } from 'zustand'
import type { Deck } from './import/types'
import { importPptx } from './import/deck'
import { ensureFonts } from './fonts'
import { cloneSlide, mapNodes, patchSlide, removeNode, uid } from './model'

type State = {
  deck: Deck | null
  current: number
  loading: boolean
  error: string | null
  presenting: boolean
  fontVersion: number
  selected: string | null
  past: Deck[]
  future: Deck[]
  load: (file: File) => Promise<void>
  select: (index: number) => void
  step: (delta: number) => void
  setPresenting: (on: boolean) => void
  pick: (id: string | null) => void
  begin: () => void
  patchNode: (id: string, patch: { x?: number; y?: number; w?: number; h?: number; rot?: number }) => void
  deleteSelected: () => void
  addSlide: () => void
  duplicateSlide: (index: number) => void
  deleteSlide: (index: number) => void
  moveSlide: (from: number, to: number) => void
  undo: () => void
  redo: () => void
}

const HISTORY_LIMIT = 60

export const useDeck = create<State>((set, get) => ({
  deck: null,
  current: 0,
  loading: false,
  error: null,
  presenting: false,
  fontVersion: 0,
  selected: null,
  past: [],
  future: [],
  load: async (file) => {
    set({ loading: true, error: null })
    try {
      const deck = await importPptx(await file.arrayBuffer(), file.name)
      set({ deck, current: 0, loading: false, selected: null, past: [], future: [] })
      ensureFonts(deck.fonts).then((loaded) => {
        if (loaded) set((s) => ({ fontVersion: s.fontVersion + 1 }))
      })
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'Could not read this file' })
    }
  },
  select: (index) => {
    const deck = get().deck
    if (!deck) return
    set({ current: Math.max(0, Math.min(deck.slides.length - 1, index)), selected: null })
  },
  step: (delta) => {
    const { deck, current } = get()
    if (!deck) return
    set({ current: Math.max(0, Math.min(deck.slides.length - 1, current + delta)) })
  },
  setPresenting: (on) => set({ presenting: on, selected: null }),
  pick: (id) => set({ selected: id }),
  begin: () => {
    const { deck, past } = get()
    if (!deck) return
    set({ past: [...past.slice(-HISTORY_LIMIT + 1), deck], future: [] })
  },
  patchNode: (id, patch) => {
    const { deck, current } = get()
    if (!deck) return
    set({
      deck: patchSlide(deck, current, (slide) => ({
        ...slide,
        nodes: mapNodes(slide.nodes, id, (node) => ({
          ...node,
          rect: {
            x: patch.x ?? node.rect.x,
            y: patch.y ?? node.rect.y,
            w: patch.w ?? node.rect.w,
            h: patch.h ?? node.rect.h,
          },
          rot: patch.rot ?? node.rot,
        })),
      })),
    })
  },
  deleteSelected: () => {
    const { deck, current, selected } = get()
    if (!deck || !selected) return
    get().begin()
    set({
      deck: patchSlide(deck, current, (slide) => ({ ...slide, nodes: removeNode(slide.nodes, selected) })),
      selected: null,
    })
  },
  addSlide: () => {
    const { deck, current } = get()
    if (!deck) return
    get().begin()
    const source = deck.slides[current]
    const slide = source ? { ...cloneSlide(source), nodes: [] } : { id: uid(), nodes: [], background: '#ffffff', notes: '' }
    const slides = [...deck.slides]
    slides.splice(current + 1, 0, slide)
    set({ deck: { ...deck, slides }, current: current + 1, selected: null })
  },
  duplicateSlide: (index) => {
    const { deck } = get()
    if (!deck) return
    const source = deck.slides[index]
    if (!source) return
    get().begin()
    const slides = [...deck.slides]
    slides.splice(index + 1, 0, cloneSlide(source))
    set({ deck: { ...deck, slides }, current: index + 1, selected: null })
  },
  deleteSlide: (index) => {
    const { deck } = get()
    if (!deck || deck.slides.length <= 1) return
    get().begin()
    const slides = deck.slides.filter((_, i) => i !== index)
    set({ deck: { ...deck, slides }, current: Math.min(index, slides.length - 1), selected: null })
  },
  moveSlide: (from, to) => {
    const { deck } = get()
    if (!deck || from === to) return
    get().begin()
    const slides = [...deck.slides]
    const [moved] = slides.splice(from, 1)
    slides.splice(to, 0, moved)
    set({ deck: { ...deck, slides }, current: to, selected: null })
  },
  undo: () => {
    const { past, future, deck } = get()
    if (!past.length || !deck) return
    const previous = past[past.length - 1]
    set({ deck: previous, past: past.slice(0, -1), future: [deck, ...future].slice(0, HISTORY_LIMIT) })
  },
  redo: () => {
    const { future, past, deck } = get()
    if (!future.length || !deck) return
    const next = future[0]
    set({ deck: next, past: [...past, deck], future: future.slice(1) })
  },
}))
