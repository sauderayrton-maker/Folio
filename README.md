# Folio

Two tools for getting ahead — a résumé builder and a budget planner — in
plain HTML files. No accounts, no build step, no backend, and since every
asset is bundled, **no request ever leaves your device**. Open `index.html`
and start.

## The tools

### Resume Studio (`app.html`)
- **Live preview** — see the finished document update as you type.
- **10 professional templates** — Classic, Modern, Minimal, Elegant, Bold,
  Slate, Sidebar, Timeline, Mono, and Onyx, all print-ready.
- **7 accent colors**, serif/sans toggle, Letter/A4, density control with a
  live **one-page fit meter**.
- Summary, experience, education, skills, certifications — reorder and edit
  everything inline, with undo on every delete.
- **Cover letter** that matches your résumé's theme and prints alongside it.
- **Export PDF** via the browser's print dialog (`Ctrl/Cmd + P`).

### Flow (`budget.html`)
- **Real take-home pay** — progressive federal brackets for Canada and the
  US, provincial/state estimates, CPP + EI (Canada) and FICA (US), or a
  manual flat rate. Estimates only, clearly labeled with the tax year.
- Income sources (hourly with 1.5× overtime, salary, freelance), housing
  (rent or a full mortgage calculator), expenses by frequency.
- **Savings goals** with months-to-target timelines, investment accounts
  with compound projections (1/5/10/30 years), wealth-trajectory charts.
- Cash-flow breakdown across monthly, biweekly, and yearly views.

Everything autosaves to your browser's local storage. Saved data is
versioned and migrates forward automatically.

## Keyboard shortcuts (Resume Studio)

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + S` | Save snapshot |
| `Ctrl/Cmd + P` | Export PDF |
| `Alt + 1` / `Alt + 2` | Switch between résumé / cover letter |
| `Alt + ← / →` | Previous / next editor tab |

## Run it

Open `index.html` in any modern browser — double-clicking the file works;
no server needed. `npm run serve` starts a local server if you prefer one.

## Project layout

| Path | Purpose |
| --- | --- |
| `index.html` | Landing page |
| `app.html` | Resume Studio (résumé + cover letter) |
| `budget.html` | Flow (budget planner) |
| `style.css` | Resume Studio styles + document theme engine |
| `css/base.css` | Shared design tokens + app chrome (topbar, toast) |
| `js/shell.js` | Shared helpers: escaping, toasts |
| `js/storage.js` | Guarded, versioned localStorage access |
| `js/tax-data.js` | Tax tables as data, stamped with their tax year |
| `fonts/`, `vendor/` | Self-hosted fonts and Chart.js (no CDNs) |
| `tests/` | Playwright smoke tests |
| `handoff.md` | Roadmap + locked product decisions |

## Development

The app ships as-is — no compilation. Dev tooling is test-only:

```sh
npm install          # dev dependencies (Playwright)
npx playwright install chromium
npm test             # smoke tests against file:// URLs
```

### Updating the tax year

Tax tables live in `js/tax-data.js`, stamped with `YEAR`. To update:
refresh every bracket/rate from CRA and IRS published figures, bump `YEAR`,
and note it in `CHANGELOG.md`. The UI displays the year automatically.

## License

MIT — see `LICENSE`.
