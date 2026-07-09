# Changelog

## Phase 2c — Debt payoff planner + net worth (2026-07-03)

Implements the debt payoff + net-worth items from Phase 2 of `handoff.md`.

- **New "Debt" tab in Flow**: track debts (balance, APR, minimum payment),
  pick avalanche or snowball, and set an extra monthly amount.
- **Payoff plan card** on the dashboard: month-by-month simulation with
  rolling payments (paid-off minimums attack the next debt), total interest,
  debt-free date, per-debt payoff timing, and a trajectory chart comparing
  the active strategy against the alternative — including exactly how much
  more the other strategy would cost.
- **Net worth today** (savings + investment balances − debt balances) shown
  on the payoff card, colored by sign.
- Debt payments are now part of the real monthly picture: committed amount,
  cash-flow bar, summary columns (new "Debt payments" row), allocation
  donut, and the by-item chart all include them.
- A visible warning when payments don't cover interest (balances would
  never reach zero).
- Deleting a debt gets the same undo toast as every other list.

## Phase 2b — Offer Compare (2026-07-03)

Implements decision #16 of `handoff.md`.

- **New "Compare" tab in Flow**: enter two compensation packages — each with
  its own country/province/state (or a manual flat rate), salary, and
  optional local rent — and get the real monthly/yearly take-home difference
  through the same tax engine as the dashboard (CPP/EI, FICA, provincial and
  state rates included).
- The verdict line accounts for rent when either offer has one, so
  relocation offers compare honestly ("$8k more gross" can lose to lower
  rent + no state tax, and Flow shows it).
- Offers persist inside the active scenario, so "current vs. Austin offer"
  can live alongside "current vs. promotion" in separate scenarios.
- Shared `fillRegionSelect()` helper now drives both the dashboard tax
  region picker and the per-offer pickers.

## Phase 2a — Named slots: résumé profiles & budget scenarios (2026-07-03)

Implements decision #15 of `handoff.md` and the two flagship features on it.

- **Shared slots utility** (`Folio.slots` in `js/storage.js`): one mechanism
  for every "multiple documents" need — envelope
  `{ slotsVersion, activeId, slots: [{ id, name, updatedAt, data }] }` under
  the studio's existing localStorage key. Legacy singleton saves migrate to
  slot #1 automatically on first load.
- **Shared switcher UI** (`Folio.slotSwitcher` in `js/shell.js` + styles in
  `css/base.css`): a topbar select + ⋯ menu with New / Duplicate / Rename /
  Delete. Deleting the last slot is refused; the current slot is always
  saved before any switch.
- **Resume Studio: multiple résumé profiles.** Tailor one résumé per role;
  new profiles start blank (not sample content). "Reset everything" now
  clearly warns it deletes all profiles.
- **Flow: budget scenarios.** "Current" vs "with raise" vs "after move" —
  each scenario is a full independent budget; switching re-applies every
  input and chart. Pre-slots `flow_save` blobs and the older six-key format
  both migrate forward untouched.
- Tests: 13 Playwright smoke tests (was 10), covering slot creation,
  switching, and all three migration paths.

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
