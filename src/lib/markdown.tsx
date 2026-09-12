import type { ReactNode } from 'react'

/**
 * Renders markdown content into React nodes for the editor overlay.
 *
 * Uses the "same-grid" technique: the overlay shares the textarea's exact
 * typography and never adds/removes characters, only styles ranges. This keeps
 * the caret perfectly aligned with the rendered text — the thing that makes
 * live markdown feel trustworthy instead of janky.
 */

const INLINE_RE =
  /(\*\*[^*]+\*\*|\*[^*\n]+\*|~~[^~\n]+~~|`[^`\n]+`|\[[^\]]+\]\([^)]+\))/g

export function tokenizeInline(text: string, query?: string): ReactNode {
  const parts = text.split(INLINE_RE)
  // track for search highlights
  const q = query?.trim().toLowerCase()

  const renderPiece = (piece: string, key: number): ReactNode => {
    let content: ReactNode = piece

    if (piece.startsWith('**')) {
      content = <strong key={key} className="font-semibold">{piece.slice(2, -2)}</strong>
    } else if (piece.startsWith('~~')) {
      content = <s key={key} className="line-through opacity-70">{piece.slice(2, -2)}</s>
    } else if (piece.startsWith('`')) {
      content = (
        <code key={key} className="rounded bg-[var(--accent-soft)] px-1 py-0.5 font-mono text-[0.9em]">
          {piece.slice(1, -1)}
        </code>
      )
    } else if (piece.startsWith('[')) {
      const m = piece.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (m) {
        content = (
          <a key={key} href={m[2]} target="_blank" rel="noreferrer"
             className="text-[var(--accent)] underline decoration-[var(--accent)]/40 underline-offset-2">
            {m[1]}
          </a>
        )
      }
    } else if (piece.startsWith('*') && piece.length > 2 && !piece.startsWith('**')) {
      content = <em key={key} className="italic">{piece.slice(1, -1)}</em>
    } else {
      content = piece
    }

    if (q && content !== (piece as unknown as ReactNode)) {
      return content
    }
    if (q && typeof piece === 'string') {
      return highlightText(piece, q, key)
    }
    return content
  }

  return <>{parts.map((p, i) => renderPiece(p, i))}</>
}

function highlightText(text: string, q: string, key: number): ReactNode {
  if (!q) return text
  const lower = text.toLowerCase()
  const idx = lower.indexOf(q)
  if (idx === -1) return text
  return (
    <span key={key}>
      {text.slice(0, idx)}
      <mark className="rounded bg-[var(--accent-soft)] text-[var(--text)] px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </span>
  )
}

export type BlockKind =
  | 'paragraph' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'quote'
  | 'codefence' | 'checkbox' | 'empty'

export interface RenderedBlock {
  kind: BlockKind
  indent: number
  content: ReactNode
  key: number
}

const HEADING_RE = /^(#{1,3})\s+(.*)$/
const UL_RE = /^[-*+]\s+(.*)$/
const OL_RE = /^\d+\.\s+(.*)$/
const CHECKBOX_RE = /^[-*+]\s+\[([ x])\]\s+(.*)$/
const QUOTE_RE = /^>\s?(.*)$/
const CODE_FENCE_RE = /^```/

export function renderBlocks(content: string, query?: string): RenderedBlock[] {
  const lines = content.split('\n')
  const blocks: RenderedBlock[] = []
  let inCodeFence = false
  let codeLines: string[] = []
  let key = 0

  const flushCode = () => {
    if (codeLines.length) {
      blocks.push({
        kind: 'codefence', indent: 0, key: key++,
        content: (
          <pre className="my-1 whitespace-pre-wrap font-mono text-[0.9em] text-[var(--muted)]">
            {codeLines.join('\n')}
          </pre>
        ),
      })
      codeLines = []
    }
  }

  for (const raw of lines) {
    const line = raw
    const leading = (line.match(/^\s*/)?.[0].length ?? 0)

    if (inCodeFence) {
      if (CODE_FENCE_RE.test(line.trim())) { inCodeFence = false; flushCode() }
      else codeLines.push(line)
      continue
    }
    if (CODE_FENCE_RE.test(line.trim())) { inCodeFence = true; codeLines = []; continue }

    const checkbox = line.match(CHECKBOX_RE)
    if (checkbox) {
      const checked = checkbox[1] === 'x'
      blocks.push({
        kind: 'checkbox', indent: leading, key: key++,
        content: (
          <span className="inline-flex items-start gap-2">
            <span aria-hidden className="mt-[0.15em] inline-block h-[0.85em] w-[0.85em] shrink-0 rounded-sm border align-middle"
                  data-checked={checked}
                  style={{
                    borderColor: 'var(--accent)',
                    background: checked ? 'var(--accent)' : 'transparent',
                  }}>
              {checked ? <span className="flex h-full items-center justify-center text-[0.7em] leading-none text-white">✓</span> : null}
            </span>
            <span className={checked ? 'opacity-55 line-through' : ''}>{tokenizeInline(checkbox[2], query)}</span>
          </span>
        ),
      })
      continue
    }

    const h = line.match(HEADING_RE)
    if (h && leading === 0) {
      const level = h[1].length
      const sizes = { 1: 'text-[1.25em] font-bold', 2: 'text-[1.12em] font-bold', 3: 'text-[1.02em] font-semibold' }
      blocks.push({
        kind: `h${level}` as BlockKind, indent: leading, key: key++,
        content: <span className={`${sizes[level as 1 | 2 | 3] ?? ''} text-[var(--text)]`}>{tokenizeInline(h[2], query)}</span>,
      })
      continue
    }

    const quote = line.match(QUOTE_RE)
    if (quote) {
      blocks.push({
        kind: 'quote', indent: leading, key: key++,
        content: (
          <span className="block border-l-2 pl-3 text-[var(--muted)]" style={{ borderColor: 'var(--accent)' }}>
            {tokenizeInline(quote[1], query)}
          </span>
        ),
      })
      continue
    }

    const ul = line.match(UL_RE)
    if (ul) {
      blocks.push({
        kind: 'ul', indent: leading, key: key++,
        content: (
          <span className="inline-flex gap-2">
            <span aria-hidden className="mt-[0.6em] inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--accent)' }} />
            <span>{tokenizeInline(ul[1], query)}</span>
          </span>
        ),
      })
      continue
    }

    const ol = line.match(OL_RE)
    if (ol) {
      const num = (line.match(/^(\d+)\./) as RegExpMatchArray)[1]
      blocks.push({
        kind: 'ol', indent: leading, key: key++,
        content: (
          <span className="inline-flex gap-2">
            <span className="w-6 shrink-0 text-right font-mono text-[0.9em] text-[var(--faint)]">{num}.</span>
            <span>{tokenizeInline(ol[1], query)}</span>
          </span>
        ),
      })
      continue
    }

    if (line.trim() === '') {
      blocks.push({ kind: 'empty', indent: 0, key: key++, content: <span className="block h-[1em]" /> })
      continue
    }

    blocks.push({ kind: 'paragraph', indent: leading, key: key++, content: tokenizeInline(line, query) })
  }

  flushCode()
  return blocks
}