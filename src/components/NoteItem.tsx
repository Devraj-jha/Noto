interface Props {
  title: string
  snippet: string
  time: string
  pinned: boolean
  archived: boolean
  deleted: boolean
  tags: string[]
  active: boolean
  query?: string
  onClick: () => void
}

export function NoteItem({ title, snippet, time, pinned, archived, deleted, tags, active, query, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`group mb-1 w-full rounded-xl px-3 py-2.5 text-left transition-colors ${
        active ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--surface-hover)]'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="flex-1 truncate font-serif text-[1.02rem] leading-snug text-[var(--text)]">
          <Highlight text={title || 'Untitled'} q={query} />
        </span>
        <span className="shrink-0 text-[0.68rem] text-[var(--faint)]">{time}</span>
      </div>
      {snippet && (
        <p className="mt-1 line-clamp-2 text-[0.82rem] leading-relaxed text-[var(--muted)]">
          <Highlight text={snippet} q={query} />
        </p>
      )}
      <div className="mt-1.5 flex items-center gap-2">
        {pinned && <span className="text-[0.7rem] text-[var(--accent)]">✷ pinned</span>}
        {archived && <span className="text-[0.7rem] text-[var(--faint)]">archived</span>}
        {deleted && <span className="text-[0.7rem] text-[var(--danger)]">in trash</span>}
        {tags.slice(0, 2).map((t) => (
          <span key={t} className="text-[0.68rem] text-[var(--faint)]">#{t}</span>
        ))}
      </div>
    </button>
  )
}

function Highlight({ text, q }: { text: string; q?: string }) {
  if (!q) return <>{text}</>
  const needle = q.trim()
  if (!needle) return <>{text}</>
  const start = text.toLowerCase().indexOf(needle.toLowerCase())
  if (start === -1) return <>{text}</>
  const end = start + needle.length
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded-sm bg-[var(--accent-soft)] px-0.5 text-[var(--text)]">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  )
}