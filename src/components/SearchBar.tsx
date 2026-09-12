import { useRef } from 'react'
import { useNotes } from '../store/useNotes'

export function SearchBar() {
  const searchQuery = useNotes((s) => s.searchQuery)
  const setSearch = useNotes((s) => s.setSearch)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="relative flex items-center px-3 py-2">
      <span className="pointer-events-none absolute left-5 text-[var(--faint)]">⌕</span>
      <input
        ref={inputRef}
        value={searchQuery}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search notes…"
        aria-label="Search notes"
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none focus:border-[var(--border-strong)]"
      />
      {searchQuery && (
        <button
          onClick={() => setSearch('')}
          aria-label="Clear search"
          className="absolute right-5 text-[var(--faint)] hover:text-[var(--text)]"
        >✕</button>
      )}
    </div>
  )
}