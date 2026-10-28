import { useRef } from 'react'
import { useDeck } from '../store'

export function Empty() {
  const input = useRef<HTMLInputElement>(null)
  const load = useDeck((s) => s.load)
  const loading = useDeck((s) => s.loading)
  const error = useDeck((s) => s.error)
  return (
    <div className="flex-1 flex items-center justify-center">
      <button
        onClick={() => input.current?.click()}
        className="w-[520px] h-[300px] rounded-xl border-2 border-dashed border-[#c3c8d0] bg-white/70 hover:bg-white hover:border-[#2563eb] transition flex flex-col items-center justify-center gap-3"
      >
        <span className="text-lg font-medium">{loading ? 'Opening presentation…' : 'Open a .pptx file'}</span>
        <span className="text-sm text-[#6b7280]">Click to browse, or drop the file anywhere</span>
        {error ? <span className="text-sm text-red-600 max-w-[420px]">{error}</span> : null}
      </button>
      <input
        ref={input}
        type="file"
        accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) load(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
