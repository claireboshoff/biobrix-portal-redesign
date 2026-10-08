# BioBrix OS — page conventions (redesign)

The shell (`bb-shell.js`) draws the side rail, top bar, breadcrumbs, scope band, sync state and the
phone bottom bar. A page only draws what goes inside `<main class="wrap">`. `index.html` is the
reference page: copy its rhythm.

## Don't change
- Data, access and behaviour. Every `BB.data` read/write, every `BB.auth.can/canPage` check, every
  sample/live (`sageLive`, `tenantLive`, `isFreedomHub`) branch, every event handler stays. This is
  a visual redesign; nothing a person can do today may disappear.
- `bb-shell.js`, `bb-data.js`, `guard.js`, `bb-config.js`, `sw.js` are shared. Don't edit them from a
  page. If a page needs something the shell lacks, add page-scoped CSS in a `<style>` in that page.
- Keep calling `BB.renderHeader({ active, back })` with the same arguments.
- Keep the `.page-head` and `main.wrap` elements: the shell hangs the sample-data note off them.

## Page rhythm
1. `.page-head`: `.eyebrow` (section), `h1`, one-line `p`. Primary actions go on the right:
   `<div class="page-head row between">…<div class="row">buttons</div></div>`.
2. KPI strip: `.grid.g4` (or `g3`/`g5`) of `.stat` (`.l` label, `.v` value, `.s` sub). Use `warn`/`bad`
   on the stat for attention. Add `<div class="spark">'+BB.chart.spark(values)+'</div>` when there is
   a real series behind the number.
3. The picture: a chart in a `.card` with a `.card-h` header (`h3` + `.sub`), often in a `.split`
   (2fr + 1fr) beside a breakdown (donut/hbar).
4. The work: tables or lists in `.card`s with a `.card-h` header (title, count badge, actions).

## Components
- Panel: `<div class="card"><div class="card-h"><div><h3>Title</h3><div class="sub">context</div></div>actions</div><div class="card-p">…</div></div>`.
  Tables go straight inside the card after `.card-h` (wrapped in `.scroll`), no `.card-p`.
- Tables: `table.bb`. Right-align numbers with `class="num"` on both `th` and `td`. Totals in `<tfoot>`.
  Long lists: `.scroll.tall` gives a sticky header. Inline bars in a cell: `.bar-cell` (`.trk > i` width %).
- Filters: `.toolbar` row of `.chip`/`.chip.on`, or `.seg` segmented control (`button.on`).
- Badges: `BB.statusBadge(status)` or `.badge.b-ok/b-warn/b-bad/b-blue/b-grey/b-lime`.
- Buttons: `.btn`, `.btn.ghost`, `.btn.sm`, `.btn.lime`. Icons in buttons: `BB.icon('name')`.
- Icons: `BB.icon(name)`. Names: home sales truck sprout wallet sparkles wrench users user search menu
  chevron logout mic package receipt chart target percent map board moving warehouse link tag leaf flask
  eye clipboard book folder farm monitor file alert check phone message calendar plus download refresh filter.
  **No emoji as icons** (🎙 📦 🌾 etc). Replace them with `BB.icon`, or drop them. Emoji inside data text is fine.

## Charts — `BB.chart` (SVG, offline, redraws on resize)
Mount into an empty `<div id="…">` *after* the HTML is in the page.
- Trend over time → `BB.chart.line(el, { labels, series:[{name, values, color, dash, area}], money, height, table:true })`
- Compare categories / months → `BB.chart.bar(el, { labels, series:[…], stacked, money, height, table:true })`
- Ranking (reps, products, customers) → `BB.chart.hbar(el, { rows:[{label, sub, value, color, href, parts:[{name,value,color}]}], money, legend })`
- Share of a whole (≤6 parts) → `BB.chart.donut(el, { rows:[{label, value, color}], money, centreLabel })`
- Tiny trend in a stat → `BB.chart.spark(values, { color })` returns an SVG string.
- `money:true` formats as Rand. `fmt`/`axisFmt` override. `table:true` adds a "Show as table" fallback.
- Palette (in order): `#22431a` / `#3f6b28` dark greens, `#68a53e` bright green, `#c77d17` amber,
  `#2f6f9e` blue, `#7d4f9a` plum, `#a3533f` clay. Rep colours come from `rep.colour`. Don't use lime
  `#b7d97a` for chart marks (too pale against white); it's an accent for dark grounds only.
- Only chart data the page already computes or can count from `BB.data`/the Sage snapshot. Never invent a series.
  If a chart would show fewer than 3 points, use stats instead.

## Space
- Desktop is wide (content up to 1480px beside a 252px rail). Use it: put related panels side by side
  (`.split`, `.g2`, `.g3`) instead of stacking full-width cards.
