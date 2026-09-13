import { useState } from 'react'
import { useNotes } from '../store/useNotes'
import { motion } from 'framer-motion'
import { IconButton } from './IconButton'
import { wordCount } from '../lib/utils'
import type { Folder } from '../types/note'

interface Props {
  onNewNote: () => void
}

export function Sidebar({ onNewNote }: Props) {
  const folders = useNotes((s) => s.folders)
  const tags = useNotes((s) => s.visibleTags())
  const view = useNotes((s) => s.view)
  const setView = useNotes((s) => s.setView)
  const activeFolderId = useNotes((s) => s.activeFolderId)
  const setFolder = useNotes((s) => s.setFolder)
  const activeTag = useNotes((s) => s.activeTag)
  const setTag = useNotes((s) => s.setTag)
  const theme = useNotes((s) => s.theme)
  const toggleTheme = useNotes((s) => s.toggleTheme)
  const addFolder = useNotes((s) => s.addFolder)
  const renameFolder = useNotes((s) => s.renameFolder)
  const deleteFolder = useNotes((s) => s.deleteFolder)
  const notes = useNotes((s) => s.notes)
  const sidebarOpen = useNotes((s) => s.sidebarOpen)

  const [addingFolder, setAddingFolder] = useState(false)
  const [folderName, setFolderName] = useState('')

  const count = (pred: (n: (typeof notes)[number]) => boolean) =>
    notes.filter((n) => !n.deletedAt && pred(n)).length

  const alive = notes.filter((n) => !n.deletedAt)
  const totalWords = alive.reduce((sum, n) => sum + wordCount(n.content), 0)

  const navItems = [
    { key: 'all' as const, label: 'All Notes', icon: '◈', count: notes.filter((n) => !n.deletedAt && !n.archived && !n.pinned).length + count((n) => n.pinned) },
    { key: 'pinned' as const, label: 'Pinned', icon: '✷', count: notes.filter((n) => n.pinned && !n.deletedAt).length },
    { key: 'archived' as const, label: 'Archived', icon: '🗕', count: notes.filter((n) => n.archived && !n.deletedAt).length },
    { key: 'trash' as const, label: 'Trash', icon: '🗑', count: notes.filter((n) => n.deletedAt).length },
  ]

  function commitFolder() {
    const name = folderName.trim()
    if (name) addFolder(name)
    setFolderName('')
    setAddingFolder(false)
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 264 : 0, opacity: sidebarOpen ? 1 : 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0, 0.15, 1] }}
      className="absolute inset-y-0 left-0 z-30 shrink-0 overflow-hidden border-r border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow)] md:static md:shadow-none"
    >
      <div className="flex h-full w-[264px] flex-col" style={{ minWidth: 264 }}>
        {/* brand + actions */}
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-[var(--accent)]">✍️</span>
            <span className="font-serif text-lg tracking-tight text-[var(--text)]">Noto</span>
          </div>
          <div className="flex items-center gap-1">
            <IconButton label="New note" onClick={() => onNewNote()}>＋</IconButton>
            <IconButton label="Toggle theme" onClick={toggleTheme}>
              {theme === 'light' ? '☾' : '☀'}
            </IconButton>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6">
          <p className="flex items-center justify-between px-2 pb-1.5 pt-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
            Views
          </p>
          <nav className="space-y-0.5">
            {navItems.map((item) => (
              <NavRow
                key={item.key}
                active={view === item.key && !activeFolderId && !activeTag}
                onClick={() => { setView(item.key) }}
                icon={item.icon}
                label={item.label}
                count={item.count}
              />
            ))}
          </nav>

          {/* folders */}
          <div className="mt-5">
            <p className="flex items-center justify-between px-2 pb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
              Folders
              <button
                type="button"
                onClick={() => setAddingFolder((v) => !v)}
                aria-label="Add folder"
                aria-expanded={addingFolder}
                aria-controls="folder-name-input"
                className="text-[var(--muted)] hover:text-[var(--text)]"
              >＋</button>
            </p>
            {addingFolder && (
              <div className="mb-1 flex items-center gap-1 px-1">
                <input
                  id="folder-name-input"
                  autoFocus
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitFolder(); if (e.key === 'Escape') setAddingFolder(false) }}
                  placeholder="Folder name"
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm focus:outline-none"
                />
              </div>
            )}
            {folders.length === 0 && (
              <p className="px-2 text-[0.8rem] text-[var(--faint)]">No folders yet.</p>
            )}
            <div className="space-y-0.5">
              {folders.map((f) => (
                <FolderRow
                  key={f.id}
                  folder={f}
                  count={notes.filter((n) => n.folderId === f.id && !n.deletedAt && !n.archived).length}
                  active={view === 'folder' && activeFolderId === f.id}
                  onOpen={() => setFolder(f.id)}
                  onRename={(name) => { if (name.trim()) renameFolder(f.id, name.trim()) }}
                  onDelete={() => deleteFolder(f.id)}
                />
              ))}
            </div>
          </div>

          {/* tags */}
          {tags.length > 0 && (
            <div className="mt-5">
              <p className="px-2 pb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">Tags</p>
              <div className="flex flex-wrap gap-1 px-1">
                {tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(activeTag === t ? null : t)}
                    aria-pressed={activeTag === t}
                    className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                      activeTag === t
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--accent-soft)] text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--border)] px-4 py-2 text-[0.7rem] leading-relaxed text-[var(--faint)]">
          ⌘ K command · ⌘ N new note · ⌘ \ hide this
        </div>
        <div className="border-t border-[var(--border)] px-4 py-2 text-[0.68rem] text-[var(--faint)]">
          {alive.length} note{alive.length === 1 ? '' : 's'} · {totalWords.toLocaleString()} words
        </div>
      </div>
    </motion.aside>
  )
}

function NavRow({ active, onClick, icon, label, count }: {
  active: boolean; onClick: () => void; icon: string; label: string; count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
        active ? 'text-[var(--text)]' : 'text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
      }`}
    >
      {active && (
        <motion.span layoutId="nav-active" className="absolute inset-0 rounded-lg bg-[var(--accent-soft)]" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
      )}
      <span className="relative text-[0.95rem] text-[var(--accent)]">{icon}</span>
      <span className="relative flex-1 truncate font-medium">{label}</span>
      {count > 0 && <span className="relative text-xs text-[var(--faint)]">{count}</span>}
    </button>
  )
}

function FolderRow({ folder, count, active, onOpen, onRename, onDelete }: {
  folder: Folder; count: number; active: boolean
  onOpen: () => void; onRename: (name: string) => void; onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(folder.name)

  if (editing) {
    return (
      <div className="flex items-center gap-1 rounded-lg px-2 py-1">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => { onRename(value); setEditing(false) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onRename(value); setEditing(false) }
            if (e.key === 'Escape') { setEditing(false); setValue(folder.name) }
          }}
          aria-label={`Rename ${folder.name}`}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm focus:outline-none"
        />
      </div>
    )
  }

  return (
    <div className="group relative">
      <NavRow active={active} onClick={onOpen} icon="▱" label={folder.name} count={count} />
      <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md bg-[var(--surface)] p-0.5 group-hover:flex group-focus-within:flex">
        <button type="button" aria-label={`Rename ${folder.name}`} title="Rename"
          onClick={() => { setValue(folder.name); setEditing(true) }}
          className="h-5 w-5 rounded text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]">✎</button>
        <button type="button" aria-label={`Delete ${folder.name}`} title="Delete"
          onClick={onDelete}
          className="h-5 w-5 rounded text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--danger)]">🗑</button>
      </div>
    </div>
  )
}

