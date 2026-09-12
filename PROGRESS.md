# Noto — Build Progress

## Phase 1: Project Foundation
- [ ] Initialize Vite + React + TypeScript project
- [ ] Install dependencies (Tailwind, Framer Motion, Zustand, idb, cmdk)
- [ ] Set up Tailwind config + design tokens (CSS variables for light/dark)
- [ ] Create global styles (typography, spacing, theme)
- [ ] Define TypeScript types (Note, Folder, Tag, etc.)

## Phase 2: Data Layer
- [ ] Build IndexedDB wrapper with idb
- [ ] Build Zustand store (notes, folders, tags, UI state)
- [ ] Wire autosave with debounce + pulse indicator

## Phase 3: Core Components
- [ ] Build Sidebar (folders, tags, nav)
- [ ] Build NoteList (note items, pin/archive indicators)
- [ ] Build Editor (contenteditable, live markdown rendering)
- [ ] Build EmptyState (the love letter, not the placeholder)
- [ ] Build SearchBar (real-time full-text search with highlighting)

## Phase 4: Power Features
- [ ] Build CommandPalette (cmdk, keyboard-navigable)
- [ ] Build Toast + Undo system (soft, lingering toasts)
- [ ] Wire pin, archive, trash with 30-day recovery

## Phase 5: Delight Layer
- [ ] Add Framer Motion animations (note create/delete, sidebar collapse)
- [ ] Breathing autosave pulse indicator
- [ ] Dark mode (warm off-black, not inverted)
- [ ] Light mode palette
- [ ] First-run welcome note (shows formatting tricks)

## Phase 6: Polish & Quality
- [ ] Responsive design (collapsible sidebar on mobile)
- [ ] Accessibility pass (keyboard nav, ARIA, focus states, WCAG AA)
- [ ] Performance pass (5000+ word notes, 500+ note search)
- [ ] prefers-reduced-motion respect
- [ ] Micro-copy pass (warm, dry, never corporate)

## Notes
_Pick up here when resuming._
