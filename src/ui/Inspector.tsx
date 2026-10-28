import { useEffect, useRef, useState } from 'react'
import { useDeck } from '../store'
import { findNode } from '../model'

export function Inspector() {
  const deck = useDeck((s) => s.deck)
  const current = useDeck((s) => s.current)
  const selected = useDeck((s) => s.selected)
  const begin = useDeck((s) => s.begin)
  const patchNode = useDeck((s) => s.patchNode)
  const deleteSelected = useDeck((s) => s.deleteSelected)
  const duplicateNode = useDeck((s) => s.duplicateNode)
  const reorderNode = useDeck((s) => s.reorderNode)
  const dirty = useRef(false)
  const [rev, setRev] = useState(0)
  const slide = deck?.slides[current]
  const node = slide ? findNode(slide.nodes, selected) : null
  useEffect(() => {
    dirty.current = false
    setRev((v) => v + 1)
  }, [selected])
  if (!deck) return null
  if (!node) {
    return (
      <aside className="w-[236px] shrink-0 bg-white border-l border-[#e3e5e8] p-3 text-sm text-[#6b7280]">
        <div className="font-medium text-[#374151] mb-2">Properties</div>
        <p className="leading-relaxed">Select an element on the slide to edit its position, size and rotation.</p>
      </aside>
    )
  }
  const edit = (patch: { x?: number; y?: number; w?: number; h?: number; rot?: number }) => {
    if (!dirty.current) {
      dirty.current = true
      begin()
    }
    patchNode(node.id, patch)
  }
  const done = () => {
    dirty.current = false
  }
  return (
    <aside className="w-[236px] shrink-0 bg-white border-l border-[#e3e5e8] p-3 text-sm overflow-y-auto">
      <div className="font-medium text-[#374151] mb-1">Properties</div>
      <div className="text-[11px] text-[#6b7280] mb-3 truncate">{node.name || node.kind}</div>
      <div key={rev} className="grid grid-cols-2 gap-2">
        <Num label="X" value={node.rect.x} onInput={(x) => edit({ x })} onDone={done} />
        <Num label="Y" value={node.rect.y} onInput={(y) => edit({ y })} onDone={done} />
        <Num label="W" value={node.rect.w} onInput={(w) => edit({ w: Math.max(8, w) })} onDone={done} />
        <Num label="H" value={node.rect.h} onInput={(h) => edit({ h: Math.max(8, h) })} onDone={done} />
        <Num label="Rotation" value={node.rot} onInput={(rot) => edit({ rot })} onDone={done} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <ActionButton onClick={() => reorderNode(node.id, 1)}>Bring forward</ActionButton>
        <ActionButton onClick={() => reorderNode(node.id, -1)}>Send back</ActionButton>
        <ActionButton onClick={() => duplicateNode(node.id)}>Duplicate</ActionButton>
        <ActionButton onClick={deleteSelected}>Delete</ActionButton>
      </div>
      {node.kind === 'shape' && node.text ? (
        <div className="mt-4">
          <div className="text-[11px] text-[#6b7280] mb-1">Text</div>
          <div className="max-h-40 overflow-y-auto rounded border border-[#e3e5e8] bg-[#f9fafb] p-2 text-[12px] leading-snug whitespace-pre-wrap">
            {node.text.paragraphs.map((p) => p.runs.map((r) => r.text).join('')).join('\n')}
          </div>
        </div>
      ) : null}
      <div className="mt-4 text-[11px] text-[#9ca3af]">
        Arrows nudge · Shift+Arrows ×10 · Delete removes · Esc deselects
      </div>
    </aside>
  )
}

function Num({ label, value, onInput, onDone }: { label: string; value: number; onInput: (v: number) => void; onDone: () => void }) {
  const rounded = Math.round(value * 10) / 10
  const [text, setText] = useState(String(rounded))
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setText(String(Math.round(value * 10) / 10))
  }, [value])
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-[#6b7280]">{label}</span>
      <input
        value={text}
        onFocus={(e) => {
          focused.current = true
          e.target.select()
        }}
        onBlur={() => {
          focused.current = false
          setText(String(Math.round(value * 10) / 10))
          onDone()
        }}
        onChange={(e) => {
          setText(e.target.value)
          const n = Number(e.target.value)
          if (Number.isFinite(n) && e.target.value.trim() !== '') onInput(n)
        }}
        className="h-7 rounded border border-[#d5d9df] px-2 text-[12px] tabular-nums focus:border-[#2563eb] focus:outline-none"
      />
    </label>
  )
}

function ActionButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-7 rounded border border-[#d5d9df] bg-white text-[12px] text-[#374151] hover:border-[#2563eb] hover:text-[#2563eb]"
    >
      {children}
    </button>
  )
}
