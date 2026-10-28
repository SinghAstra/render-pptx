import { useEffect, useState } from 'react'
import { useDeck } from './store'
import { TopBar } from './ui/TopBar'
import { Thumbnails } from './ui/Thumbnails'
import { Stage } from './ui/Stage'
import { Empty } from './ui/Empty'
import { Presenter } from './ui/Presenter'

export default function App() {
  const deck = useDeck((s) => s.deck)
  const presenting = useDeck((s) => s.presenting)
  const setPresenting = useDeck((s) => s.setPresenting)
  const load = useDeck((s) => s.load)
  const step = useDeck((s) => s.step)
  const [dragging, setDragging] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
        step(1)
        e.preventDefault()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        step(-1)
        e.preventDefault()
      } else if (e.key === 'Escape') {
        setPresenting(false)
      } else if (e.key === 'F5') {
        setPresenting(true)
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, setPresenting])
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
      <div className="flex-1 flex min-h-0">
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
