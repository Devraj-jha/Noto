import { useNotes } from '../store/useNotes'
import { AnimatePresence, motion } from 'framer-motion'

export function ToastHost() {
  const toasts = useNotes((s) => s.toasts)
  const dismiss = useNotes((s) => s.dismissToast)

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-40 flex w-[min(380px,88vw)] flex-col gap-2"
      role="region" aria-label="Notifications"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.16)]"
          >
            <span className={
              t.type === 'undo' ? 'text-[var(--accent)]'
                : t.type === 'success' ? 'text-[var(--accent)]'
                  : 'text-[var(--muted)]'
            }>
              {t.type === 'undo' ? '↩' : t.type === 'success' ? '✓' : '·'}
            </span>
            <div className="flex-1 text-sm text-[var(--text)]">
              {t.message}
              {t.sub && <p className="text-xs text-[var(--faint)]">{t.sub}</p>}
            </div>
            {t.action && (
              <button
                type="button"
                onClick={() => { t.action?.run(); dismiss(t.id) }}
                className="shrink-0 rounded-lg bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
              >
                {t.action.label}
              </button>
            )}
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-[var(--faint)] hover:text-[var(--text)]">✕</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}