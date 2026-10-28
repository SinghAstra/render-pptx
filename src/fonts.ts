const SYSTEM_FONTS = new Set(
  [
    'arial', 'arial black', 'calibri', 'calibri light', 'cambria', 'candara', 'comic sans ms',
    'consolas', 'constantia', 'corbel', 'courier new', 'georgia', 'gill sans mt', 'impact',
    'lucida console', 'lucida sans unicode', 'palatino linotype', 'segoe ui', 'segoe ui light',
    'segoe ui semibold', 'tahoma', 'times new roman', 'trebuchet ms', 'verdana', 'webdings',
    'wingdings', 'symbol', 'franklin gothic book', 'franklin gothic medium', 'garamond',
    'book antiqua', 'bookman old style', 'century gothic', 'rockwell', 'perpetua', 'bodoni mt',
  ].map((f) => f.toLowerCase()),
)

const WEIGHT_WORDS: Record<string, number> = {
  thin: 100,
  extralight: 200,
  light: 300,
  medium: 500,
  semibold: 600,
  demibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
  heavy: 900,
}

export function splitFamily(font: string): { family: string; weight: number | null } {
  const match = font.match(/^(.*?)\s+(Thin|ExtraLight|Light|Medium|SemiBold|DemiBold|Bold|ExtraBold|Black|Heavy)$/i)
  if (match) return { family: match[1], weight: WEIGHT_WORDS[match[2].toLowerCase()] ?? null }
  return { family: font, weight: null }
}

function available(family: string): boolean {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return true
    const sample = 'mmmmmmmmmmlli'
    ctx.font = '72px monospace'
    const base = ctx.measureText(sample).width
    ctx.font = `72px "${family}", monospace`
    return Math.abs(ctx.measureText(sample).width - base) > 0.4
  } catch {
    return true
  }
}

function slug(family: string): string {
  return family.trim().replace(/\s+/g, '+')
}

export async function ensureFonts(families: string[]): Promise<boolean> {
  const targets = [...new Set(families.map((f) => splitFamily(f).family))].filter(
    (f) => f && !SYSTEM_FONTS.has(f.toLowerCase()) && !available(f),
  )
  if (!targets.length) return false
  const links = targets.map((family) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${slug(family)}:wght@300;400;500;600;700;800&display=swap`
    document.head.appendChild(link)
    return link
  })
  const sheets = Promise.all(
    links.map(
      (link) =>
        new Promise<void>((resolve) => {
          link.addEventListener('load', () => resolve())
          link.addEventListener('error', () => resolve())
        }),
    ),
  )
  const timeout = new Promise<void>((resolve) => setTimeout(() => resolve(), 4000))
  await Promise.race([sheets, timeout])
  const loads = await Promise.all(
    targets.map((family) =>
      document.fonts
        .load(`400 16px "${family}"`)
        .then((faces) => faces.length > 0)
        .catch(() => false),
    ),
  )
  return loads.some(Boolean)
}
