import { attr, kid, kids, relId } from './xml'
import { parseXfrm, hidden, shapeName } from './xfrm'
import { colorElement, readColor } from './color'
import { uid } from './shape'
import { axisFont, cacheValues, chartGridLine, dataLabelInfo, formatNumber, numFmt, readFont, seriesColor, titleText } from './chartParts'
import type { PartCtx } from './context'
import type { ChartNode } from './types'

const PALETTE = ['accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6']
const TYPES = ['barChart', 'bar3DChart', 'lineChart', 'areaChart', 'scatterChart', 'pieChart', 'doughnutChart']

type SeriesDef = {
  kind: string
  name: string
  cats: (string | number)[]
  values: (number | null)[]
  color: string
  labels: { show: boolean; pos?: string; format?: string }
  stack?: string
  horizontal: boolean
  smooth: boolean
}

export async function parseChart(frame: Element, ctx: PartCtx): Promise<ChartNode | null> {
  if (hidden(frame)) return null
  const xfrm = parseXfrm(kid(frame, 'xfrm'))
  const graphic = kid(kid(frame, 'graphic'), 'graphicData')
  const ref = kid(graphic, 'chart')
  const target = ref ? ctx.rels.target(relId(ref)) : undefined
  if (!xfrm || !target) return null
  const doc = await ctx.pkg.xml(target)
  const chart = kid(doc?.documentElement, 'chart')
  if (!chart) return null
  const option = buildOption(chart, ctx)
  return {
    kind: 'chart',
    id: uid(),
    name: shapeName(frame),
    rect: xfrm.rect,
    rot: xfrm.rot,
    flipH: xfrm.flipH,
    flipV: xfrm.flipV,
    hidden: false,
    chart: { option, transparent: true },
  }
}

function colorOf(ctx: PartCtx, i: number): string {
  const name = PALETTE[i % PALETTE.length]
  return `#${ctx.theme.colors[name] ?? '4472C4'}`
}

function buildOption(chart: Element, ctx: PartCtx): Record<string, unknown> {
  const plot = kid(chart, 'plotArea')
  const parts = kids(plot, '*')
  const axisById = new Map<string, Element>()
  for (const el of parts) {
    if (!['catAx', 'valAx', 'dateAx', 'serAx'].includes(el.localName)) continue
    const id = attr(kid(el, 'axId'), 'val')
    if (id) axisById.set(id, el)
  }
  const charts = parts.filter((p) => TYPES.includes(p.localName))
  if (!charts.length) return {}
  const font = readFont(kid(chart, 'txPr') ?? kid(kid(chart, 'title'), 'txPr'), ctx.colors, ctx.theme)
  const pie = charts.find((c) => c.localName === 'pieChart' || c.localName === 'doughnutChart')
  const series = pie ? [pieSeries(pie, ctx)] : buildSeries(charts, ctx)
  const base: Record<string, unknown> = {
    animation: false,
    backgroundColor: chartBackground(chart, ctx),
    textStyle: { fontFamily: font.family, fontSize: font.size, color: font.color },
  }
  const title = titleText(chart)
  if (title) {
    base.title = {
      text: title,
      left: 'center',
      top: 4,
      textStyle: { fontFamily: font.family, fontSize: font.size + 2, color: font.color, fontWeight: 'bold' },
    }
  }
  const legend = legendOption(chart, ctx)
  if (legend) base.legend = legend
  if (pie) {
    base.series = series.map((s) => pieOption(s, ctx, pie))
    return base
  }
  const horizontal = series[0]?.horizontal ?? false
  const catId = attr(kids(charts[0], 'axId')[0], 'val') ?? ''
  const valId = attr(kids(charts[0], 'axId')[1], 'val') ?? ''
  const catAxis = axisById.get(catId)
  const valAxis = axisById.get(valId)
  const cat = axisOption(catAxis, ctx, true, font)
  const val = axisOption(valAxis, ctx, false, font)
  const cats = series[0]?.cats ?? []
  const legendEl = kid(chart, 'legend')
  const legendPos = legendEl ? attr(kid(legendEl, 'legendPos'), 'val') ?? 'r' : null
  const grid = {
    left: legendPos === 'l' ? 120 : 8,
    right: legendPos === 'r' ? 120 : 16,
    top: title ? 40 : 12,
    bottom: legendPos === 'b' ? 40 : 12,
    containLabel: true,
  }
  if (horizontal) {
    base.yAxis = { ...cat, data: cats, type: 'category' }
    base.xAxis = val
  } else {
    base.xAxis = { ...cat, data: cats, type: 'category' }
    base.yAxis = val
  }
  base.grid = grid
  base.series = series.map((s, i) => seriesOption(s, i))
  return base
}

