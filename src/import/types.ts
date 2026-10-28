export type Rect = { x: number; y: number; w: number; h: number }

export type Crop = { l: number; t: number; r: number; b: number }

export type Line = {
  color: string | null
  width: number
  dash: number[] | null
  beginArrow: string | null
  endArrow: string | null
  cap: 'flat' | 'round' | 'square'
}

export type TextRun = {
  text: string
  size: number
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  color: string
  font: string
  sup: boolean
  sub: boolean
  spacing: number
  highlight: string | null
}

export type TextParagraph = {
  runs: TextRun[]
  align: 'left' | 'center' | 'right' | 'justify'
  level: number
  bullet: string | null
  bulletIndent: number
  marL: number
  indent: number
  lineHeight: number | 'normal'
  spaceBefore: number
  spaceAfter: number
  rtl: boolean
}

export type TextBody = {
  paragraphs: TextParagraph[]
  anchor: 'top' | 'middle' | 'bottom'
  lIns: number
  rIns: number
  tIns: number
  bIns: number
  wrap: boolean
  vertical: boolean
  rot: number
  sizeScale: number
  shrink: boolean
}

export type Geom = { preset: string; adj?: number[]; path?: string; box?: { w: number; h: number } }

export type Cell = {
  text: TextBody | null
  fill: string | null
  borders: { t: Line | null; r: Line | null; b: Line | null; l: Line | null }
  colspan: number
  rowspan: number
  skip: boolean
  anchor: 'top' | 'middle' | 'bottom'
}

export type TableData = { cols: number[]; rows: { h: number; cells: Cell[] }[] }

export type ChartTitleRun = { text: string; color: string; size: number; bold: boolean; font: string }

export type ChartTitle = {
  runs: ChartTitleRun[]
  left: number
  top: number
  width: number
  align: 'left' | 'center' | 'right'
}

export type ChartSeriesData = {
  name: string
  values: (number | null)[]
  format: string
}

export type ChartData = {
  option: Record<string, unknown>
  transparent: boolean
  title: ChartTitle | null
  pie: boolean
  categories: string[]
  series: ChartSeriesData[]
}

type Base = {
  id: string
  name?: string
  rect: Rect
  rot: number
  flipH: boolean
  flipV: boolean
  hidden: boolean
}

export type ShapeNode = Base & {
  kind: 'shape'
  geom: Geom | null
  fill: string | null
  line: Line | null
  text: TextBody | null
  shadow: boolean
  arc?: { from: number; to: number }
}

export type ImageNode = Base & {
  kind: 'image'
  src: string
  crop: Crop
  rounded: boolean
}

export type LineNode = Base & { kind: 'line'; line: Line; preset: string }

export type GroupNode = Base & {
  kind: 'group'
  children: SlideNode[]
  chOff: { x: number; y: number }
  chSize: { w: number; h: number }
}

export type TableNode = Base & { kind: 'table'; table: TableData }

export type ChartNode = Base & { kind: 'chart'; chart: ChartData }

export type SlideNode = ShapeNode | ImageNode | LineNode | GroupNode | TableNode | ChartNode

export type Slide = {
  id: string
  nodes: SlideNode[]
  background: string
  notes: string
}

export type Deck = {
  title: string
  width: number
  height: number
  slides: Slide[]
  theme: { colors: Record<string, string>; majorFont: string; minorFont: string }
  fonts: string[]
}
