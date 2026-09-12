export interface Note {
  id: string
  title: string
  content: string
  folderId: string | null
  tags: string[]
  pinned: boolean
  archived: boolean
  deletedAt: number | null // timestamp when trashed, null = not trashed
  createdAt: number
  updatedAt: number
}

export interface Folder {
  id: string
  name: string
}

export type Tag = string

export type ViewFilter = 'all' | 'pinned' | 'archived' | 'trash' | 'folder'

export interface EditingState {
  selectedNoteId: string | null
  viewFilter: ViewFilter
  activeFolderId: string | null
  activeTag: Tag | null
  searchQuery: string
  sidebarOpen: boolean
  commandPaletteOpen: boolean
}