import { create } from 'zustand'
import {
  getAllNotes, getAllFolders, putNote, deleteNote as dbDeleteNote,
  deleteFolder as dbDeleteFolder, putFolder, putManyNotes, putManyFolders,
  getMeta, setMeta,
} from '../db/indexeddb'
import type { Note, Folder, Tag, ViewFilter } from '../types/note'
import { uid, isExpiredFromTrash } from '../lib/utils'
import { WELCOME_NOTE, DEFAULT_FOLDERS } from '../data/welcomeNote'

export type SaveStatus = 'saved' | 'saving'

interface Toast {
  id: string
  message: string
  sub?: string
  action?: { label: string; run: () => void }
  type?: 'info' | 'undo' | 'success'
}

interface NotesState {
  notes: Note[]
  folders: Folder[]
  tags: Tag[]
  initialized: boolean

  selectedNoteId: string | null
  view: ViewFilter
  activeFolderId: string | null
  activeTag: Tag | null
  searchQuery: string
  sidebarOpen: boolean
  commandOpen: boolean
  mobilePane: 'list' | 'editor'
  theme: 'light' | 'dark'
  saveStatus: SaveStatus
  toasts: Toast[]
  lastNoteContent: string // for undo of edits

  init: () => Promise<void>
  createNote: (folderId?: string | null) => Note
  updateNote: (id: string, patch: Partial<Pick<Note, 'content' | 'title' | 'tags'>>) => void
  trashNote: (id: string) => void
  restoreNote: (id: string) => void
  deleteNoteForever: (id: string) => void
  emptyTrash: () => void
  pinNote: (id: string) => void
  duplicateNote: (id: string) => void
  toggleArchive: (id: string) => void
  moveToFolder: (id: string, folderId: string | null) => void

  addFolder: (name: string) => void
  renameFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void

  selectedNote: () => Note | null
  visibleNotes: () => Note[]
  visibleTags: () => Tag[]

  setSelected: (id: string | null) => void
  setView: (v: ViewFilter) => void
  setFolder: (id: string | null) => void
  setTag: (t: Tag | null) => void
  setSearch: (q: string) => void
  toggleSidebar: () => void
  openCommand: (v: boolean) => void
  setMobilePane: (p: 'list' | 'editor') => void
  toggleTheme: () => void
  setSaveStatus: (s: SaveStatus) => void

