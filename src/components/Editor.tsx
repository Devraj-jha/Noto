import { useEffect, useMemo, useRef, useState } from 'react'
import { useNotes } from '../store/useNotes'
import { renderBlocks } from '../lib/markdown'
import { titleFromContent } from '../lib/utils'
import { debounce } from '../lib/utils'
import { wordCount, readingTimeMin } from '../lib/utils'
import { motion } from 'framer-motion'

const PAD = 20 // must match textarea padding so overlay + textarea align

export function Editor({ onBackToList }: { onBackToList: () => void }) {
  const note = useNotes((s) => s.notes.find((n) => n.id === s.selectedNoteId) ?? null)
  const updateNote = useNotes((s) => s.updateNote)
  const setSaveStatus = useNotes((s) => s.setSaveStatus)
  const moveToFolder = useNotes((s) => s.moveToFolder)
  const folders = useNotes((s) => s.folders)
  const searchQuery = useNotes((s) => s.searchQuery)

  const [draft, setDraft] = useState(note?.content ?? '')
  const [title, setTitleState] = useState(note?.title ?? '')
  const [newTag, setNewTag] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)
  const preRef = useRef<HTMLDivElement>(null)

  // reset draft when switching notes
  useEffect(() => {
    setDraft(note?.content ?? '')
    setTitleState(note?.title ?? '')
    setNewTag('')
  }, [note?.id])

  function addTag(raw: string) {
    if (!note) return
    const tag = raw.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '-')
    if (!tag || note.tags.includes(tag)) { setNewTag(''); return }
    updateNote(note.id, { tags: [...note.tags, tag] })
    setNewTag('')
  }

  function removeTag(tag: string) {
    if (!note) return
    updateNote(note.id, { tags: note.tags.filter((t) => t !== tag) })
  }

  const persist = useMemo(
    () =>
      debounce((id: string, content: string, t: string) => {
        updateNote(id, { content, title: t || titleFromContent(content) })
      }, 380),
    [updateNote]
  )

  function onType(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    setDraft(value)
    setSaveStatus('saving')
    if (!note) return
    persist(note.id, value, title)
  }

  function onTitle(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setTitleState(value)
    if (!note) return
    updateNote(note.id, { title: value })
  }

  function syncScroll() {
    const ta = taRef.current, pre = preRef.current
    if (!ta || !pre) return
    pre.scrollTop = ta.scrollTop
    pre.scrollLeft = ta.scrollLeft
  }

  const blocks = useMemo(() => renderBlocks(draft, searchQuery), [draft, searchQuery])

  const words = useMemo(() => wordCount(draft), [draft])
  const readTime = readingTimeMin(words)

  if (!note) {
    return <EditorShell><EmptyPalette /></EditorShell>
  }

  return (
    <EditorShell>
      <div className="flex h-full flex-col">
        {/* meta row */}
        <div className="flex items-center gap-3 px-4 pt-5">
          <button
            type="button"
            onClick={onBackToList}
            aria-label="Back to notes"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] md:hidden"
          >‹</button>
          <input
            value={title}
            onChange={onTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                taRef.current?.focus()
              }
            }}
            placeholder="Title"
            aria-label="Note title"
            className="flex-1 bg-transparent text-[1.4rem] font-bold leading-tight text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none"
          />
          <select
            value={note.folderId ?? ''}
            onChange={(e) => moveToFolder(note.id, e.target.value || null)}
            aria-label="Folder"
            className="rounded-lg border border-[var(--border)] bg-transparent px-2 py-1 text-sm text-[var(--muted)] focus:outline-none"
          >
            <option value="">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* editor */}
        <div className="relative min-h-0 flex-1" style={{ padding: PAD }}>
          {/* rendered overlay */}
          <div
            ref={preRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 select-none overflow-hidden whitespace-pre-wrap break-words text-[1.05rem] leading-[1.75] text-[var(--text)]"
            style={{
              padding: PAD,
              fontFamily: 'var(--font-serif)',
              // reflect textarea wrap exactly
            }}
          >
            {blocks.length === 0 ? (
              <span className="text-[var(--faint)]">
                A thought worth keeping…
              </span>
            ) : (
              blocks.map((b) => (
                <div key={b.key} style={{ paddingLeft: b.indent * 2 }} className="whitespace-pre-wrap break-words">
                  {b.content}
                </div>
              ))
            )}
          </div>

          {/* editable textarea (transparent text, real caret + native editing) */}
          <textarea
            ref={taRef}
            value={draft}
            onChange={onType}
            onScroll={syncScroll}
            spellCheck={false}
            aria-label="Note content"
            placeholder="Write something. Anything. It's safe here."
            className="absolute inset-0 resize-none overflow-auto whitespace-pre-wrap break-words bg-transparent text-transparent caret-[var(--accent)] focus:outline-none selection:bg-[var(--accent-soft)] selection:text-transparent"
            style={{
              padding: PAD,
              fontFamily: 'var(--font-serif)',
              fontSize: '1.05rem',
              lineHeight: '1.75',
            }}
          />
        </div>

        {/* tags */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--border)] px-4 py-2">
          {note.tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => removeTag(t)}
              aria-label={`Remove tag ${t}`}
              className="group flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs text-[var(--muted)] transition-colors hover:text-[var(--danger)]"
            >
              #{t}
              <span className="text-[var(--faint)] group-hover:text-[var(--danger)]">✕</span>
            </button>
          ))}
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(newTag) }
            }}
            placeholder={note.tags.length ? 'Add tag…' : 'Tag this note…'}
            aria-label="Add a tag"
            className="min-w-[6rem] flex-1 bg-transparent text-xs text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none"
          />
        </div>

        {/* word + reading count footer */}
        <div className="flex items-center gap-4 border-t border-[var(--border)] px-4 py-2 text-[0.7rem] text-[var(--faint)]" aria-live="polite">
          <span>{words.toLocaleString()} words</span>
          <span>{readTime} min read</span>
        </div>
      </div>
    </EditorShell>
  )
}

function EditorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex-1 overflow-hidden">
      <Background />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}

function Background() {
  return (
    <div className="absolute inset-0 bg-[var(--surface)]">
      {/* subtle paper texture feel via faint radial */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, var(--accent-soft), transparent 40%), radial-gradient(circle at 80% 70%, var(--accent-soft), transparent 45%)',
        }}
      />
    </div>
  )
}

function EmptyPalette() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-sm"
      >
        <h1 className="font-serif text-3xl text-[var(--text)]">Where do you want to write?</h1>
        <p className="mt-4 leading-relaxed text-[var(--muted)]">
          Pick a note from the left, or press <kbd className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 font-sans text-xs">⌘ N</kbd>{' '}
          to start something new.
        </p>
      </motion.div>
    </div>
  )
}