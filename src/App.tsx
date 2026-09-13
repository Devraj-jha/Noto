import { useEffect, useCallback } from 'react'
import { useNotes } from './store/useNotes'
import { Sidebar } from './components/Sidebar'
import { NoteList } from './components/NoteList'
import { SearchBar } from './components/SearchBar'
import { Editor } from './components/Editor'
import { CommandPalette } from './components/CommandPalette'
import { ToastHost } from './components/ToastHost'
import { IconButton } from './components/IconButton'
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
  const notes = useNotes((s) => s.notes)
  const trashCount = notes.filter((n) => n.deletedAt).length
  const emptyTrash = useNotes((s) => s.emptyTrash)
  const restoreNote = useNotes((s) => s.restoreNote)
  const pushToast = useNotes((s) => s.pushToast)

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
    requestAnimationFrame(() => {
      const el = document.getElementById('note-title') as HTMLInputElement | null
      el?.focus()
      el?.select()
    })
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
      if (e.key === 'Escape' && mobilePane === 'editor') {
        setMobilePane('list')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onNewNote, toggleSidebar, setMobilePane, mobilePane])

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
            view={view}
            trashCount={trashCount}
            onEmptyTrash={() => {
              emptyTrash()
              pushToast({ message: 'Trash emptied', type: 'info' })
            }}
            onRestore={(id) => {
              restoreNote(id)
              pushToast({ message: 'Note restored', type: 'success' })
            }}
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

function TopBar({ onNewNote, onToggleSidebar, saveStatus, selectedId, onPin, onArchive, onTrash, canDelete, view, trashCount, onEmptyTrash }: {
  onNewNote: () => void
  onToggleSidebar: () => void
  saveStatus: 'saved' | 'saving'
  selectedId: string | null
  onPin: (id: string) => void
  onArchive: (id: string) => void
  onTrash: (id: string) => void
  canDelete: boolean
  view: string
  trashCount: number
  onEmptyTrash: () => void
  onRestore: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex items-center gap-1">
        <IconButton label="Toggle sidebar" className="h-8 w-8" onClick={() => onToggleSidebar()}>☰</IconButton>
        <IconButton label="New note" className="h-8 w-8" onClick={() => onNewNote()}>＋</IconButton>
      </div>

      <SavePulse status={saveStatus} />

      <div className="flex items-center gap-1">
        {view === 'trash' ? (
          <button
            type="button"
            onClick={onEmptyTrash}
            disabled={trashCount === 0}
            className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--danger)] transition-colors hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:text-[var(--faint)] disabled:hover:bg-transparent"
          >
            Empty trash
          </button>
        ) : (
          selectedId && (
            <>
              <IconButton label="Pin" className="h-8 w-8" onClick={() => onPin(selectedId)}>✷</IconButton>
              <IconButton label="Archive" className="h-8 w-8" onClick={() => onArchive(selectedId)}>🗕</IconButton>
              {canDelete && <IconButton label="Delete" className="h-8 w-8" onClick={() => onTrash(selectedId)}>🗑</IconButton>}
            </>
          )
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

