# Folio — Handoff & Roadmap (v2)

_Written 2026-07-02, expanded same day. v2 adds decisions 11–24, audit
findings §3.5, and Phases 5–6. Treat it as the source of truth until
superseded by a newer handoff._

> **Status 2026-07-03: Phase 1 is shipped** — see `CHANGELOG.md` for what
> landed. All 10 Playwright smoke tests pass, including a zero-external-
> requests check. §3 findings addressed by Phase 1 are now historical.
> Next up: the shared slots utility (#15), then Phase 2.

---

## 1. What Folio is today

Three static HTML files, one shared stylesheet, zero backend, zero build step,
zero dependencies except two CDN links (Google Fonts, Chart.js). Everything
persists to `localStorage`. No accounts, no servers, no tracking.

| File | Role | Size |
|---|---|---|
| `index.html` | Marketing/landing page, own embedded `<style>` | 1887 lines / 72K |
| `app.html` | **Resume Studio** — résumé + cover letter editor, uses `style.css` | 1772 lines / 80K |
| `budget.html` | **Flow** — budget/tax/savings/investment planner, own embedded `<style>` | 1518 lines / 112K |
| `style.css` | Shared editor + résumé-theme engine (used only by `app.html`) | 2016 lines / 44K |

Two products live under the "Folio" umbrella today: a résumé builder and a
budget planner. The landing page's own tagline calls this "Two tools. One
place." This roadmap grows that to four studios over time (§5).

**The architecture is a deliberate strength, not a gap to fix.** No build step
means anyone can open `index.html` and it works. No backend means there's
nothing to host, secure, or pay for, and the privacy pitch ("nothing leaves
your device") is trivially true rather than a policy promise. That constraint
is kept in every recommendation below.

---

## 2. Non-negotiables (preserve these)

1. **No backend, ever.** No accounts, no servers, no API calls that send user
   data anywhere. Any feature that requires a server is out of scope.
2. **No required build step.** Opening the HTML file directly (`file://`,
   double-click) must keep working with zero caveats. Tooling for *dev/test*
   is allowed as long as the shipped artifact is still plain files a browser
   can load with no compilation.
3. **Data never leaves the device** unless the user explicitly exports it.
   (Note: today this is technically violated by the font/Chart.js CDN
   requests — fixed by decision #11.)
4. **Fast and free.** No paywalls, no subscription gating.
5. **No analytics or telemetry, ever.** Not even "privacy-friendly" analytics.
   The absence of any outbound request is the product's proof of honesty.

---

## 3. Audit findings

### 3.1 Branding / copy inconsistencies
- The budget tool has two names in the UI at once: `<title>` and topbar logo
  say **"Budget Studio"**, but the left-pane brand mark and the landing page's
  marketing copy both say **"Flow"**. Same product, two names, actively
  confusing anyone poking at the source or reading the URL bar vs. the app.
- `README.md` documents `index.html`/`app.html`/`style.css` only —
  `budget.html` doesn't exist as far as the README is concerned. It's a whole
  second product with zero documentation.
- Landing page title tag says "Plan your life" while the H1 says "Plan the
  life you earn" — close enough to be sloppy rather than intentional.
- No favicon anywhere, no Open Graph / Twitter card meta tags, and the meta
  `description` on `index.html` only mentions the résumé builder — Flow is
  invisible to search/social previews despite being a co-equal product.

### 3.2 Structural / code-health debt
- **CSS is duplicated three times.** `index.html` and `budget.html` each embed
  their own `<style>` block that redeclares the same design tokens
  (`--bg`, `--accent`, `--text-3`, etc. — values match today, but nothing
  enforces that) plus near-identical component CSS (buttons, topbar, nav
  pill, toast, mobile-view-toggle). `app.html` is the only page using the
  shared `style.css`. Any visual tweak has to be hand-applied in up to three
  places and will silently drift.
- **No shared "app shell."** The topbar, nav pill, save-status indicator, and
  mobile view toggle are each hand-rolled per page with slightly different
  behavior (e.g. `app.html`'s save indicator shows "Saving…"/"Saved" text;
  `budget.html`'s is a silent dot-flash with no text state at all).
- **Global mutable state + string-templated `innerHTML`** is the whole
  architecture (`jobs`, `skillGroups`, `certs`, `eduList` in `app.html`;
  `incomes`, `expenses`, `accounts`, `investments` in `budget.html`). This is
  fine at the current size but doesn't scale past what's there today without
  becoming error-prone — there's already duplicate escaping logic (`x()` in
  `app.html`, `esc()` in `budget.html`) that does the same thing under two
  names.
- **No versioned schema for Flow's `localStorage` data.** Resume Studio's
  `collectData()` stamps `version: 2` and `applyData()` has a real
  backward-compat shim for the old single-education format — that pattern
  works and should be copied. Flow has no version field on any of its six
  `localStorage` keys, so a future schema change has no migration path.
- **No tests, no CI, no linting, no formatter.** `.claude/settings.local.json`
  shows evidence of ad hoc Playwright screenshot scripts written and deleted
  within past sessions (`test_hero.js`, `test_mobile.js`, `test_xss.js`) —
  useful verification work that leaves no trace for next time. Worth
  formalizing into a real `/tests` folder that persists.
- **No `package.json`, `.gitignore`, or `LICENSE`.** Not urgent, but a stray
  `node_modules/` or `.DS_Store` from ad hoc tooling work has no gitignore to
  catch it, and there's no stated license for a repo that's presumably meant
  to be shared or open-sourced eventually.

### 3.3 Accessibility / robustness
- Icons consistently use `aria-hidden="true"` and inputs consistently use
  real `<label>` elements — better baseline than most vanilla-JS projects.
  No skip-link, no visible focus-state audit done, no keyboard-nav pass on
  custom controls (theme grid, swatches, tab scrollbar drag-handle).
- `budget.html` keyboard shortcuts don't exist at all (`app.html` has
  Ctrl+S / Ctrl+P / Alt+1/2 / Alt+←/→); Flow has no equivalent despite being
  just as tab-heavy.
- Undo-via-toast is a nice pattern already built in `app.html` (remove a job/
  skill/cert/education entry → toast with "Undo") but isn't used anywhere in
  `budget.html` — removing an income source, expense, account, or investment
  is immediate and permanent with no confirm and no undo.
- `loadSnapshot()` / `restore()` both swallow JSON parse errors silently
  (`catch (e) {}` / `catch(_) {}`). If a user's saved data is ever corrupted,
  they get a silently blank app with no explanation, not even a toast.

### 3.4 Flow's tax-accuracy gap (worth being honest about)
The federal tax brackets for both CA and US are real progressive brackets.
Provincial/state tax is a **flat rate approximation** (`CA_PROV`/`US_STATES`
are just `[name, flatRate]` pairs), not real bracketed provincial/state tax.
More significantly: US FICA is approximated reasonably (SS + Medicare with
the SS cap), but **Canada has no CPP or EI deduction modeled at all**, only
income tax. For a tool whose whole pitch is "see your real take-home," that's
a real accuracy gap, not a nice-to-have. There's also no in-UI disclaimer
that these are estimates, and no indication of *which tax year* the brackets
belong to (they're 2024 figures hardcoded in 2026).

### 3.5 New findings in the v2 pass
- **The privacy claim is technically false today.** Every page loads Google
  Fonts (leaking visitor IPs to Google), and `budget.html` loads Chart.js
  from jsDelivr. "Nothing leaves your device" should mean *zero outbound
  requests* — both dependencies are trivially vendorable (decision #11).
- **The star-field canvas in `budget.html` runs a `requestAnimationFrame`
  loop forever** — it doesn't pause when the tab is hidden, and nothing in
  any page respects `prefers-reduced-motion`. Battery drain plus an
  accessibility miss (decision #13).
- **Sample data persists as if the user typed it.** Resume Studio ships
  prefilled with "Alex Morgan," and the first autosave writes that fiction to
  `localStorage` as the user's résumé. Good for discovery, bad that there's
  no "start blank" and no visual distinction between demo content and the
  user's own (decision #20).
- **No storage-quota awareness.** `localStorage` writes are unguarded — a
  quota error mid-`persist()` would throw and silently stop saving with the
  UI still claiming "Saved" (decision #21).
- **Chart.js has no local fallback** — offline or CDN-blocked, `budget.html`
  throws on load (`Chart` undefined) and the whole page is dead, not
  degraded. Subsumed by decision #11.

---

## 4. Decisions (locked in for this roadmap)

These are calls made now so future work doesn't relitigate them. Flag any of
these if you disagree — they're defaults, not dogma. 1–10 are from v1
(decision #2 amended); 11–24 are new in v2.

1. **Keep the multi-page static-HTML architecture.** No SPA framework, no
   React/Vue/Svelte. The no-build promise is a feature, not a limitation to
   engineer around.
2. **(Amended in v2 — supersedes the v1 wording.)** Split shared code into
   plain files loaded with **classic `<script src>` tags and multiple
   `<link rel="stylesheet">` tags — not ES modules, not a bundler.** Classic
   scripts have no CORS restriction on `file://`, so double-clicking the file
   keeps working with zero caveats and no local dev server requirement. The
   v1 open question about ES-module/CORS trade-offs is closed: we simply
   don't need modules. Target layout:
   - `css/base.css` — tokens + shared chrome (topbar, buttons, toast, nav
     pill, mobile toggle); each page keeps its page-specific CSS.
   - `js/shell.js` — toast, escape helper, save-status, topbar/keyboard glue.
   - `js/storage.js` — versioned persist/restore/migrate + slots utility
     (decision #15) + quota guard (decision #21).
   - `js/tax-data.js` — bracket tables as data (decision #12).
   Page logic stays inline per page; only genuinely shared code moves out.
3. **Standardize the budget product's name to "Flow" everywhere** — title
   tag, topbar logo, cross-links from Resume Studio, README. It's the more
   distinctive, ownable name and it's already what the marketing copy calls
   it. "Budget Studio" gets fully retired from user-facing text.
4. **Version Flow's `localStorage` schema** the same way Resume Studio does:
   consolidate the six loose keys into one versioned blob, write one
   `migrate()` on restore. Do this before adding any new Flow data model
   (debt payoff, scenarios, etc.) so those additions don't create more
   unversioned drift.
5. **Add a real disclaimer + tighten tax accuracy** in Flow: CPP/EI for
   Canadian users, a visible "estimates only, not tax advice" note near the
   tax pill. This is a trust issue, not a polish issue.
6. **Adopt the Resume Studio undo-toast pattern as the standard delete
   pattern app-wide.** Every destructive list-remove action (Flow's income/
   expense/account/investment removal included) gets the same "removed ✓
   [Undo]" treatment.
7. **New studio #3: a lightweight Job Application Tracker.** Detailed in §5
   Phase 3. It's the connective tissue between the two existing tools.
8. **Formalize a `/tests` folder with Playwright smoke tests** that persist
   across sessions (`smoke.spec.js` per page: loads with no console errors,
   key interactions render, print layer populates, localStorage round-trips).
   Minimal `package.json` scoped to dev dependencies only — changes nothing
   about how the app ships, only how it's verified.
9. **Add a `manifest.json` + minimal service worker** so all three pages are
   installable and usable offline. Depends on #11 (can't cache what you
   don't host).
10. **No AI/LLM features.** Any "smart" feature (action-verb suggestions,
    keyword match against a pasted job description) stays rule-based and
    fully local — no network calls, ever.
11. **Vendor every third-party asset.** Self-host the four font families as
    subsetted woff2 + local `@font-face`, and a pinned local copy of Chart.js
    (`vendor/chart.umd.min.js`). This makes the privacy claim literally true
    (§3.5), makes offline/PWA possible, and removes the only two external
    points of failure. After this, a fresh `grep -r "https://" *.html`
    matching a runtime dependency is a regression.
12. **Tax tables become versioned data, not code.** Move brackets/rates to
    `js/tax-data.js` keyed by tax year (`TAX_YEARS["2026"] = {...}`), show
    the active tax year in the UI next to the disclaimer, and document the
    annual update ritual in the README. Stale-year data displayed honestly
    beats fresh-looking data of unknown vintage.
13. **Motion and battery etiquette.** Respect `prefers-reduced-motion`
    everywhere (star field, shockwaves, reveal animations, chart animations),
    and pause all `requestAnimationFrame` loops when `document.hidden`.
14. **One "Folio backup" envelope.** A single export/import covering every
    studio: `{ version, exportedAt, resume, flow, tracker, ... }`. Per-studio
    export stays for people who only want one tool's data. Import accepts
    either shape and routes accordingly. This is also the answer to "how do I
    move devices" and the foundation for decision #23.
15. **One shared "named slots" utility, built once** (closes v1 open
    question #2). Résumé profiles, budget scenarios, and any future
    multi-document need all use the same mechanism: slots with
    `{ id, name, updatedAt, data }`, a switcher UI pattern, and a migration
    that turns today's singleton saves into slot #1. No bespoke per-studio
    profile systems.
16. **"Offer Compare" ships as a Flow feature.** Two compensation packages in,
    real take-home delta out — reusing the existing tax engine, plus an
    optional cost-of-living line (rent delta) for relocation offers. Highest
    leverage-to-effort ratio of anything in this document: the hard part
    (tax math) already exists.
17. **Studio #4 is Interview Prep, sequenced after the tracker.** A STAR
    story bank (each story linkable to a résumé bullet), a common-questions
    checklist with the user's drafted answers, and a printable one-page prep
    sheet per application (pulls company/role from the tracker). Locked as
    direction; design details deferred to its phase.
18. **Chart.js is the only charting library, permanently.** Any new
    visualization must be expressible in Chart.js or plain DOM/CSS (the
    cash-flow bar in Flow's hero is already DOM/CSS — that pattern scales).
    No D3, no second chart lib.
19. **English-only UI for now.** No i18n framework. The one concession:
    currency *formatting* becomes configurable (symbol + locale), since Flow
    is already used with CAD and USD and hardcodes `$`/`en-US`.
20. **Demo content is labeled and disposable.** Resume Studio keeps its
    sample prefill (it aids discovery) but gains a "Start blank" action and a
    subtle "example content" indicator until first user edit. Flow gains a
    one-click "Load example budget" on its empty state, clearly marked, with
    "Clear example" to leave. Demo data never masquerades as user data.
21. **Persistence failures are always loud.** Wrap every `localStorage`
    write; on quota or any error, show a persistent warning state in the
    save indicator ("Not saving — storage full") instead of a false "Saved".
    Check `navigator.storage.estimate()` where available and warn early.
22. **Opt-in passphrase encryption (Phase 6, design-doc first).** WebCrypto
    AES-GCM with a PBKDF2-derived key over the persisted blobs, strictly
    opt-in, with an unmissable "lost passphrase = lost data, there is no
    recovery" warning. For people doing salary/debt planning on a shared
    computer. Not started until a short design doc covers key handling and
    the failure modes.
23. **File-handle auto-backup is the sanctioned "sync."** Where the File
    System Access API exists, let the user pick a backup file once (e.g. in
    their own Dropbox/Drive/Syncthing folder) and auto-write the Folio
    backup envelope on change. Progressive enhancement — falls back to
    manual export everywhere else. No Folio server is ever the answer to
    sync.
24. **MIT license, added in Phase 1** — unless you object when you see the
    commit. Copyright-holder name needs your input (§6).

---

## 5. Feature roadmap

Phased by dependency and effort, not strict priority — Phases 1 and 2 can
interleave. Phases 5–6 are direction, not commitment: revisit this doc when
you get there.

### Phase 1 — Consistency & trust (do first, low risk, high leverage)
- Fix naming (Flow, #3), README covering both products, favicon, OG/Twitter
  meta tags, aligned meta descriptions and taglines.
- Extract `css/base.css` + `js/shell.js` + `js/storage.js` via classic
  scripts (#2); each page keeps only page-specific code.
- Vendor fonts + Chart.js, delete the CDN links (#11).
- Version + consolidate Flow's storage schema (#4).
- Tax fixes: CPP/EI for Canada, tax-year label, estimates disclaimer,
  brackets moved to `js/tax-data.js` (#5, #12).
- Undo-toast parity for all Flow list removals (#6).
- Loud persistence: quota guard, error states in the save indicator, and a
  user-facing toast when restore fails instead of `catch(e){}` (#21).
- `prefers-reduced-motion` + hidden-tab pause for the star field and reveal
  animations (#13).
- `/tests` + Playwright smoke suite, `package.json` (dev-only),
  `.gitignore`, `LICENSE` (MIT, #24), `CHANGELOG.md` started.

### Phase 2 — Depth on existing tools
Gate: build the shared slots utility (#15) first — both flagship features
below sit on it.

**Resume Studio**
- **Multiple résumé profiles** on the slots utility, with a topbar switcher
  and "duplicate profile" (the tailor-per-job workflow). Single
  highest-value gap in the product.
- **Snapshot history** — lightweight named "save a version" separate from
  autosave; pairs with profiles on the same storage layer.
- **Custom sections**: Projects, Volunteer, Languages, Awards, Publications
  as addable section types, plus show/hide and **reorder for whole sections**
  (entry-level reordering already exists; section-level doesn't).
- **ATS plain-text mode**: one view that is both "what a parser sees" preview
  and copy/download-as-.txt export — trivial given `buildResumeHTML()`
  exists; strip to text.
- Inline mini-markdown in bullets (`**bold**`, `_italic_` only), rendered in
  preview and print.
- Fine typography controls: font-size scale and margin presets alongside the
  existing density setting; smarter two-page handling (explicit "allow 2
  pages" mode so the fit meter praises a clean 2-page résumé instead of
  nagging).
- Rule-based bullet linting: flag "Responsible for…", passive voice, bullets
  with no number in them. Local string heuristics, no network (#10).
- Keyword match: paste a job description, see which of your skills appear in
  it and which of its recurring terms you're missing. Pure client-side.

**Flow**
- **Debt payoff planner** (avalanche/snowball) — same list/summary/chart
  pattern as expenses and investments; unlocks a true **net-worth rollup**
  (savings + investments − debts) as a hero number and trajectory line.
- **Budget scenarios** ("current" / "with raise" / "after move") on the slots
  utility, with a compare view showing deltas.
- **Offer Compare** (#16).
- Emergency-fund coverage meter ("3.2 months of expenses covered") — derived
  entirely from data Flow already has.
- 50/30/20 overlay on the allocation donut (needs/wants/savings tagging on
  expenses).
- Inflation toggle on all projections (real vs. nominal dollars) and a
  simple FIRE panel: FIRE number (25× annual expenses), progress, and
  coast-FIRE age via the existing `fvCalc()`.
- Rent-vs-buy comparison: mortgage math already exists — add the renting
  counterfactual (rent + investing the down payment/payment difference).
- Paycheck calendar: which months contain three biweekly paychecks.
- CSV export **and import** for expenses; currency formatting setting (#19).
- Keyboard-shortcut parity with Resume Studio; "Load example budget" empty
  state (#20).

### Phase 3 — Studio #3: Job Application Tracker (#7)
- Data: company, role, link, status (saved / applied / interviewing / offer /
  rejected / ghosted), dates per status change, contacts, notes, follow-up
  date.
- Views: list + kanban board (columns = status; plain DOM drag or
  click-to-move — no drag library).
- Surfaced on load: "2 follow-ups due" nudge. In-page only — no push
  notifications, ever (they'd need a permission model disproportionate to
  the payoff).
- Ties to the rest of Folio: each application can record **which résumé
  profile and cover letter were used** (reads slot names from Resume
  Studio's storage); an offer can deep-link into Flow's Offer Compare.
- Funnel stats: counts and conversion per stage, applications per week —
  Chart.js bars, nothing fancier (#18).
- CSV export. Included in the Folio backup envelope (#14) from day one,
  versioned from day one (#4's lesson).

### Phase 4 — Polish & platform
- PWA: manifest, icons, service worker, offline (#9 — unblocked by #11).
- **Light theme** with a toggle; tokens are already centralized after
  Phase 1's `base.css`, so this is a token-swap job, not a rewrite.
- Command palette (Ctrl/Cmd+K): jump between studios/tabs, run actions
  (export, print, switch profile). One shared implementation in `shell.js`.
- Keyboard-shortcuts overlay on `?`.
- Accessibility deep pass: skip links, focus-visible audit, roving tabindex
  on the theme grid/swatches, keyboard alternative for the tab-scrollbar
  drag handle, `aria-live` on toasts and the save indicator.
- Print stylesheet for Flow: a clean one-page "financial snapshot" report
  (numbers + tables, no dark theme, no canvas).
- Micro-delight, sparingly: a one-time celebration when a savings goal hits
  100% (respects reduced-motion).

### Phase 5 — Power & analysis (direction, revisit before starting)
- Diff views on the slots layer: compare two résumé profiles/snapshots
  side-by-side; compare two budget scenarios with per-line deltas.
- CV/academic mode for Resume Studio (multi-page by design, publications
  emphasis) — cheap once custom sections + 2-page mode exist.
- "Year in review": a generated local summary (saved toward goals, net-worth
  change, applications sent) rendered as a shareable-by-screenshot card.
  Computed entirely from local data.
- Interview Prep studio (#17), pulling from tracker + résumé data.
- Annual printable report for Flow building on Phase 4's print stylesheet.

### Phase 6 — Moonshots (each needs a short design doc first)
- Opt-in passphrase encryption of stored data (#22).
- File-handle auto-backup via File System Access API (#23).
- **Portfolio page generator**: export a standalone, self-contained
  `yourname.html` personal site generated from résumé data — a static file
  the user can host anywhere or attach anywhere. Perfectly on-brand: Folio's
  output is, like Folio itself, a single HTML file with no dependencies.

---

## 6. Open questions for you

Deliberately short now — v1's questions #1 (modules/CORS) and #2 (shared
slots) are closed by decisions #2 and #15, and #3 (tracker) you've
effectively greenlit by asking for the expanded plan.

1. **License attribution**: MIT is locked (#24) unless you object — what
   name goes on the copyright line?
2. **Photo support on résumés**: expected in some markets (EU/Asia),
   discouraged by North American ATS advice. Current templates are
   photo-free. In or out? (My lean: out, until someone asks.)
3. **Encryption opt-in (#22)**: comfortable shipping a feature where a
   forgotten passphrase permanently loses data, given there's no recovery
   without accounts? If that trade-off feels wrong, we drop it rather than
   soften it.
4. **Anything here you'd cut?** The roadmap is intentionally maximal —
   cutting a phase-5/6 item now costs nothing; cutting it after it ships
   costs users.

---

## 7. Suggested execution order

1. **Phase 1 in one focused session** — it's self-contained, low-risk, and
   every later phase gets cheaper after it (shared CSS/JS, vendored assets,
   versioned storage, tests to lean on).
2. **Slots utility (#15) as the bridge into Phase 2**, then résumé profiles
   and budget scenarios in either order — they're the same pattern twice.
3. Remaining Phase 2 items interleaved by appetite; Offer Compare (#16) is
   the best effort-to-wow ratio if you want a quick visible win.
4. Phase 3 (tracker) as its own arc — new page, new schema, worth fresh
   focus.
5. Re-read this doc before Phases 4–6 and write a v3 handoff reflecting
   what actually shipped and what §6 answers came back.
