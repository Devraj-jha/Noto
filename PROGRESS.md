# Noto — Build Progress

## Phase 1: Project Foundation
- [x] Initialize Vite + React + TypeScript project
- [x] Install dependencies (Tailwind, Framer Motion, Zustand, idb, cmdk)
- [x] Set up Tailwind config + design tokens (CSS variables for light/dark)
- [x] Create global styles (typography, spacing, theme)
- [x] Define TypeScript types (Note, Folder, Tag, etc.)

## Phase 2: Data Layer
- [x] Build IndexedDB wrapper with idb
- [x] Build Zustand store (notes, folders, tags, UI state)
- [x] Wire autosave with debounce + pulse indicator

## Phase 3: Core Components
- [x] Build Sidebar (folders, tags, nav)
- [x] Build NoteList (note items, pin/archive indicators)
- [x] Build Editor (same-grid overlay, live markdown rendering)
- [x] Build EmptyState (the quiet palette, not the placeholder)
- [x] Build SearchBar (real-time full-text search)

## Phase 4: Power Features
- [x] Build CommandPalette (cmdk, keyboard-navigable)
- [x] Build Toast + Undo system (soft, lingering toasts)
- [x] Wire pin, archive, trash with 30-day recovery

## Phase 5: Delight Layer
- [x] Add Framer Motion animations (note create/delete, sidebar collapse)
- [x] Breathing autosave pulse indicator
- [x] Dark mode (warm off-black, not inverted)
- [x] Light mode palette
- [x] First-run welcome note (shows formatting tricks)

## Phase 6: Polish & Quality
- [x] Responsive design — master/detail on small screens, sidebar overlays as a drawer
- [x] Accessibility pass — real heading structure, aria-current/pressed/expanded, explicit button types, `/` + `Esc` keyboard nav, Enter drops into the note body
- [ ] Performance pass (5000+ word notes, 500+ note search)
- [x] prefers-reduced-motion respect (MotionConfig reducedMotion="user" + static pulse)
- [x] Micro-copy pass (warm, dry, never corporate) — ongoing voice tightening

## Phase 6 follow-ons
- [x] Per-note restore + empty-trash controls in the Trash view
- [x] Document title reflects the open note
- [x] Shared IconButton component (one button, native tooltip)
- [x] Folder rename/delete from the sidebar
- [x] Live word count + reading time under the editor
- [x] Palette: Search-notes jump, Copy-as-markdown, pin/archive/delete on selected
- [x] Empty note list offers a New note button
- [ ] Tag authoring (add tags from the editor)
- [ ] Performance pass (5000+ word notes, 500+ note search)

## Notes
_Pick up here when resuming — tag authoring and the perf pass are the next slice._