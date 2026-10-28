import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { useDeck } from './store'
import { loadDeck, saveDeck } from './persist'

let last = useDeck.getState().deck
let timer: number | undefined

useDeck.subscribe((state) => {
  if (!state.deck || state.deck === last) return
  last = state.deck
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    if (last) saveDeck(last)
  }, 700)
})

loadDeck().then((deck) => {
  if (!deck) return
  last = deck
  useDeck.getState().restore(deck)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