  pushToast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

export const useNotes = create<NotesState>((set, get) => {
  /* helpers that read latest state */
  const persist = (note: Note) => { void putNote(note) }
  const persistFolders = (folders: Folder[]) => { void putManyFolders(folders) }

  let savedTimer: ReturnType<typeof setTimeout> | undefined
  function markSavedAfterDelay() {
    if (savedTimer) clearTimeout(savedTimer)
    savedTimer = setTimeout(() => {
      if (get().saveStatus === 'saving') set({ saveStatus: 'saved' })
    }, 420)
  }

  function applyTheme(t: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
  }

  return {
    notes: [],
    folders: [],
    tags: [],
    initialized: false,
    selectedNoteId: null,
    view: 'all',
    activeFolderId: null,
    activeTag: null,
    searchQuery: '',
    sidebarOpen: true,
    commandOpen: false,
    mobilePane: 'list',
    theme: 'light',
    saveStatus: 'saved',
    toasts: [],
    lastNoteContent: '',

    async init() {
      if (get().initialized) return
      let savedTheme = (await getMeta('theme')) as 'light' | 'dark' | null | undefined
      if (!savedTheme) {
        savedTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      applyTheme(savedTheme)

      let [notes, folders] = await Promise.all([getAllNotes(), getAllFolders()])
      const hasSeen = (await getMeta('seeded')) === true

      if (!hasSeen) {
        await seed()
        notes = await getAllNotes()
        folders = await getAllFolders()
        await setMeta('seeded', true)
      }

      // purge expired trash
      const expired = notes.filter((n) => n.deletedAt && isExpiredFromTrash(n))
      if (expired.length) {
        for (const n of expired) await dbDeleteNote(n.id)
        notes = notes.filter((n) => !isExpiredFromTrash(n))
      }

      const tagSet = new Set<Tag>()
      for (const n of notes) for (const t of n.tags) tagSet.add(t)

      set({
        notes,
        folders,
        tags: [...tagSet].sort(),
        theme: savedTheme,
        sidebarOpen: typeof window === 'undefined' ? true : window.innerWidth >= 768,
        initialized: true,
      })
    },

    createNote(folderId) {
      const now = Date.now()
      const note: Note = {
        id: uid(), title: '', content: '', folderId: folderId ?? get().activeFolderId,
        tags: [], pinned: false, archived: false, deletedAt: null, createdAt: now, updatedAt: now,
      }
      set((s) => ({ notes: [note, ...s.notes] }))
      persist(note)
      set({ selectedNoteId: note.id })
      return note
    },

    updateNote(id, patch) {
      const next = get().notes.map((n) => {
        if (n.id !== id) return n
        return { ...n, ...patch, updatedAt: Date.now() }
      })
      const edited = next.find((n) => n.id === id)!
      // optimistic — caller-edits typed directly into store state via a setter below,
      // this debounced path handles DB persistence + status
      set({ notes: next, saveStatus: 'saving' })
      markSavedAfterDelay()
      void putNote(edited)
    },

    trashNote(id) {
      const note = get().notes.find((n) => n.id === id)
      if (!note) return
      set({ lastNoteContent: note.content })
      const next = get().notes.map((n) =>
        n.id === id ? { ...n, deletedAt: Date.now(), archived: false } : n
      )
      set((s) => ({
        notes: next,
        selectedNoteId: s.selectedNoteId === id ? null : s.selectedNoteId,
        toasts: [...s.toasts, {
          id: uid(), message: 'Note moved to trash', type: 'undo',
          action: { label: 'Undo', run: () => get().restoreNote(id) },
        }],
      }))
      void persist({ ...note, deletedAt: Date.now(), archived: false })
    },

    restoreNote(id) {
      const next = get().notes.map((n) => (n.id === id ? { ...n, deletedAt: null } : n))
      const restored = next.find((n) => n.id === id)
      set({ notes: next })
      if (restored) persist(restored)
    },

    deleteNoteForever(id) {
      void dbDeleteNote(id)
      set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
    },

    emptyTrash() {
      const trash = get().notes.filter((n) => n.deletedAt)
      trash.forEach((n) => void dbDeleteNote(n.id))
      set((s) => ({ notes: s.notes.filter((n) => !n.deletedAt) }))
    },

    pinNote(id) {
      const note = get().notes.find((n) => n.id === id)
      if (!note) return
      const next = { ...note, pinned: !note.pinned }
      set((s) => ({ notes: s.notes.map((n) => (n.id === id ? next : n)) }))
      persist(next)
    },

    toggleArchive(id) {
      const note = get().notes.find((n) => n.id === id)
      if (!note) return
      const next = { ...note, archived: !note.archived }
      set((s) => ({ notes: s.notes.map((n) => (n.id === id ? next : n)) }))
      persist(next)
    },

    duplicateNote(id) {
      const src = get().notes.find((n) => n.id === id)
      if (!src) return
      const now = Date.now()
      const copy: Note = {
        ...src,
        id: uid(),
        title: src.title ? `Copy of ${src.title}` : src.title,
        content: src.content,
        pinned: false,
        archived: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      }
      set((s) => ({ notes: [copy, ...s.notes], selectedNoteId: copy.id }))
      persist(copy)
    },

    moveToFolder(id, folderId) {
      const next = get().notes.map((n) => (n.id === id ? { ...n, folderId } : n))
      set({ notes: next })
      next.forEach((n) => { if (n.id === id) persist(n) })
    },

    addFolder(name) {
      const folder: Folder = { id: uid(), name }
      set((s) => ({ folders: [...s.folders, folder] }))
      void putFolder(folder)
    },

    renameFolder(id, name) {
      const next = get().folders.map((f) => (f.id === id ? { ...f, name } : f))
      set({ folders: next })
      persistFolders(next)
      next.forEach((f) => void putFolder(f))
    },

    deleteFolder(id) {
      void dbDeleteFolder(id)
      const orphaned = get().notes.filter((n) => n.folderId === id)
      orphaned.forEach((n) => void putNote({ ...n, folderId: null }))
      set((s) => ({
        folders: s.folders.filter((f) => f.id !== id),
        notes: s.notes.map((n) => (n.folderId === id ? { ...n, folderId: null } : n)),
        activeFolderId: s.activeFolderId === id ? null : s.activeFolderId,
      }))
    },

    selectedNote() {
      return get().notes.find((n) => n.id === get().selectedNoteId) ?? null
    },

    visibleNotes() {
      let list = [...get().notes]
      const v = get().view
      const q = get().searchQuery.trim().toLowerCase()
      const folder = get().activeFolderId
      const tag = get().activeTag

      if (v === 'trash') return list.filter((n) => n.deletedAt).sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
      list = list.filter((n) => !n.deletedAt)
      if (v === 'archived') list = list.filter((n) => n.archived)
      else list = list.filter((n) => (v === 'pinned' ? n.pinned : !n.archived))

      if (v === 'all' || v === 'folder') {
        if (folder) list = list.filter((n) => n.folderId === folder)
        if (tag) list = list.filter((n) => n.tags.includes(tag))
      }

      if (q) {
        list = list.filter((n) =>
          (n.title + '\n' + n.content + '\n' + n.tags.join(' ')).toLowerCase().includes(q)
        )
      }

      const pinnedFirst = (a: Note, b: Note) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt
      return list.sort(pinnedFirst)
    },

    visibleTags() {
      return [...get().tags].sort((a, b) => {
        const ca = get().notes.filter((n) => n.tags.includes(a) && !n.deletedAt && !n.archived).length
        const cb = get().notes.filter((n) => n.tags.includes(b) && !n.deletedAt && !n.archived).length
        return cb - ca
      })
    },

    setSelected: (id) => set({ selectedNoteId: id, mobilePane: id ? 'editor' : 'list' }),
    setView: (v) => set({ view: v, activeFolderId: null, activeTag: null }),
    setFolder: (id) => set({ activeFolderId: id, view: 'folder' }),
    setTag: (t) => set({ activeTag: t, view: 'all' }),
    setSearch: (q) => set({ searchQuery: q }),
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    openCommand: (v) => set({ commandOpen: v }),
    setMobilePane: (p) => set({ mobilePane: p }),
    setSaveStatus: (s) => set({ saveStatus: s }),

    toggleTheme() {
      const t = get().theme === 'light' ? 'dark' : 'light'
      applyTheme(t)
      void setMeta('theme', t)
      set({ theme: t })
    },

    pushToast(t) {
      const id = uid()
      set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
      setTimeout(() => get().dismissToast(id), t.type === 'undo' ? 6000 : 2800)
    },

    dismissToast(id) {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    },
  }

  // seed first run
  async function seed() {
    await putManyFolders(DEFAULT_FOLDERS)
    const welcome = { ...WELCOME_NOTE }
    await putManyNotes([welcome])
  }
})