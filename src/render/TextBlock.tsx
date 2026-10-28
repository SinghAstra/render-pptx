import type { CSSProperties } from 'react'
import type { TextBody, TextRun } from '../import/types'

function runStyle(r: TextRun): CSSProperties {
  const deco = [r.underline ? 'underline' : '', r.strike ? 'line-through' : ''].filter(Boolean).join(' ')
  return {
    fontSize: r.size,
    fontWeight: r.bold ? 700 : 400,
    fontStyle: r.italic ? 'italic' : 'normal',
    textDecoration: deco || undefined,
    color: r.color ?? '#000',
    fontFamily: `"${r.font}", "Segoe UI", Arial, sans-serif`,
    letterSpacing: r.spacing ? r.spacing : undefined,
    backgroundColor: r.highlight ?? undefined,
    verticalAlign: r.sup ? 'super' : r.sub ? 'sub' : undefined,
    whiteSpace: 'pre-wrap',
  }
}

function runText(text: string) {
  return text.split('\n').flatMap((part, i) =>
    i === 0 ? [part] : [<br key={`br${i}`} />, part],
  )
}

export function TextBlock({ body, style }: { body: TextBody; style?: CSSProperties }) {
  const justify =
    body.anchor === 'middle' ? 'center' : body.anchor === 'bottom' ? 'flex-end' : 'flex-start'
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
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
      {body.paragraphs.map((p, i) => {
        const first = p.runs[0]
        return (
          <div
            key={i}
            style={{
              position: 'relative',
              margin: 0,
              fontSize: first?.size ?? 16,
              lineHeight: p.lineHeight,
              textAlign: p.align,
              paddingLeft: p.marL,
              textIndent: p.bullet ? undefined : p.indent,
              marginTop: p.spaceBefore || undefined,
              marginBottom: p.spaceAfter || undefined,
              whiteSpace: body.wrap ? undefined : 'nowrap',
            }}
          >
            {p.bullet ? (
              <span
                style={{
                  position: 'absolute',
                  left: p.marL + p.indent,
                  width: Math.max(0, -p.indent),
                  textAlign: 'center',
                  fontSize: first?.size ?? 16,
                  color: first?.color ?? '#000',
                }}
              >
                {p.bullet}
              </span>
            ) : null}
            {p.runs.map((r, j) => (
              <span key={j} style={runStyle(r)}>
                {runText(r.text)}
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}