function chartBackground(chart: Element, ctx: PartCtx): string {
  const doc = chart.ownerDocument
  const spPr = kid(kid(doc.documentElement, 'spPr'), 'solidFill')
  if (!spPr) return 'transparent'
  return readColor(colorElement(spPr), ctx.colors) ?? 'transparent'
}

function buildSeries(charts: Element[], ctx: PartCtx): SeriesDef[] {
  const out: SeriesDef[] = []
  let index = 0
  for (const chart of charts) {
    const kind = chart.localName.replace('Chart', '').replace('3D', '')
    const dir = attr(kid(chart, 'barDir'), 'val') ?? 'col'
    const grouping = attr(kid(chart, 'grouping'), 'val') ?? 'clustered'
    const stack = grouping === 'stacked' || grouping === 'percentStacked' ? `stack-${chart.localName}` : undefined
    for (const ser of kids(chart, 'ser')) {
      const data = readSeries(ser)
      const labels = dataLabelInfo(ser, chart)
      out.push({
        kind,
        name: data.name || `Series ${index + 1}`,
        cats: data.cats,
        values: data.values,
        color: seriesColor(ser, { colors: ctx.colors, theme: ctx.theme, width: 0, height: 0 }, colorOf(ctx, index)),
        labels,
        stack,
        horizontal: kind === 'bar' && dir === 'bar',
        smooth: attr(kid(ser, 'smooth'), 'val') === '1',
      })
      index++
    }
  }
  if (charts.some((c) => attr(kid(c, 'grouping'), 'val') === 'percentStacked')) normalizePercent(out)
  return out
}

function normalizePercent(series: SeriesDef[]) {
  const totals = new Map<number, number>()
  for (const s of series) {
    s.values.forEach((v, i) => {
      if (v !== null) totals.set(i, (totals.get(i) ?? 0) + Math.abs(v))
    })
  }
  for (const s of series) {
    s.values = s.values.map((v, i) => {
      const t = totals.get(i) ?? 0
      return v === null || !t ? v : v / t
    })
  }
}

function readSeries(ser: Element) {
  const name = kids(kid(kid(kid(ser, 'tx'), 'strRef'), 'strCache'), 'pt')
    .map((p) => kid(p, 'v')?.textContent ?? '')
    .join('')
  const cats = readCats(kid(ser, 'cat'))
  const cached = cacheValues(kid(kid(kid(ser, 'val'), 'numRef'), 'numCache'))
  const values = cached.values.length ? cached.values : cached.cats.map((v) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  })
  return { name, cats, values }
}

function readCats(cat: Element | undefined): (string | number)[] {
  if (!cat) return []
  const strRef = kid(cat, 'strRef')
  if (strRef) return cacheValues(kid(strRef, 'strCache')).cats.filter((v) => v !== undefined && v !== null)
  const numRef = kid(cat, 'numRef')
  if (numRef) return cacheValues(kid(numRef, 'numCache')).values.map((v) => (v === null ? '' : v))
  const multi = kid(cat, 'multiLvlStrRef')
  if (multi) {
    const lvls = kids(kid(multi, 'multiLvlStrCache'), 'lvl')
    const last = lvls[lvls.length - 1]
    const res = cacheValues(last).cats.filter((v) => v !== undefined && v !== null)
    if (res.length) return res
    return lvls
      .map((l) => cacheValues(l).cats)
      .reduce<string[]>((acc, cur, i) => cur.map((v, j) => (i ? `${String(acc[j])} ${String(v)}` : String(v))), [])
  }
  return []
}

function seriesOption(s: SeriesDef, i: number): Record<string, unknown> {
  const label = {
    show: s.labels.show,
    position: labelPos(s),
    fontSize: 12,
    formatter: s.labels.format ? (p: { value: number }) => formatNumber(Number(p.value), s.labels.format ?? '') : undefined,
  }
  const base: Record<string, unknown> = { name: s.name, data: s.values }
  if (s.kind === 'line') {
    return {
      ...base,
      type: 'line',
      smooth: s.smooth,
      symbol: 'circle',
      symbolSize: 5,
      showSymbol: false,
      lineStyle: { width: 2, color: s.color },
      itemStyle: { color: s.color },
      label,
      ...(s.stack ? { stack: s.stack } : {}),
    }
  }
  if (s.kind === 'area') {
    return {
      ...base,
      type: 'line',
      smooth: s.smooth,
      showSymbol: false,
      lineStyle: { width: 2, color: s.color },
      itemStyle: { color: s.color },
      areaStyle: { color: s.color, opacity: 0.5 },
      label,
      ...(s.stack ? { stack: s.stack } : {}),
    }
  }
  if (s.kind === 'scatter') {
    return {
      ...base,
      type: 'scatter',
      symbolSize: 8,
      itemStyle: { color: s.color },
      label,
    }
  }
  return {
    ...base,
    type: 'bar',
    itemStyle: { color: s.color, borderColor: s.color, borderWidth: 0 },
    label,
    ...(s.stack ? { stack: s.stack } : {}),
    ...(i === 0 ? { barGap: '0%' } : {}),
  }
}

