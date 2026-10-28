import { useEffect, useRef, useState } from 'react'
import { useDeck } from '../store'
import { SlideStage } from '../render/SlideStage'

export function Stage() {
  const deck = useDeck((s) => s.deck)
  const current = useDeck((s) => s.current)
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!box.current || !deck) return
    const el = box.current
    const measure = () => {
      const aspect = deck.width / deck.height
      const w = Math.min(el.clientWidth - 72, (el.clientHeight - 72) * aspect)
      setWidth(Math.max(120, w))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [deck])
  if (!deck) return null
  const slide = deck.slides[current]
  if (!slide) return null
  return (
    <div ref={box} className="flex-1 flex items-center justify-center overflow-hidden">
      <div
        className="shadow-[0_10px_40px_rgba(0,0,0,0.22)]"
        style={{ width, height: (width * deck.height) / deck.width }}
      >
        <SlideStage deck={deck} slide={slide} width={width} />
      </div>
    </div>
  )
}
