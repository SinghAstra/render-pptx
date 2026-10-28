import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { TextBody, TextRun } from '../import/types'
import { splitFamily } from '../fonts'

function runStyle(r: TextRun, fit: number): CSSProperties {
  const deco = [r.underline ? 'underline' : '', r.strike ? 'line-through' : ''].filter(Boolean).join(' ')
  const font = splitFamily(r.font)
  return {
    fontSize: r.size * fit,
    fontWeight: font.weight ?? (r.bold ? 700 : 400),
    fontStyle: r.italic ? 'italic' : 'normal',
    textDecoration: deco || undefined,
    color: r.color ?? '#000',
    fontFamily: `"${font.family}", "Segoe UI", Arial, sans-serif`,
    letterSpacing: r.spacing ? r.spacing * fit : undefined,
    backgroundColor: r.highlight ?? undefined,
    verticalAlign: r.sup ? 'super' : r.sub ? 'sub' : undefined,
    whiteSpace: 'pre-wrap',
  }
}

function runText(text: string) {
  return text.split('\n').flatMap((part, i) => (i === 0 ? [part] : [<br key={`br${i}`} />, part]))
}

export function TextBlock({ body, style, flow }: { body: TextBody; style?: CSSProperties; flow?: boolean }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(1)
  useLayoutEffect(() => {
    if (flow || !body.shrink || !outer.current || !inner.current) return
    const available = outer.current.clientHeight - body.tIns - body.bIns
    const natural = inner.current.offsetHeight
    if (natural > available + 1 && fit > 0.45) {
      setFit((f) => Math.max(0.45, f * Math.max(0.75, (available / natural) * 0.99)))
    }
  }, [body, fit, flow])
  const justify = body.anchor === 'middle' ? 'center' : body.anchor === 'bottom' ? 'flex-end' : 'flex-start'
  return (
    <div
      ref={outer}
      style={{
        position: flow ? 'relative' : 'absolute',
        inset: flow ? undefined : 0,
        minHeight: flow ? '100%' : undefined,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: justify,
        paddingTop: body.tIns,
        paddingBottom: body.bIns,
        paddingLeft: body.lIns,
        paddingRight: body.rIns,
        overflow: 'visible',
        ...(body.vertical ? { writingMode: 'vertical-rl' as const } : {}),
        ...style,
      }}
    >
      <div ref={inner} style={{ flexShrink: 0 }}>
        {body.paragraphs.map((p, i) => {
          const first = p.runs[0]
          return (
            <div
              key={i}
              style={{
                position: 'relative',
                margin: 0,
                fontSize: (first?.size ?? 16) * fit,
                lineHeight: p.lineHeight,
                textAlign: p.align,
                paddingLeft: p.marL * fit,
                textIndent: p.bullet ? undefined : p.indent * fit,
                marginTop: p.spaceBefore * fit || undefined,
                marginBottom: p.spaceAfter * fit || undefined,
                whiteSpace: body.wrap ? undefined : 'nowrap',
              }}
            >
              {p.bullet ? (
                <span
                  style={{
                    position: 'absolute',
                    left: (p.marL + p.indent) * fit,
                    width: Math.max(0, -p.indent) * fit,
                    textAlign: 'center',
                    fontSize: (first?.size ?? 16) * fit,
                    color: first?.color ?? '#000',
                  }}
                >
                  {p.bullet}
                </span>
              ) : null}
              {p.runs.map((r, j) => (
                <span key={j} style={runStyle(r, fit)}>
                  {runText(r.text)}
                </span>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
