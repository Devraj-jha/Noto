import type { Note, Folder } from '../types/note'
import { uid } from '../lib/utils'

export const DEFAULT_FOLDERS: Folder[] = [
  { id: 'folder-inbox', name: 'Inbox' },
  { id: 'folder-ideas', name: 'Ideas' },
  { id: 'folder-journal', name: 'Journal' },
]

export const WELCOME_NOTE: Note = {
  id: 'welcome-note',
  title: 'Welcome to Noto',
  content: `# Welcome to Noto ✍️

This is your space. Things written here are safe — they stay on your device, autosaved as you type, and waiting when you come back. No account, no sync, no noise.

## Try a few things

**Make this bold**, or _make this italic_, or \`code\` it up.

> A quiet quote, for a quiet thought.

- [ ] A thing you want to do
- [x] A thing you did
- [ ] Maybe another thing

1. First, breathe.
2. Then write one sentence.

\`\`\`
// even a code block, if that's your thing
const thought = "it's yours"
\`\`\`

And a place to put things that don't fit anywhere else: [a link out](https://example.com).

---

There's no tour here, because there's nothing to learn. Type \`# a heading\`, hit **Ctrl/⌘ K** whenever, and start with **Ctrl/⌘ N**. The rest will feel obvious.

You can pin this note, put it in a folder, or tag it. Or just leave it here. It'll be fine.
`,
  folderId: 'folder-inbox',
  tags: ['welcome', 'guide'],
  pinned: true,
  archived: false,
  deletedAt: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

export function makeWelcomeId(): string {
  return uid()
}