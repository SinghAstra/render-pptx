import { create } from 'zustand'
import type { Deck } from './import/types'
import { importPptx } from './import/deck'

type State = {
  deck: Deck | null
  current: number
  loading: boolean
  error: string | null
  presenting: boolean
  load: (file: File) => Promise<void>
  select: (index: number) => void
  step: (delta: number) => void
  setPresenting: (on: boolean) => void
}

export const useDeck = create<State>((set, get) => ({
  deck: null,
  current: 0,
  loading: false,
  error: null,
  presenting: false,
  load: async (file) => {
    set({ loading: true, error: null })
    try {
      const deck = await importPptx(await file.arrayBuffer(), file.name)
      set({ deck, current: 0, loading: false })
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'Could not read this file' })
    }
  },
  select: (index) => {
    const deck = get().deck
    if (!deck) return
    set({ current: Math.max(0, Math.min(deck.slides.length - 1, index)) })
  },
  step: (delta) => {
    const { deck, current } = get()
    if (!deck) return
    set({ current: Math.max(0, Math.min(deck.slides.length - 1, current + delta)) })
  },
  setPresenting: (on) => set({ presenting: on }),
}))
