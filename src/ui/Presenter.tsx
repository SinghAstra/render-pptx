import { useEffect, useState } from 'react'
import { useDeck } from '../store'
import { SlideStage } from '../render/SlideStage'

export function Presenter() {
  const deck = useDeck((s) => s.deck)
  const current = useDeck((s) => s.current)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const fit = () => {
      if (!deck) return
      const aspect = deck.width / deck.height
      const w = Math.min(window.innerWidth, window.innerHeight * aspect)
      setSize({ w, h: w / aspect })
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [deck])
  if (!deck) return null
  const slide = deck.slides[current]
  if (!slide) return null
  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <SlideStage deck={deck} slide={slide} width={size.w} />
      <div className="absolute bottom-4 right-6 text-white/40 text-xs tabular-nums">
        {current + 1} / {deck.slides.length}
      </div>
    </div>
  )
}
