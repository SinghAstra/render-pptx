import { attr, kid, path } from './xml'

export type Theme = {
  colors: Record<string, string>
  majorFont: string
  minorFont: string
}

export const DEFAULT_THEME: Theme = {
  colors: {
    dk1: '000000', lt1: 'FFFFFF', dk2: '44546A', lt2: 'E7E6E6',
    accent1: '4472C4', accent2: 'ED7D31', accent3: 'A5A5A5',
    accent4: 'FFC000', accent5: '5B9BD5', accent6: '70AD47',
    hlink: '0563C1', folHlink: '954F72',
  },
  majorFont: 'Calibri Light',
  minorFont: 'Calibri',
}

export function parseTheme(doc: Document | null): Theme {
  if (!doc) return DEFAULT_THEME
  const theme = doc.documentElement
  const schemeEl = path(theme, ['themeElements', 'clrScheme'])
  const colors: Record<string, string> = { ...DEFAULT_THEME.colors }
  for (const el of Array.from(schemeEl?.children ?? [])) {
    const color = el.children[0]
    if (!color) continue
    const val = color.localName === 'sysClr' ? attr(color, 'lastClr') : attr(color, 'val')
    if (val) colors[el.localName] = val
  }
  const fontScheme = path(theme, ['themeElements', 'fontScheme'])
  const major = kid(kid(fontScheme, 'majorFont'), 'latin')
  const minor = kid(kid(fontScheme, 'minorFont'), 'latin')
  return {
    colors,
    majorFont: attr(major, 'typeface') || DEFAULT_THEME.majorFont,
    minorFont: attr(minor, 'typeface') || DEFAULT_THEME.minorFont,
  }
}

export function colorCtx(theme: Theme, phClr?: string) {
  return { scheme: theme.colors, phClr }
}
