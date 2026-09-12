import { chromium } from 'playwright-core'
import { mkdirSync } from 'fs'

mkdirSync('.shots', { recursive: true })

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(700)

// Welcome note should be rendered
await page.waitForSelector('text=Welcome to Noto', { timeout: 8000 })
await page.screenshot({ path: '.shots/1-welcome.png' })

// Light shell
await page.waitForTimeout(400)
await page.screenshot({ path: '.shots/2-app-shell.png' })

// Toggle dark mode via the sidebar button (aria-label)
await page.click('button[aria-label="Toggle theme"]')
await page.waitForTimeout(400)
await page.screenshot({ path: '.shots/3-dark.png' })
await page.click('button[aria-label="Toggle theme"]')

// Open command palette with Cmd+K
await page.keyboard.press('Meta+k')
await page.waitForTimeout(500)
await page.screenshot({ path: '.shots/4-palette.png' })
await page.keyboard.press('Escape')

// Create a new note via Cmd+N
await page.keyboard.press('Meta+n')
await page.waitForTimeout(300)

// Type in the editor (transparent-textarea trick: real caret edits work)
await page.keyboard.type('# Hello Noto\n\n**beautiful** bold and _italic_ now.')
await page.waitForTimeout(900) // let debounce autosave fire
await page.screenshot({ path: '.shots/5-typed.png' })

// Trash the note (top bar delete button) → expect Undo toast
await page.click('button[aria-label="New note"]')
await page.waitForTimeout(150)

console.log('\n--- CONSOLE ERRORS ---')
console.log(errors.length ? errors.join('\n') : '(none)')
console.log('--- done ---')

await browser.close()