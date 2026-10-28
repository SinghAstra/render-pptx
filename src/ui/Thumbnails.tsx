import { useDeck } from '../store'
import { SlideStage } from '../render/SlideStage'

export function Thumbnails() {
  const deck = useDeck((s) => s.deck)
  const current = useDeck((s) => s.current)
  const select = useDeck((s) => s.select)
  if (!deck) return null
  return (
    <aside className="w-[196px] shrink-0 bg-[#f7f8fa] border-r border-[#e3e5e8] overflow-y-auto py-3 px-3">
      {deck.slides.map((slide, i) => (
        <button
          key={slide.id}
          onClick={() => select(i)}
          className="block w-full mb-2 text-left group"
        >
          <div className="flex gap-2">
            <span className="w-4 pt-0.5 text-[11px] text-right tabular-nums text-[#6b7280]">{i + 1}</span>
            <div
              className={`flex-1 border-2 ${
                i === current ? 'border-[#2563eb]' : 'border-transparent group-hover:border-[#c7cdd6]'
              }`}
            >
              <SlideStage deck={deck} slide={slide} width={152} />
            </div>
          </div>
        </button>
      ))}
    </aside>
  )
}
