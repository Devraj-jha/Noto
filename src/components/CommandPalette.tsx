import { Command } from 'cmdk'
import { useEffect } from 'react'
import { useNotes } from '../store/useNotes'
import { AnimatePresence, motion } from 'framer-motion'
import { titleFromContent } from '../lib/utils'

export function CommandPalette() {
  const open = useNotes((s) => s.commandOpen)
  const setOpen = useNotes((s) => s.openCommand)
  const createNote = useNotes((s) => s.createNote)
  const notes = useNotes((s) => s.notes)
  const folders = useNotes((s) => s.folders)
  const setSelected = useNotes((s) => s.setSelected)
  const setView = useNotes((s) => s.setView)
  const setSearch = useNotes((s) => s.setSearch)
  const toggleTheme = useNotes((s) => s.toggleTheme)
  const toggleSidebar = useNotes((s) => s.toggleSidebar)
  const setFolder = useNotes((s) => s.setFolder)
  const trashNote = useNotes((s) => s.trashNote)
  const pinNote = useNotes((s) => s.pinNote)
  const toggleArchive = useNotes((s) => s.toggleArchive)
  const selectedId = useNotes((s) => s.selectedNoteId)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  const close = () => setOpen(false)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[12vh] backdrop-blur-sm"
          onMouseDown={close}
          role="dialog" aria-modal="true" aria-label="Command palette"
        >
          <motion.div
            initial={{ y: -8, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -4, opacity: 0, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="w-[480px] max-w-[90vw] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow,0_20px_60px_rgba(0,0,0,0.2))]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Command label="Command palette">
              <CommandInput onClose={close} />
              <Command.List className="max-h-[46vh] overflow-y-auto p-1.5">
                <Command.Empty className="px-4 py-6 text-center text-sm text-[var(--muted)]">
                  Nothing matches. Your secrets are safe.
                </Command.Empty>

                <Section>Actions</Section>
                <CommandItem
                  onSelect={() => { createNote(); close() }}
                >＋ Create a new note <Shortcut>N</Shortcut></CommandItem>
                <CommandItem
                  onSelect={() => { setView('all'); setSearch('') }}
                >Show all notes</CommandItem>
                <CommandItem
                  onSelect={() => {
                    setView('all')
                    close()
                    requestAnimationFrame(() => {
                      const el = document.getElementById('note-search')
                      if (el) (el as HTMLInputElement).focus()
                    })
                  }}
                >Search notes <Shortcut>/</Shortcut></CommandItem>
                <CommandItem onSelect={toggleTheme}>Toggle light / dark</CommandItem>
                <CommandItem onSelect={toggleSidebar}>Toggle sidebar</CommandItem>
                {selectedId && (
                  <>
                    <CommandItem onSelect={() => { pinNote(selectedId); close() }}>Toggle pin on selected</CommandItem>
                    <CommandItem onSelect={() => { toggleArchive(selectedId); close() }}>Archive selected</CommandItem>
                    <CommandItem onSelect={() => { trashNote(selectedId); close() }}>Delete selected</CommandItem>
                  </>
                )}

                <Section>Folders</Section>
                {folders.map((f) => (
                  <CommandItem key={f.id} onSelect={() => { setFolder(f.id); close() }}>
                    ▱ {f.name}
                  </CommandItem>
                ))}
                {folders.length === 0 && <CommandItem disabled>No folders yet</CommandItem>}

                <Section>Jump to note</Section>
                {notes.filter((n) => !n.deletedAt).slice(0, 12).map((n) => (
                  <CommandItem
                    key={n.id}
                    value={titleFromContent(n.content) + ' ' + n.title}
                    onSelect={() => { setView(n.pinned ? 'all' : 'all'); setSelected(n.id); close() }}
                  >
                    <span className="truncate">{titleFromContent(n.content) || 'Untitled'}</span>
                    <Shortcut>{n.folderId ? '↦' : ''}</Shortcut>
                  </CommandItem>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CommandInput({ onClose }: { onClose: () => void }) {
  return (
    <Command.Input
      autoFocus
      placeholder="Type a command or search…"
      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Escape') onClose() }}
      className="w-full bg-transparent px-4 py-3.5 text-[0.95rem] text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none"
    />
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <Command.Group
      heading={children}
      className="px-1.5 pb-0.5 pt-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]"
    />
  )
}

function CommandItem({ onSelect, children, disabled, value }: {
  onSelect?: () => void; children: React.ReactNode; disabled?: boolean; value?: string
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      disabled={disabled}
      value={value}
      className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-sm text-[var(--text)] data-[selected=true]:bg-[var(--accent-soft)] data-[selected=true]:text-[var(--text)] data-[disabled=true]:text-[var(--faint)]"
    >
      {children}
    </Command.Item>
  )
}

function Shortcut({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 text-[0.7rem] text-[var(--faint)]">{children}</span>
}