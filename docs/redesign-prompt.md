# COSMQ — Redesign Prompt: Mobile Table Visualization & Visual Query Builder

> Paste this into Claude Code or Cursor with the COSMQ repo open. It is written for an AI coding agent.

## Mission

Redesign the **core** of COSMQ — the query screen at `apps/mobile/app/query/[connectionId].tsx` — so that:

1. **Results are mobile-first.** Default to a card-per-row layout that follows the patterns in [Designing user-friendly data tables for mobile devices](https://medium.com/design-bootcamp/designing-user-friendly-data-tables-for-mobile-devices-c470c82403ad). Provide a per-query view switcher: **Cards · Table · JSON**. Eliminate the current "every result requires horizontal scroll" experience as the default.
2. **Queries can be built visually.** Add a **Builder** mode alongside the existing text editor, supporting both SQL (Postgres / MySQL / MariaDB / CockroachDB / SQLite) and MongoDB. No drag-and-drop — taps and bottom sheets only. Live preview of the generated query.

**Visual reference for the card layout** (from the user's attached mockup): each row becomes a card with a small title chip (e.g. `Unit 1003`), 1–3 icon-only quick actions in the top-right of the card (edit / delete / call-style icons), 2–3 key fields rendered as label/value rows below, and a `View More` link that expands the card inline to show the rest. Match that aesthetic.

**Read these before starting:**
- The Medium article above (fetch it). Internalize: "horizontal scroll is a last resort", "3–4 fields suffice", abbreviations + icons + concatenation, accordion expansion, customizable columns only when defaults are good.
- The current implementation in `apps/mobile/app/query/[connectionId].tsx` (large file — skim, don't read top-to-bottom).

---

## Repo orientation

You do **not** need to re-discover the codebase. Here is what matters:

| What | Where |
|---|---|
| Mobile app entry / stack | `apps/mobile/app/_layout.tsx` |
| Query screen (refactor target, ~1500 lines) | `apps/mobile/app/query/[connectionId].tsx` |
| SQL tokenizer (reuse for syntax highlighting) | same file, `tokenizeSql()` ~ lines 100–163 |
| Column-width auto-sizing helper | same file, `getColumnWidths()` ~ lines 294–303 |
| Current results grid (replace) | same file, ~ lines 1100–1220 |
| Current text editor (keep) | same file, ~ lines 470–572 |
| `QueryResult` / `ColumnInfo` types | `apps/mobile/lib/types.ts` |
| Connection store + `executeQuery` | `apps/mobile/stores/connection.ts` |
| Protocol adapters (introspection only — do not modify behavior) | `apps/mobile/lib/protocols/{postgres,mysql,mongodb,sqlite}/connection.ts` |
| UI primitives (use these, don't reinvent) | `apps/mobile/components/ui/{Button,Card,Dialog,Input,Switch}.tsx` |
| Misc reusables | `apps/mobile/components/{swipeable-row,run-button,database-icon}.tsx` |
| Theme | Tamagui tokens — `$primary`, `$surface`, `$borderColor`, `$syntax.*`, plus dark/light variants |
| State | Zustand. Persist via AsyncStorage; secrets via Secure Store (already wired) |

---

## Part A — Results redesign

### Cards view (the new default)

- Render rows as a **virtualized FlatList** of Tamagui `Card` components. **No horizontal scroll on the list itself.**
- Each card:
  - **Title chip** = primary-key column value (or first non-null short-string column if no PK metadata is available).
  - **2–3 label/value rows** below the title, showing the highest-priority columns.
  - **Header actions** (top-right): copy-row icon, open-detail-sheet icon, plus database-appropriate actions where obvious (e.g. nothing destructive by default — destructive actions stay opt-in).
  - **`View More` accordion** at the bottom that expands inline to reveal all remaining columns. Persist the expanded state per-card while the result is mounted.
- **Column priority heuristic** (used to pick which columns become title + visible fields):
  1. Primary key column (use `ColumnInfo` metadata; for Mongo treat `_id` as PK).
  2. Non-null short-string columns (≤ 32 chars typical width).
  3. Numeric columns.
  4. Booleans.
  5. Long text / JSON columns (last priority — only inside `View More` or detail sheet).
- **Customize fields**: a "⋯" button on the results header opens a bottom sheet listing every column; user can pin (force-show) or hide columns. Persist per-`(connectionId, queryHash)` in Zustand → AsyncStorage.
- **Density / formatting** (apply in cards and detail sheet):
  - Dates → `MMM d` for current year, `MMM d, yy` otherwise.
  - Big numbers → `$1.5M` / `1.2K` style with a long-press to reveal exact.
  - Booleans → check / cross icon.
  - `null` → muted em-dash (`—`).
  - JSON / objects → render a small `{…}` chip; tap opens the detail sheet's JSON view for that cell.
- **Detail sheet**: tapping a card body opens a Tamagui `Sheet` showing every column as a label/value list with copy-each.

### Table view (kept for power users)

- Reuse the current nested-`ScrollView` grid as the toggle option, but improve it:
  - **Sticky first column** (PK) so the row context never gets lost during horizontal scroll.
  - Keep tap-cell-to-copy.
  - Long-press a column header to enter resize mode (drag handle on the right edge).
  - Show a "↕" affordance on column headers; tap to sort asc / desc / unsorted.

### JSON view

- Collapsible JSON tree of the full result. This is the most natural view for MongoDB and for SQL queries that return JSONB columns. Expand/collapse per node. Copy node as JSON.

### Common to all three views

- **Header bar above results**: row count · execution time · view switcher (segmented `Cards · Table · JSON`) · search-within-results input (client-side filter across visible columns) · sort menu.
- **Sort + search are client-side** on the already-fetched rows (do not re-execute the query).
- **Persist last-used view per connection** in the connection store.
- **Empty state** for `0 rows` with a friendly message; **non-SELECT result** state stays as today (checkmark + affected rows / "Query executed").

### File split

Refactor — do not pile this into `query/[connectionId].tsx`. Create:

```
apps/mobile/components/results/
  ResultsView.tsx          # owns the switcher + shared state (sort, search, customize)
  CardsView.tsx
  TableView.tsx
  JsonView.tsx
  DetailSheet.tsx
  ColumnCustomizeSheet.tsx
  format.ts                # date / number / null / json formatters
  columnPriority.ts        # heuristic ordering
```

The query screen imports `<ResultsView result={...} />`.

---

## Part B — Visual query builder

### Mode toggle

Add a segmented control at the top of the editor area: **Text · Builder**. Default to Text (today's behavior). Persist last-used mode per-connection.

### Builder UX

A vertical stack of **clause cards** (Tamagui `Card`, each tappable). Tapping a card opens a Tamagui `Sheet` with the relevant picker. **Never push to a new screen.**

**For SQL connections:**

```
[ FROM      ]   table picker (single)
[ SELECT    ]   column multi-select (default *)
[ WHERE     ]   list of condition rows + "Add condition"
[ ORDER BY  ]   column + asc/desc rows
[ LIMIT     ]   number stepper (default 100)
```

**For MongoDB connections:**

```
[ Collection ]  collection picker
[ Project    ]  field multi-select
[ Filter     ]  list of condition rows + "Add condition"
[ Sort       ]  field + asc/desc rows
[ Limit      ]  number stepper (default 100)
```

### Condition rows

`[column] [operator] [value]`. Operators are **type-aware**:

- Numeric: `= ≠ < ≤ > ≥ BETWEEN IS NULL`
- String / text: `= ≠ LIKE STARTS WITH ENDS WITH CONTAINS IS NULL`
- Boolean: `IS TRUE / IS FALSE / IS NULL`
- Date / timestamp: `= < > BETWEEN IS NULL` + a date picker for the value
- Mongo: same logical set, mapped to `$eq $ne $lt $lte $gt $gte $regex $exists`.

Compound conditions stay AND-only in v1. Add a `// add OR group` affordance only if it doesn't bloat the UI.

### Live preview

At the bottom of the builder, a **read-only, syntax-highlighted preview** of the generated query. Reuse `tokenizeSql()` from the query screen — extract it into `apps/mobile/lib/sql/tokenize.ts` so both the text editor and the builder preview share it.

A button **"Edit as text"** copies the generated query into the text editor and flips the mode to Text. This is **one-way**: text edits do not sync back into the builder. State this behavior visibly.

### Schema introspection

Reuse `executeQuery` to load schemas — do **not** modify protocol adapters' transport code. Add a thin layer at `apps/mobile/lib/builder/schema.ts`:

- Postgres / CockroachDB: `SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = current_schema()` + `SELECT kcu.table_name, kcu.column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ...` for primary keys.
- MySQL / MariaDB: same `information_schema` queries.
- SQLite: iterate `sqlite_master` then `pragma_table_info(<table>)` per table.
- MongoDB: `db.runCommand({ listCollections: 1 })`, then sample N=20 documents from each collection on demand to infer field names + types.

Cache the schema per `connectionId` in the connection store with a **manual refresh** button on the builder header. Show a small "schema loaded N tables" status line.

### File layout

```
apps/mobile/components/builder/
  BuilderView.tsx
  ClauseCard.tsx
  TablePickerSheet.tsx       # also used for "Collection" on Mongo
  ColumnPickerSheet.tsx      # also used for "Project" / "Order By" / "Sort"
  ConditionRow.tsx
  OperatorSheet.tsx
  ValueInput.tsx             # type-aware: text / number / bool / date
  Preview.tsx                # uses shared tokenize.ts
apps/mobile/lib/builder/
  schema.ts                  # introspection per dialect
  toSQL.ts                   # builder state -> parameterized SQL
  toMongo.ts                 # builder state -> Mongo command
  state.ts                   # builder state types + Zustand slice
apps/mobile/lib/sql/
  tokenize.ts                # extracted from query/[connectionId].tsx
```

The query screen imports `<BuilderView mode={mode} onRun={run} />` and `<Editor mode={mode} ... />` and toggles between them.

---

## Constraints

- **No new top-level dependencies** unless strictly necessary. Reuse Tamagui (`Sheet`, `Card`, `XStack`, `YStack`), Zustand, Expo Router, and the existing `tokenizeSql`. If a virtualization helper is needed, use `FlatList` (built into RN). If you genuinely need a bottom-sheet primitive better than Tamagui's `Sheet`, justify it in the PR description.
- **Don't break the existing text editor** — autocomplete, syntax highlighting, quick actions chip row, and starter templates must all still work.
- **Don't modify** `lib/protocols/*` transport / auth code. Introspection lives in `lib/builder/schema.ts` and goes through the public `executeQuery` API.
- **Generated SQL must be parameterized** wherever the dialect supports placeholders. Do not concatenate user-entered values into the SQL string. For Mongo, build typed query objects, not template-stringed JSON.
- **Dark mode parity**: every new component uses Tamagui tokens, no hardcoded hex.
- **Accessibility**: tap targets ≥ 44pt; every icon-only button gets `accessibilityLabel`; sheets respect screen-reader focus order.
- **Keep `query/[connectionId].tsx` under ~600 lines** after the refactor. The screen is a layout + wiring file, not a kitchen sink.

---

## Non-goals (do not do these)

- Joins in the builder (v1 is single-table / single-collection).
- Aggregations / `GROUP BY` / Mongo aggregation pipeline.
- Server-side pagination of results.
- Editing the existing connection / settings screens.
- New databases or new auth flows.
- A separate desktop / web build.

---

## Acceptance checklist

Before opening the PR, verify:

- [ ] `bun install && bun run --filter mobile typecheck` passes.
- [ ] `bun biome check apps/mobile` is clean.
- [ ] iOS simulator + Android emulator manual passes:
  - [ ] Run `SELECT * FROM <wide table>` against a Postgres connection. Results land in Cards view by default. `View More` expands. Switcher flips to Table (sticky PK column visible) and to JSON. Sort, search-within-results, and Customize fields all work.
  - [ ] Toggle the editor to Builder. Build the same query visually for a SQL connection and for a MongoDB connection. Live preview matches what the query produces when run.
  - [ ] "Edit as text" copies the generated query into the text editor and switches to Text mode.
  - [ ] Dark mode renders correctly across cards, table, JSON, builder sheets.
  - [ ] Existing text editor — syntax highlighting, autocomplete popup, quick-actions chips, starter templates — still works unchanged.
- [ ] No file in the new structure exceeds ~400 lines.
- [ ] PR description includes screenshots / a screen recording of: cards view, expanded card, detail sheet, builder for SQL, builder for Mongo, live preview, dark mode.

---

## Workflow

1. Develop on branch `claude/mobile-table-redesign-DKFTq` (already checked out).
2. Land changes as a series of focused commits (one per major area: extract tokenizer, results scaffold, cards view, table view, json view, builder scaffold, sql codegen, mongo codegen, schema introspection, polish).
3. Open a **draft** PR against `main` when the acceptance checklist passes.
