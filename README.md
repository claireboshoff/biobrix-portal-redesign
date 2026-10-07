# BioBrix OS — Operating System

> **This repo is the redesign** (started 7 Oct 2026). It began as a copy of the live portal at
> https://claireboshoff.github.io/biobrix-portal/ and changes only how it looks: the FreedomHub category
> rail on the left (same nav as our other client portals), a breadcrumb top bar, a tighter BioBrix-green
> design system, and charts drawn by `BB.chart` in plain SVG so they work offline. Data, sign-in, access
> rules and the Sage mirror are unchanged. Page rules: `CONVENTIONS.md`.
>
> Preview locally: `python3 -m http.server 8811`, then open `http://localhost:8811/index.html?seat=director`
> (localhost runs the demo gate; seats: director, advisor, operations, finance, warehouse, u_farmer).

A working demo of the **BioBrix operating system** — sales, operations and BioServices (RenewAg)
in one place, built by **FreedomHub** for BioBrix (Pty) Ltd, Tzaneen. "The Biological Way."

- **Live demo:** https://claireboshoff.github.io/biobrix-portal/
- **Public website (Mike's build):** https://claireboshoff.github.io/biobrix-website/
- **Sign-in:** each person has their own email + password (`bb-config.js` AUTH:'live'). Accounts live in the
  `fh-biobrix` Worker (`worker/`): HMAC sessions, 14-day expiry, lockout after 5 wrong tries, deactivation cuts a
  live session off. Seed/reset a seat: `worker/setup.sh` (passwords kept in memory-private). Demo mode
  (shared code + tap-a-seat) is `AUTH:'demo'` — never with real data.

## What it does (from the discovery call with Rudie)
- **Voice order capture** — a rep in front of a farmer speaks the order; it prepopulates and flows
  straight to Operations, killing the week-long lag. Works offline in the field.
- **Sales forecast** — every rep's pipeline by month, live, with a director roll-up.
- **Territory potential** — Rudie's "country potential" as a live map/table; funnel a new farmer to the nearest rep.
- **Operations board** — one screen the whole team watches: pipeline, stock across 3 depots, deliveries, blending.
- **Stock, depots, suppliers (13), deliveries** — the ops + logistics spine.
- **BioServices / RenewAg** — the four brackets: BioAnalyze Soil, BioAnalyze Leaf, BioWatch (monitoring), BioConsult
  (recommendations). Drill down: bracket → farms → farmer → block → soil report → consult/watch.
- **Product library** — data sheets at the push of a button, across all 13 suppliers.
- **Farm files** — one indexed place for every document (replaces the "million Google Drives").
- **Farmer portal** — the customer-facing view: their reports, RenewAg programme, orders and documents.

## Sage 200 Evolution (read-only mirror)
- `sync/sage_sync.py` runs on the FreedomHub VM (35.224.186.129 — the only address BioBrix's firewall admits) at
  06:00 / 12:00 / 17:00 SAST, reads Client · InvNum · _btblInvoiceLines · PostAR · StkItem over an encrypted
  connection, and POSTs one snapshot to the Worker. The portal only ever receives it behind a session (`GET /sage`),
  advisors scoped to their own customers server-side. Nothing is written to Sage.
- Failure: ≤3 retries, then one line to the 07:00 brief; three in a row = "upstream changed".

## How it works (demo data)
- 100% client-side, static HTML on GitHub Pages. **No signal required** — it is a PWA (installable) and all
  data lives on the device, so it opens and works offline; changes queue and sync when signal returns.
- Demo data is seeded on first load; "Reset demo data" on the home screen restores it.

## Production path
The demo's client-side data layer is a drop-in for the FreedomHub production stack used across our other
operating systems: an n8n data-proxy + voice worker (OpenAI Whisper) with HMAC-signed session tokens and
server-side role enforcement, backed by Airtable. The page-level API and role model are already identical,
so pages carry over unchanged.

## Security
- Login gate on every page; role-scoped views (Director / Crop Advisor / Operations / Warehouse).
- `noindex` throughout; nothing is exposed publicly.
