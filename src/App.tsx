import { useEffect, useCallback } from 'react'
import { useNotes } from './store/useNotes'
import { Sidebar } from './components/Sidebar'
import { NoteList } from './components/NoteList'
import { SearchBar } from './components/SearchBar'
import { Editor } from './components/Editor'
import { CommandPalette } from './components/CommandPalette'
import { ToastHost } from './components/ToastHost'
import { motion, MotionConfig, useReducedMotion } from 'framer-motion'

export default function App() {
  const init = useNotes((s) => s.init)
  const initialized = useNotes((s) => s.initialized)
  const createNote = useNotes((s) => s.createNote)
  const saveStatus = useNotes((s) => s.saveStatus)
  const toggleSidebar = useNotes((s) => s.toggleSidebar)
  const selectedId = useNotes((s) => s.selectedNoteId)
  const pinNote = useNotes((s) => s.pinNote)
  const trashNote = useNotes((s) => s.trashNote)
  const toggleArchive = useNotes((s) => s.toggleArchive)
  const view = useNotes((s) => s.view)
  const mobilePane = useNotes((s) => s.mobilePane)
  const setMobilePane = useNotes((s) => s.setMobilePane)

  useEffect(() => { init() }, [init])

  // update the document title to reflect the current note
  const selectedNote = useNotes((s) => {
    const id = s.selectedNoteId
    return id ? s.notes.find((n) => n.id === id) ?? null : null
  })
  useEffect(() => {
    document.title = selectedNote?.title || 'Noto — a quiet place for your thoughts'
  }, [selectedNote?.title])

  const onNewNote = useCallback((folderId?: string | null) => {
    const n = createNote(folderId)
    return n
  }, [createNote])

  // global shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        onNewNote()
      }
      if (mod && e.key.toLowerCase() === '\\') {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onNewNote, toggleSidebar])

  if (!initialized) {
    return (
      <div className="flex h-full items-center justify-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="text-[var(--faint)]"
        >
          ✍️
        </motion.div>
      </div>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex h-full overflow-hidden">
        <Sidebar onNewNote={onNewNote} />

        {/* middle column — note list; full pane on mobile until a note is opened */}
        <div className={`${
          mobilePane === 'editor' ? 'hidden md:flex' : 'flex'
        } w-[300px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg)] md:w-[340px]`}>
          <TopBar
            onNewNote={onNewNote}
            onToggleSidebar={toggleSidebar}
            saveStatus={saveStatus}
            selectedId={selectedId}
            onPin={pinNote}
            onArchive={toggleArchive}
            onTrash={trashNote}
            canDelete={!!selectedId && view !== 'trash'}
          />
          <SearchBar />
          <div className="min-h-0 flex-1">
            <NoteList />
          </div>
        </div>

        {/* editor — takes over the whole screen on mobile once a note is open */}
        <div className={`${mobilePane === 'list' ? 'hidden md:flex' : 'flex'} min-w-0 flex-1`}>
          <Editor onBackToList={() => setMobilePane('list')} />
        </div>

        <CommandPalette />
        <ToastHost />
      </div>
    </MotionConfig>
  )
}

function TopBar({ onNewNote, onToggleSidebar, saveStatus, selectedId, onPin, onArchive, onTrash, canDelete }: {
  onNewNote: () => void
  onToggleSidebar: () => void
  saveStatus: 'saved' | 'saving'
  selectedId: string | null
  onPin: (id: string) => void
  onArchive: (id: string) => void
  onTrash: (id: string) => void
  canDelete: boolean
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex items-center gap-1">
        <IconBtn label="Toggle sidebar" onClick={() => onToggleSidebar()}>☰</IconBtn>
        <IconBtn label="New note" onClick={() => onNewNote()}>＋</IconBtn>
      </div>

      <SavePulse status={saveStatus} />

      <div className="flex items-center gap-1">
        {selectedId && (
          <>
            <IconBtn label="Pin" onClick={() => onPin(selectedId)}>✷</IconBtn>
            <IconBtn label="Archive" onClick={() => onArchive(selectedId)}>🗕</IconBtn>
            {canDelete && <IconBtn label="Delete" onClick={() => onTrash(selectedId)}>🗑</IconBtn>}
          </>
        )}
      </div>
    </div>
  )
}

function SavePulse({ status }: { status: 'saved' | 'saving' }) {
  const reduceMotion = useReducedMotion()
  const anim = status === 'saving' && !reduceMotion
  return (
    <div className="flex items-center gap-1.5 text-[0.7rem] text-[var(--faint)]" aria-live="polite">
      <motion.span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: status === 'saving' ? 'var(--accent)' : 'var(--faint)' }}
        animate={
          anim
            ? { scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }
            : { scale: 1, opacity: status === 'saving' ? 0.9 : 0.7 }
        }
        transition={anim ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
      />
      {status === 'saving' ? 'Saving' : 'Saved'}
    </div>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
    >
      {children}
    </button>
  )
}