# Noto ✍️

A quiet place for your thoughts. Noto is a note-taking app that gets out of the way — a live markdown editor, your notes stored locally on-device, nothing to sign in to, no noise.

## What it does

- **Live markdown editing** — headings, bold, italics, code, checklists, quotes, links, rendered as you type
- **Local, private, offline** — everything is stored in your browser's IndexedDB. No account, no sync, no tracking
- **Autosaves as you write** — with a soft pulse as it saves
- **Organize your way** — folders, tags, pinning, archiving, and a 30-day trash recovery window
- **Search** — full-text search across note titles and bodies; press `/` to jump to it
- **Command palette** — press `⌘K` (or `Ctrl K`) to run anything with your keyboard
- **Themed** — a warm light palette for day, a warm off-black for night, respecting your system preference and `prefers-reduced-motion`

## Getting started

```bash
npm install     # install dependencies
npm run dev     # start the dev server
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `⌘/Ctrl + K` | Open the command palette |
| `⌘/Ctrl + N` | New note |
| `⌘/Ctrl + \` | Toggle the sidebar |
| `/` | Jump to search |
| `Esc` | Close palette / leave search |

## Tech

React + TypeScript, Tailwind CSS, Framer Motion, Zustand, and `idb`. No backend — your words live in your browser.

## Status

Early and actively built. See `PROGRESS.md` for the build roadmap and what's left.