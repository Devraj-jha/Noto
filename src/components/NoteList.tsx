import { useNotes } from '../store/useNotes'
import { NoteItem } from './NoteItem'
import { formatRelativeTime, snippetFromContent, titleFromContent } from '../lib/utils'
import { AnimatePresence, motion } from 'framer-motion'

export function NoteList() {
  const notes = useNotes((s) => s.visibleNotes())
  const selectedId = useNotes((s) => s.selectedNoteId)
  const setSelected = useNotes((s) => s.setSelected)
  const view = useNotes((s) => s.view)
  const searchQuery = useNotes((s) => s.searchQuery)

  if (notes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-[var(--muted)]">
          {searchQuery
            ? 'Nothing matches that — yet.'
            : view === 'trash'
              ? 'Trash is empty. Good.'
              : view === 'pinned'
                ? 'Nothing pinned. Press ✷ on a note you never want to lose.'
                : 'Nothing here yet.'}
        </p>
        {!searchQuery && <p className="mt-2 text-sm text-[var(--faint)]">⌘ N to write something</p>}
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-2 pb-6">
      <AnimatePresence initial={false}>
        {notes.map((n) => {
          const active = n.id === selectedId
          return (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.16 }}
            >
              <NoteItem
                title={n.title || titleFromContent(n.content)}
                snippet={snippetFromContent(n.content)}
                time={formatRelativeTime(n.updatedAt)}
                pinned={n.pinned}
                archived={n.archived}
                deleted={!!n.deletedAt}
                tags={n.tags}
                active={active}
                onClick={() => setSelected(n.id)}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}