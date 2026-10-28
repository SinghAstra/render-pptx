import { openPackage } from './package'
import { loadRels, emptyRels, type Rels } from './rels'
import { kid, kids, numAttr, relId } from './xml'
import { parseTheme, type Theme } from './theme'
import { parseThemeFmt } from './style'
import { createMedia } from './media'
import { buildClrMap, applyClrOverride, clrMapOverride, backgroundOf, shapesOf, spTreeOf } from './slide'
import { indexPlaceholders, type PartCtx } from './context'
import { EMU } from './xfrm'
import type { Deck, Slide } from './types'

export async function importPptx(data: ArrayBuffer, name: string): Promise<Deck> {
  const pkg = await openPackage(data)
  const presPath = 'ppt/presentation.xml'
  const pres = await pkg.xml(presPath)
  if (!pres) throw new Error('This file is not a PowerPoint presentation')
  const presRels = await loadRels(pkg, presPath)
  const root = pres.documentElement
  const size = kid(root, 'sldSz')
  const width = numAttr(size, 'cx', 12192000) / EMU
  const height = numAttr(size, 'cy', 6858000) / EMU
  const defaultTextStyle = kid(root, 'defaultTextStyle')
  const media = createMedia(pkg)
  const docs = new Map<string, Promise<Document | null>>()
  const relCache = new Map<string, Promise<Rels>>()
  const load = (p: string) => {
    if (!docs.has(p)) docs.set(p, pkg.xml(p))
    return docs.get(p) as Promise<Document | null>
  }
  const relOf = (p: string) => {
    if (!relCache.has(p)) relCache.set(p, loadRels(pkg, p))
    return relCache.get(p) as Promise<Rels>
  }
  const imagesOf = async (rels: Rels) => {
    const map = new Map<string, string>()
    for (const rel of rels.list) {
      if (rel.external || !rel.type.endsWith('/image')) continue
      const url = await media.resolve(rels, rel.id)
      if (url) map.set(rel.id, url)
    }
    return map
  }
  const textDefaults = defaultTextStyle ? [defaultTextStyle] : []
  const build = async (path: string): Promise<Slide> => {
    const doc = await load(path)
    const srels = await relOf(path)
    const layoutRel = srels.byType('/slideLayout')[0]
    const layoutPath = layoutRel?.target
    const layout = layoutPath ? await load(layoutPath) : null
    const lrels = layoutPath ? await relOf(layoutPath) : emptyRels
    const masterPath = lrels.byType('/slideMaster')[0]?.target
    const master = masterPath ? await load(masterPath) : null
    const mrels = masterPath ? await relOf(masterPath) : emptyRels
    const themePath = mrels.byType('/theme')[0]?.target
    const themeDoc = themePath ? await load(themePath) : null
    const theme = parseTheme(themeDoc)
    const fmt = parseThemeFmt(themeDoc)
    const baseColors = buildClrMap(theme.colors, kid(master?.documentElement, 'clrMap'))
    const colors = applyClrOverride(applyClrOverride(baseColors, clrMapOverride(layout)), clrMapOverride(doc))
    const make = async (partRels: Rels): Promise<PartCtx> => ({
      pkg,
      theme,
      fmt,
      media,
      defaultTextStyle,
      rels: partRels,
      colors: { scheme: colors },
      textDefaults,
      styles: kid(master?.documentElement, 'txStyles'),
      images: await imagesOf(partRels),
    })
    const masterCtx = await make(mrels)
    const layoutCtx = await make(lrels)
    const slideCtx = await make(srels)
    const showMaster = (layout?.documentElement.getAttribute('showMasterSp') ?? '1') !== '0'
    const masterShapes = showMaster ? await shapesOf(spTreeOf(master), masterCtx, undefined, true) : []
    const layoutShapes = await shapesOf(spTreeOf(layout), layoutCtx, undefined, true)
    const placeholders = {
      layout: indexPlaceholders(spTreeOf(layout)),
      master: indexPlaceholders(spTreeOf(master)),
    }
    const slideShapes = await shapesOf(spTreeOf(doc), slideCtx, placeholders, false)
    const background = backgroundOf([doc, layout, master], slideCtx)
    return { id: path, nodes: [...masterShapes, ...layoutShapes, ...slideShapes], background, notes: '' }
  }
  const slides: Slide[] = []
  for (const sldId of kids(kid(root, 'sldIdLst'), 'sldId')) {
    const target = presRels.target(relId(sldId))
    if (!target) continue
    slides.push(await build(target))
  }
  const firstMaster = presRels.byType('/slideMaster')[0]
  const themePath = firstMaster ? (await relOf(firstMaster.target)).byType('/theme')[0]?.target : undefined
  const theme: Theme = parseTheme(themePath ? await load(themePath) : null)
  return {
    title: name.replace(/\.pptx?$/i, ''),
    width,
    height,
    slides,
    theme: { colors: theme.colors, majorFont: theme.majorFont, minorFont: theme.minorFont },
  }
}
