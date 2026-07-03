# Changelog

## Phase 1 — Consistency & trust (2026-07-03)

Implements Phase 1 of `handoff.md`.

- **"Budget Studio" is now "Flow" everywhere** — title, topbar, cross-links.
- **All third-party assets vendored** (`fonts/`, `vendor/chart.umd.min.js`).
  No request ever leaves the device; the pages now work fully offline.
- **Shared code extracted** without breaking double-click-to-open:
  `css/base.css` (tokens, topbar/nav pill, toast, save status),
  `js/shell.js` (escape + toast), `js/storage.js` (guarded localStorage),
  `js/tax-data.js` (tax tables as year-stamped data).
- **Canadian take-home now includes CPP, CPP2, and EI**; the tax pill shows
  a payroll row for both countries, plus a "2024 tax data · estimates only —
  not tax advice" label.
- **Flow's saved data is now one versioned blob** (`flow_save`, schema v1)
  with automatic migration from the old six-key and wage/hours formats.
- **Undo everywhere**: removing an income source, expense, savings goal, or
  investment in Flow now offers Undo, matching Resume Studio.
- **Loud persistence**: storage failures turn the save indicator red and
  toast instead of failing silently; corrupted saves toast on restore.
- **Motion etiquette**: `prefers-reduced-motion` respected on all pages
  (star field renders one static frame, charts don't animate, reveals are
  instant); the star-field animation pauses while the tab is hidden.
- Manual tax rate is now persisted (previously lost on reload).
- Favicon + Open Graph/Twitter meta; landing description covers both tools.
- Repo scaffolding: LICENSE (MIT), `.gitignore`, `package.json` (dev-only),
  Playwright smoke tests in `tests/`.

## v1 (2026-07-01)

- Initial release: Resume Studio (résumé + cover letter, 10 templates) and
  the budget planner, landing page, autosave, JSON export/import.
