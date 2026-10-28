import { useState } from 'react'
import { useDeck } from '../store'
import { SlideStage } from '../render/SlideStage'

export function Thumbnails() {
  const deck = useDeck((s) => s.deck)
  const current = useDeck((s) => s.current)
  const select = useDeck((s) => s.select)
  const addSlide = useDeck((s) => s.addSlide)
  const duplicateSlide = useDeck((s) => s.duplicateSlide)
  const deleteSlide = useDeck((s) => s.deleteSlide)
  const moveSlide = useDeck((s) => s.moveSlide)
  const [drag, setDrag] = useState<number | null>(null)
  if (!deck) return null
  return (
    <aside className="w-[196px] shrink-0 bg-[#f7f8fa] border-r border-[#e3e5e8] overflow-y-auto py-3 px-3">
      {deck.slides.map((slide, i) => (
        <div
          key={slide.id}
          draggable
          onDragStart={(e) => {
            setDrag(i)
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/plain', String(i))
          }}
          onDragEnd={() => setDrag(null)}
          onDragOver={(e) => {
            if (drag === null) return
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
          }}
          onDrop={(e) => {
            e.preventDefault()
            if (drag !== null && drag !== i) moveSlide(drag, i)
            setDrag(null)
          }}
          onClick={() => select(i)}
          className={`group relative flex gap-2 mb-2 cursor-pointer ${drag === i ? 'opacity-40' : ''}`}
        >
          <span className="w-4 pt-0.5 text-[11px] text-right tabular-nums text-[#6b7280]">{i + 1}</span>
          <div
            className={`flex-1 border-2 ${i === current ? 'border-[#2563eb]' : 'border-transparent group-hover:border-[#c7cdd6]'}`}
          >
            <SlideStage deck={deck} slide={slide} width={152} />
          </div>
          <div className="absolute right-1 top-1 hidden group-hover:flex gap-1">
            <IconButton title="Duplicate" onClick={() => duplicateSlide(i)}>
              ⧉
            </IconButton>
            <IconButton title="Delete" onClick={() => deleteSlide(i)}>
              ✕
            </IconButton>
          </div>
        </div>
      ))}
      <button
        onClick={addSlide}
        className="w-full h-9 mt-1 rounded border border-dashed border-[#c3c8d0] text-sm text-[#4b5563] hover:border-[#2563eb] hover:text-[#2563eb] bg-white/60"
      >
        + Add slide
      </button>
    </aside>
  )
}

function IconButton({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="w-5 h-5 flex items-center justify-center rounded bg-white/90 border border-[#d5d9df] text-[10px] text-[#374151] hover:bg-white hover:border-[#2563eb]"
    >
      {children}
    </button>
  )
}
