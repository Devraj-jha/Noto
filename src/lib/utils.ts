export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  )
}

export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = 60_000
  const hour = 60 * min
  const day = 24 * hour

  if (diff < min) return 'just now'
  if (diff < hour) return `${Math.floor(diff / min)}m ago`
  if (diff < day) return `${Math.floor(diff / hour)}h ago`
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function titleFromContent(md: string): string {
  // first heading, else first non-empty line, else the first few words
  const headingMatch = md.match(/^#\s+(.+)$/m)
  if (headingMatch) return headingMatch[1].trim().slice(0, 60)

  const firstLine = md
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .find((l) => !/^[-*]\s/.test(l))

  if (firstLine) return firstLine.replace(/^#{1,6}\s*/, '').slice(0, 60)

  const words = md.replace(/[#*`_>~\[\]()]/g, '').trim()
  return words ? words.slice(0, 40) : 'Untitled'
}

export function snippetFromContent(md: string): string {
  const clean = md
    .replace(/```[\s\S]*?```/g, '[code] ')
    .replace(/[#*_`>~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return clean.slice(0, 140)
}

export function wordCount(md: string): number {
  const text = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_`>~\[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text ? text.split(' ').length : 0
}

// rough reading time at 200 words per minute
export function readingTimeMin(words: number): number {
  return Math.max(1, Math.round(words / 200))
}

export const TRASH_WINDOW_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export function isExpiredFromTrash(note: { deletedAt: number }): boolean {
  return Date.now() - note.deletedAt > TRASH_WINDOW_MS
}