function labelPos(s: SeriesDef): string {
  const map: Record<string, string> = { outEnd: 'top', ctr: 'inside', inEnd: 'inside', inBase: 'insideBottom', outSideEnd: 'top' }
  return map[s.labels.pos ?? ''] ?? 'top'
}

function axisOption(axis: Element | undefined, ctx: PartCtx, isCat: boolean, fallback: { size: number; family: string; color: string }) {
  const font = axisFont(axis, { colors: ctx.colors, theme: ctx.theme, width: 0, height: 0 })
  const deleted = attr(kid(axis, 'delete'), 'val') === '1'
  const gridColor = chartGridLine(axis, { colors: ctx.colors, theme: ctx.theme, width: 0, height: 0 })
  const code = numFmt(axis)
  const name = kids(kid(kid(kid(axis, 'title'), 'tx'), 'rich'), 'p')
    .map((p) => kids(p, 'r').map((r) => kid(r, 't')?.textContent ?? '').join(''))
    .join('\n')
  return {
    show: !deleted,
    name,
    nameLocation: 'middle',
    nameGap: isCat ? 26 : 42,
    nameTextStyle: { fontSize: font.size || fallback.size, fontFamily: font.family || fallback.family, color: font.color || fallback.color },
    axisLine: { show: isCat && !deleted, lineStyle: { color: '#8c8c8c', width: 1 } },
    axisTick: { show: false },
    splitLine: { show: !isCat && !!gridColor, lineStyle: { color: gridColor ?? '#e0e0e0', width: 1 } },
    axisLabel: {
      show: attr(kid(axis, 'tickLblPos'), 'val') !== 'none',
      fontSize: font.size || fallback.size,
      fontFamily: font.family || fallback.family,
      color: font.color || fallback.color,
      formatter: isCat || !code ? undefined : (v: number) => formatNumber(v, code),
    },
    min: attr(kid(kid(axis, 'scaling'), 'min'), 'val') ? Number(attr(kid(kid(axis, 'scaling'), 'min'), 'val')) : undefined,
    max: attr(kid(kid(axis, 'scaling'), 'max'), 'val') ? Number(attr(kid(kid(axis, 'scaling'), 'max'), 'val')) : undefined,
  }
}

function legendOption(chart: Element, ctx: PartCtx) {
  const legend = kid(chart, 'legend')
  if (!legend) return undefined
  const pos = attr(kid(legend, 'legendPos'), 'val') ?? 'r'
  const font = readFont(kid(legend, 'txPr'), ctx.colors, ctx.theme)
  const place: Record<string, Record<string, unknown>> = {
    b: { bottom: 4, left: 'center' },
    t: { top: 4, left: 'center' },
    l: { left: 4, top: 'middle', orient: 'vertical' },
    r: { right: 4, top: 'middle', orient: 'vertical' },
    tr: { top: 4, right: 4 },
  }
  return {
    show: true,
    ...place[pos],
    itemWidth: 14,
    itemHeight: 9,
    icon: 'roundRect',
    textStyle: { fontSize: font.size, fontFamily: font.family, color: font.color },
  }
}

function pieSeries(chart: Element, ctx: PartCtx): SeriesDef {
  const ser = kid(chart, 'ser')
  const data = ser ? readSeries(ser) : { name: '', cats: [], values: [] }
  const labels = ser ? dataLabelInfo(ser, chart) : { show: false }
  return {
    kind: chart.localName === 'doughnutChart' ? 'doughnut' : 'pie',
    name: data.name,
    cats: data.cats,
    values: data.values,
    color: colorOf(ctx, 0),
    labels,
    horizontal: false,
    smooth: false,
  }
}

function pieOption(s: SeriesDef, ctx: PartCtx, chart: Element) {
  const ser = kid(chart, 'ser')
  const dPts = ser ? kids(ser, 'dPt') : []
  const pointColors = dPts.map((pt) => {
    const fill = kid(kid(pt, 'spPr'), 'solidFill')
    return fill ? readColor(colorElement(fill), ctx.colors) : null
  })
  const palette = PALETTE.map((name) => `#${ctx.theme.colors[name] ?? '4472C4'}`)
  return {
    type: 'pie',
    name: s.name,
    radius: s.kind === 'doughnut' ? ['45%', '70%'] : '70%',
    center: ['50%', '52%'],
    data: s.values.map((v, i) => ({
      value: v,
      name: String(s.cats[i] ?? ''),
      itemStyle: { color: pointColors[i] ?? palette[i % palette.length] },
    })),
    label: {
      show: s.labels.show,
      fontSize: 12,
      formatter: s.labels.format === '0%' ? '{d}%' : '{c}',
    },
  }
}