- Phones: everything collapses to one column on its own; check at 390px wide. Wide tables scroll inside
  `.scroll`, never the page.

## Voice
Keep the existing copy's plain, direct voice. Shorten where a sentence only restates the heading.
No exclamation marks, no "Welcome to…".

## Clicks open popups, not pages (Oct 2026)
Clicking a chart part, a figure or a row shows its detail **over the page** (`BB.popup`); the page it
used to jump to is a button inside the popup. The shell already gives every chart a default popup
(figures, share, change on the previous period, rank). Pages add the records behind the click:

- **Charts:** pass `detail: function(ctx){ return {...popup options} }` to `BB.chart.bar/line/hbar/donut`.
  `ctx` = `{kind:'column', index, label, values, total}` (bar/line) · `{kind:'row', index, row, value}` (hbar)
  · `{kind:'slice', index, row, value, total}` (donut). Return popup options to merge over the default
  (`sub`, `stats`, `table:{columns, rows:[{cells:[...], href}], num:[i]}`, `html`, `actions:[{label, href, primary}]`,
  `wide:true`, `note`). Return `false` to handle the click yourself. Keep the default `stats` unless you
  have better ones.
- **Figures (`a.stat.tap`):** they no longer navigate. Register the list behind each one:
  `BB.statDetail('overdue', function(tile){ return { sub, stats, table, actions:[{label:'Open the full list', href, primary:true}] }; })`
  and tag the tile `data-detail="overdue"`. Unregistered tiles get a simple popup with an "Open the full list" button.
- **Rows that took you to another page** (`tr.click` → `location.href = …`): show a popup preview of that
  record (key facts, a short table of its lines/orders/invoices) with **Open full record** as the primary
  action. Rows whose click already does something on the page (expand, select, fill a form, fly the map) stay.
- Popup table rows can link (`href`) to the record page; that's fine — it's the user choosing to go.
- Never invent numbers; the popup shows what the page already has.

## Table filters (bb-table.js — the 9five column filter)
Every `table.bb` gets a funnel per column automatically: filter by condition, by value (with counts),
sort; totals rows follow the filter; filters survive redraws. Consequences for pages:
- **Remove page-level controls that only filter one table's rows by a value that is a column in it**
  (status chips, region chips, a select that narrows the table) — the funnel does that now. Keep controls
  that change scope for the whole page or also drive the charts/KPIs (e.g. depot scope, My farms / All farms,
  period pickers, `?show=` URL presets), and anything the Ask bar or another page links to (`?show=overdue`).
- Don't give tables their own max-height / inner scroll; the page scrolls (`.scroll.tall` is now a no-op).
- Opt a table out with `data-nofilter="1"` only if it isn't a data list (e.g. a form laid out as a table).

## Record popups: the card pattern (Oct 2026)
The order popup on `orders.html` (`openOrder`) is the reference. A popup about **one record** (an
order, a farm, a delivery, an invoice, a sample, a programme, a stock line, a supplier, a job…) reads:

- **Title = the record's name or ref.** `eyebrow` = its kind (`Order · Voice`, `Farm`, `Invoice`). No
  `sub` line restating what's below.
- **`meta`: the identity fields, one per line, with an icon** — dates (`calendar`), depot (`warehouse`),
  farmer (`user`), farm (`farm`), rep (`initials` + `color` = rep.colour), phone (`phone`), region/town
  (`map`), supplier (`link`), product (`package`), block (`leaf`), crop (`sprout`). `tip` = the field's
  name (shown on hover). Use `href` for a field that links to its own record. Skip empty fields.
- **`stats`: at most four, concise** (short label, the value, a few words of `s`). They render as one
  tidy strip. If the page lets this person change the record's status, make the Status stat clickable:
  `onClick:function(el){ BB.pick(el, {title:'Move to', items:[{label, value, html:BB.statusBadge(s), on}], onPick}) }`
  and drop the old dropdown.
- **`layout:'split'`** when the record has content of its own (lines, readings, invoices): meta + stats
  on the left, content (`html` / `table`) on the right. Single-column (no layout) when there's little.
- **Warnings** as one `bbp-alert` line (`<div class="bbp-alert">`, `.warn` for amber) at the top of the
  content, not as big panels or repeated tags.
- **Actions in the footer** (`actions`): the record page ("Open full record"/"Farm record") and the one
  main action (primary). In-content action blocks shrink to a single `bbp-bar` row.
- **Tags** (quote stage, invoice, HOLD) appear once — where they're acted on, not in two places.

Popups that list **many** records (a chart column, a figure tile) keep their table, but follow the same
economy: ≤4 concise stats, no redundant `sub`, actions in the footer, rows that open the record's own
card popup where one exists on the page.
