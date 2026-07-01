# Resume Studio

A fast, beautiful, single-file résumé + cover-letter builder. No accounts, no
build step, no backend — open `index.html` and start typing. Everything you
enter is saved automatically in your browser.

## Features

- **Live preview** — see the finished document update as you type.
- **10 professional templates** — Classic, Modern, Minimal, Elegant, Bold,
  Slate, Sidebar, Timeline, Mono, and Onyx, all print-ready.
- **7 accent colors** and a **serif / sans** typeface toggle.
- **Professional summary, experience, education, skills, certifications** —
  reorder and edit everything inline.
- **Cover letter** that matches your résumé's theme.
- **Autosave** to the browser, plus **Export / Import** your data as a JSON
  file for backups or moving between devices.
- **Export PDF** straight from the browser's print dialog (`Ctrl/Cmd + P`).

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + S` | Save snapshot |
| `Ctrl/Cmd + P` | Export PDF |
| `Alt + 1` / `Alt + 2` | Switch between résumé / cover letter |
| `Alt + ← / →` | Previous / next editor tab |

## Run it

Open `index.html` in any modern browser — that's the landing page. Click
**Build my résumé** to enter the editor (`app.html`). That's it.

## Project layout

| File | Purpose |
| --- | --- |
| `index.html` | Landing / launch page (self-contained styles) |
| `app.html` | The résumé + cover-letter editor |
| `style.css` | Editor styles + the document theme engine |
