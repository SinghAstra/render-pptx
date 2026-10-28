import type { Deck, SlideNode } from './import/types'
import { formatNumber } from './import/chartParts'

const DB_NAME = 'render-pptx'
const STORE = 'deck'
const KEY = 'last'

type SeriesLike = { format?: string; label?: Record<string, unknown> }
type AxisLike = { format?: string; axisLabel?: Record<string, unknown> }
type OptionLike = { series?: SeriesLike[]; xAxis?: AxisLike; yAxis?: AxisLike }

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function reviveOption(option: OptionLike) {
  if (Array.isArray(option.series)) {
    for (const series of option.series) {
      if (!series.format || !series.label) continue
      const code = series.format
      series.label.formatter = (p: { value: number }) => formatNumber(Number(p.value), code)
    }
  }
  for (const axis of [option.xAxis, option.yAxis]) {
    if (!axis || !axis.format) continue
    const code = axis.format
    axis.axisLabel = { ...axis.axisLabel, formatter: (v: number) => formatNumber(v, code) }
  }
}

function reviveNodes(nodes: SlideNode[]) {
  for (const node of nodes) {
    if (node.kind === 'chart') reviveOption(node.chart.option as OptionLike)
    if (node.kind === 'group') reviveNodes(node.children)
  }
}

function decode(json: string): Deck {
  const deck = JSON.parse(json) as Deck
  for (const slide of deck.slides) reviveNodes(slide.nodes)
  return deck
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const request = run(tx.objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function saveDeck(deck: Deck): Promise<void> {
  await withStore('readwrite', (store) => store.put(JSON.stringify(deck), KEY))
}

export async function loadDeck(): Promise<Deck | null> {
  try {
    const raw = await withStore<string | undefined>('readonly', (store) => store.get(KEY) as IDBRequest<string | undefined>)
    if (!raw) return null
    return decode(raw)
  } catch {
    return null
  }
}

export async function clearDeck(): Promise<void> {
  await withStore('readwrite', (store) => store.delete(KEY))
}
