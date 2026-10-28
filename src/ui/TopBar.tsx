import { useRef } from 'react'
import { useDeck } from '../store'

export function TopBar() {
  const deck = useDeck((s) => s.deck)
  const current = useDeck((s) => s.current)
  const load = useDeck((s) => s.load)
  const presenting = useDeck((s) => s.presenting)
  const setPresenting = useDeck((s) => s.setPresenting)
  const undo = useDeck((s) => s.undo)
  const redo = useDeck((s) => s.redo)
  const canUndo = useDeck((s) => s.past.length > 0)
  const canRedo = useDeck((s) => s.future.length > 0)
  const input = useRef<HTMLInputElement>(null)
  return (
    <header className="h-12 shrink-0 bg-[#1f2937] text-white flex items-center gap-3 px-3">
      <div className="text-sm font-semibold tracking-wide">Render PPTX</div>
      <div className="h-5 w-px bg-white/20" />
      <button
        onClick={() => input.current?.click()}
        className="h-8 px-3 rounded bg-white/10 hover:bg-white/20 text-sm"
      >
        Open .pptx
      </button>
      <button
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className="h-8 w-8 rounded bg-white/10 hover:bg-white/20 text-sm disabled:opacity-30 disabled:hover:bg-white/10"
      >
        ↶
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        className="h-8 w-8 rounded bg-white/10 hover:bg-white/20 text-sm disabled:opacity-30 disabled:hover:bg-white/10"
      >
        ↷
      </button>
      <div className="flex-1 truncate text-sm text-white/60">
        {deck ? `${deck.title} — ${deck.slides.length} slides` : 'No presentation'}
      </div>
      {deck ? (
        <>
          <span className="text-xs tabular-nums text-white/50">
            {current + 1} / {deck.slides.length}
          </span>
          <button
            onClick={() => setPresenting(!presenting)}
            className="h-8 px-3 rounded bg-[#2563eb] hover:bg-[#1d4ed8] text-sm"
          >
            {presenting ? 'Exit' : 'Present'}
          </button>
        </>
      ) : null}
      <input
        ref={input}
        type="file"
        accept=".pptx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) load(file)
          e.target.value = ''
        }}
      />
    </header>
  )
}
