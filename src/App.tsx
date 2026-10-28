import { useEffect, useState } from 'react'
import { useDeck } from './store'
import { TopBar } from './ui/TopBar'
import { Thumbnails } from './ui/Thumbnails'
import { Stage } from './ui/Stage'
import { Empty } from './ui/Empty'
import { Presenter } from './ui/Presenter'
import { findNode } from './model'

export default function App() {
  const deck = useDeck((s) => s.deck)
  const presenting = useDeck((s) => s.presenting)
  const setPresenting = useDeck((s) => s.setPresenting)
  const load = useDeck((s) => s.load)
  const step = useDeck((s) => s.step)
  const selected = useDeck((s) => s.selected)
  const pick = useDeck((s) => s.pick)
  const begin = useDeck((s) => s.begin)
  const patchNode = useDeck((s) => s.patchNode)
  const deleteSelected = useDeck((s) => s.deleteSelected)
  const undo = useDeck((s) => s.undo)
  const redo = useDeck((s) => s.redo)
  const fontVersion = useDeck((s) => s.fontVersion)
  const [dragging, setDragging] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.shiftKey ? redo() : undo()
        e.preventDefault()
        return
      }
      if (mod && e.key.toLowerCase() === 'y') {
        redo()
        e.preventDefault()
        return
      }
      if (e.key === 'Escape') {
        if (presenting) setPresenting(false)
        else pick(null)
        return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        deleteSelected()
        e.preventDefault()
        return
      }
      const nudge: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      }
      if (selected && nudge[e.key]) {
        const [dx, dy] = nudge[e.key]
        const k = e.shiftKey ? 10 : 1
        const slide = deck?.slides[useDeck.getState().current]
        const node = slide ? findNode(slide.nodes, selected) : null
        if (node) {
          if (!e.repeat) begin()
          patchNode(selected, { x: node.rect.x + dx * k, y: node.rect.y + dy * k })
        }
        e.preventDefault()
        return
      }
      if (e.key === 'F5') {
        setPresenting(true)
        e.preventDefault()
        return
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
        step(1)
        e.preventDefault()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        step(-1)
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, setPresenting, selected, pick, begin, patchNode, deleteSelected, undo, redo, deck, presenting])
  useEffect(() => {
    const over = (e: DragEvent) => {
      e.preventDefault()
      setDragging(true)
    }
    const leave = (e: DragEvent) => {
      if (e.relatedTarget) return
      setDragging(false)
    }
    const drop = (e: DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer?.files?.[0]
      if (file && /\.pptx$/i.test(file.name)) load(file)
    }
    window.addEventListener('dragover', over)
    window.addEventListener('dragleave', leave)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragover', over)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('drop', drop)
    }
  }, [load])
  return (
    <div className="h-full flex flex-col">
      <TopBar />
      <div className="flex-1 flex min-h-0" key={fontVersion}>
        {deck ? <Thumbnails /> : null}
        {deck ? <Stage /> : <Empty />}
      </div>
      {presenting ? <Presenter /> : null}
      {dragging ? (
        <div className="fixed inset-0 z-40 bg-[#2563eb]/10 border-4 border-[#2563eb] pointer-events-none flex items-center justify-center">
          <div className="text-[#1d4ed8] font-medium">Drop to open</div>
        </div>
      ) : null}
    </div>
  )
}
