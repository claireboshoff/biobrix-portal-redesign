/* ============================================================
   fh-biobrix-ask — the brain behind the portal's Ask bar.

   The browser runs the conversation loop and executes every tool itself (reading the page,
   querying the seat's own data, navigating, switching filters, drawing tables and charts).
   This Worker only: checks the session, holds the Anthropic key, owns the system prompt and
   the tool definitions, and makes one Messages API call per turn.

   Why the tools live in the browser: the data a seat may see is already scoped there (an
   advisor's store holds only their farmers; the Sage snapshot is served scoped by fh-biobrix).
   Claude only ever sees what a tool hands it, so it can't see past the seat.

   POST /ask   { messages }   Authorization: Bearer <fh-biobrix session token>
     → { content, stop_reason, stop_details, usage }
   GET  /health
   ============================================================ */
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5-5";
const MAX_BODY = 600_000;          // bytes — a long conversation with tool results, not a data dump
const MAX_MESSAGES = 80;
const DAILY_TURNS_PER_SEAT = 400;  // per Worker isolate; a ceiling, not a billing control

// ---- System prompt: stable, so it caches with the tools ---------------------------------------
const SYSTEM = `You are BioBrix Intelligence, the assistant built into BioBrix OS — the operating system of BioBrix (Pty) Ltd, a regenerative / biological agriculture company in Tzaneen, Limpopo, South Africa ("The Biological Way"). BioBrix sells biological soil and foliar products to farmers through crop advisors (reps), runs depots (George, Ballito, Tzaneen), and offers BioServices (RenewAg): BioAnalyze Soil and Leaf, BioWatch monitoring and BioConsult programmes. Finance runs on Sage 200 Evolution, mirrored read-only into the portal.

You sit in a bar at the bottom of every page. The person talking to you is a signed-in member of the BioBrix team (their name, role and current page arrive with each message). Help them understand their business, find things, and work the portal.

How to work:
- Answer from data, never from memory. Use the tools to look things up; never invent a figure, name or date. If the data doesn't hold the answer, say so plainly.
- Questions about "this", "here" or what is on screen: call get_page first.
- To narrow or sort a table on the page, use filter_table (every table has column filters). To switch a view, tab or scope control on the page: call get_page, then interact with the matching control's ref. To go somewhere else: navigate (you continue on the new page; call get_page there before interacting).
- Clicking anything that changes data or sends something (a "Done", "Draft reminder", "Invoice", "Check & send" button) needs the person's go-ahead: the portal asks them to confirm when you call interact on it, and tells you what they chose. Never try to get around that.
- Your reply appears as a single answer card, not a chat thread. Open the final answer with a short title on its own line as a markdown heading (e.g. "# Overdue invoices"), then the answer. Links you include become buttons on the card, the first one most prominent.
- Show, don't recite: when an answer is a list of more than a few rows, or a comparison, or a trend, call show with a table or chart, then write a short takeaway. Keep prose brief: lead with the answer, 1–4 short sentences or a tight list. No preamble, no closing offers.
- Money is South African Rand: write R418 000 (space thousands, no cents unless they matter). Dates like 14 Sept 2026. South African English.
- Data scope: each seat only sees its own slice (an advisor sees their own farmers; a depot sees its own stock). If something is missing, it may be outside this person's access — say that rather than guessing.
- Some sections still run on demonstration data until they are connected to BioBrix's own systems; tool results flag this with "sample": true. Mention it when it matters to the answer. Figures from the accounting system are flagged "source": "sage".
- Links to portal pages in your text use markdown: [Finance](finance.html?show=overdue).
- You can't change records directly, email anyone, or see anything outside the portal.`;

// ---- Tools: executed in the browser -----------------------------------------------------------
const TOOLS = [
  {
    name: "get_page",
    description: "Read the page the person is looking at: its title, the headline figures, every table (headers and rows), chart data, and the controls on it (filter chips, tabs, dropdowns, search boxes, buttons) — each control with a ref you can pass to interact, and whether it is currently on. Call this before answering about 'this page' or before interacting.",
    input_schema: { type: "object", properties: {
      max_rows: { type: "integer", description: "Rows to return per table (default 25, max 200)." }
    }, additionalProperties: false }
  },
  {
    name: "interact",
    description: "Operate a control on the current page using a ref from the latest get_page: click a filter chip, tab or button; choose an option in a dropdown; or type into a search box. Buttons that change data or send something ask the person to confirm first; the result says whether they allowed it. Returns what changed.",
    input_schema: { type: "object", properties: {
      ref: { type: "string", description: "Control ref from get_page, e.g. c12." },
      action: { type: "string", enum: ["click", "select", "type"] },
      value: { type: "string", description: "Option label or value for select; text for type." }
    }, required: ["ref", "action"], additionalProperties: false }
  },
  {
    name: "filter_table",
    description: "Filter or sort a table on the current page by column, like the funnel on each column header. Call with only {} (or just a table) to list the tables, their columns, column types, current filters and the values in short text columns. Then set ONE column per call: values (keep only rows whose column equals one of these), or op + value (text: contains, ncontains, eq, neq, starts, ends, empty, nempty; number: eq, neq, gt, gte, lt, lte, between (value2), top, bottom (value = N), above, below (average); date: on, non, after, onafter, before, onbefore, between — dates as YYYY-MM-DD), or sort asc|desc, or clear true (column '*' clears the whole table). Filters stack across columns. Returns the table's columns, filters and how many rows now show. Prefer this over page chips for narrowing a table.",
    input_schema: { type: "object", properties: {
      table: { type: "string", description: "Table title (its card heading) or index from the listing. Optional when the page has one table." },
      column: { type: "string" },
      values: { type: "array", items: { type: "string" } },
      op: { type: "string" },
      value: { type: "string" },
      value2: { type: "string" },
      sort: { type: "string", enum: ["asc", "desc"] },
      clear: { type: "boolean" }
    }, additionalProperties: false }
  },
  {
    name: "navigate",
    description: "Open another portal page. Only pages this person may open are listed by list_pages. Query parameters are allowed (e.g. finance.html?show=overdue, farm-detail.html?farmer=f_joubert). After navigating you continue on the new page.",
    input_schema: { type: "object", properties: {
      page: { type: "string", description: "Page file with optional query, e.g. stock.html or finance.html?show=overdue" },
      reason: { type: "string", description: "Short note shown to the person, e.g. 'Opening Stock'." }
    }, required: ["page"], additionalProperties: false }
  },
  {
    name: "list_pages",
    description: "List the portal pages this person may open, by section, with what each is for and the query parameters it understands.",
    input_schema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "describe_data",
    description: "List the data tables this seat can query (orders, farmers, products, inventory, soil, leaf, watch, programs, invoices, deliveries, …) with their fields and one example row each, plus whether the accounting (Sage) snapshot is available.",
    input_schema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "query_data",
    description: "Query one table from describe_data, or the accounting snapshot ('sage.customers', 'sage.invoices', 'sage.payments', 'sage.products'). Filters are exact-match (where) or case-insensitive contains (contains); numeric ranges via min/max. Optionally group_by a field and sum a numeric field. Orders get a computed 'value' (Rand). Returns rows (or groups), the total count, and whether the data is sample or from Sage.",
    input_schema: { type: "object", properties: {
      table: { type: "string" },
      where: { type: "object", description: "Field → exact value.", additionalProperties: true },
      contains: { type: "object", description: "Field → text to find (case-insensitive).", additionalProperties: true },
      min: { type: "object", description: "Field → minimum number (inclusive).", additionalProperties: true },
      max: { type: "object", description: "Field → maximum number (inclusive).", additionalProperties: true },
      fields: { type: "array", items: { type: "string" }, description: "Fields to return (default: all)." },
      sort: { type: "string", description: "Field to sort by; prefix with - for descending." },
      group_by: { type: "string" },
      sum: { type: "string", description: "Numeric field to total per group (with group_by) or overall." },
      limit: { type: "integer", description: "Max rows (default 50, max 300)." }
    }, required: ["table"], additionalProperties: false }
  },
  {
    name: "business_summary",
    description: "Ready-made analyses the portal already computes: 'alerts' (what needs attention, by severity), 'reorder' (stock days-of-cover vs supplier lead time), 'farm_health' (0–100 scores with drivers), 'pipeline' (orders by status, month and rep), 'ledger' (owed, overdue, debtor ageing, invoiced vs received by month, top debtors — accounting seats only).",
    input_schema: { type: "object", properties: {
      topic: { type: "string", enum: ["alerts", "reorder", "farm_health", "pipeline", "ledger"] }
    }, required: ["topic"], additionalProperties: false }
  },
  {
    name: "show",
    description: "Display a table, chart or figures in the answer panel. Use for lists longer than a few rows, comparisons and trends. Charts: 'bar' and 'line' take labels + series; 'hbar' and 'donut' take rows of {label, value}. 'stats' takes rows of {label, value, sub}. Set money true for Rand values.",
    input_schema: { type: "object", properties: {
      kind: { type: "string", enum: ["table", "bar", "line", "hbar", "donut", "stats"] },
      title: { type: "string" },
      columns: { type: "array", items: { type: "string" }, description: "table: column headings." },
      rows: { type: "array", description: "table: arrays of cell values. hbar/donut/stats: objects {label, value, sub?, href?}.", items: {} },
      labels: { type: "array", items: { type: "string" }, description: "bar/line: x-axis labels." },
      series: { type: "array", description: "bar/line: [{name, values:number[]}].", items: { type: "object", properties: { name: { type: "string" }, values: { type: "array", items: { type: "number" } } }, required: ["name", "values"] } },
      stacked: { type: "boolean" },
      money: { type: "boolean" },
      numeric_columns: { type: "array", items: { type: "integer" }, description: "table: zero-based columns to right-align." }
    }, required: ["kind"], additionalProperties: false }
  }
];

// ---- helpers ------------------------------------------------------------------------------------
function cors(env, req) {
  const origin = req.headers.get("Origin") || "";
  const allowed = String(env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : allowed[0] || "null",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
}

// Sessions are fh-biobrix's: a token is good if fh-biobrix's /me accepts it. Cached briefly per isolate.
const seen = new Map();
async function seatFor(req, env) {
  if (env.AUTH_MODE === "demo") return { id: "demo", name: "Demo seat" };   // local preview only
  const auth = req.headers.get("Authorization") || "";
  if (!/^Bearer \S+$/.test(auth)) return null;
  const hit = seen.get(auth);
  if (hit && hit.until > Date.now()) return hit.user;
  const r = await fetch(env.AUTH_API.replace(/\/$/, "") + "/me", { headers: { Authorization: auth } });
  if (!r.ok) return null;
  const j = await r.json().catch(() => null);
  const user = j && (j.user || j);
  if (!user || !(user.id || user.email)) return null;
  seen.set(auth, { user, until: Date.now() + 5 * 60_000 });
  return user;
}
const turns = new Map();
function overLimit(seatKey) {
  const day = new Date().toISOString().slice(0, 10), k = seatKey + "|" + day;
  const n = (turns.get(k) || 0) + 1; turns.set(k, n);
  return n > DAILY_TURNS_PER_SEAT;
}
function validMessages(m) {
  if (!Array.isArray(m) || !m.length || m.length > MAX_MESSAGES) return false;
  if (m[0].role !== "user") return false;
  return m.every(x => x && (x.role === "user" || x.role === "assistant") && (typeof x.content === "string" || Array.isArray(x.content)));
}

export default {
  async fetch(req, env) {
    const h = cors(env, req);
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    if (url.pathname === "/health") return json({ ok: true, model: MODEL, configured: !!env.ANTHROPIC_API_KEY }, 200, h);
    if (url.pathname !== "/ask" || req.method !== "POST") return json({ error: "Not found" }, 404, h);
    if (!env.ANTHROPIC_API_KEY) return json({ error: "The assistant isn't switched on yet.", code: "not_configured" }, 503, h);

    const seat = await seatFor(req, env).catch(() => null);
    if (!seat) return json({ error: "Please sign in again.", code: "unauthenticated" }, 401, h);
    if (overLimit(String(seat.id || seat.email))) return json({ error: "That's today's limit for the assistant on this seat.", code: "limit" }, 429, h);

    const raw = await req.text();
    if (raw.length > MAX_BODY) return json({ error: "This conversation has grown too long — start a new one.", code: "too_long" }, 413, h);
    let body; try { body = JSON.parse(raw); } catch { return json({ error: "Bad request" }, 400, h); }
    if (!validMessages(body.messages)) return json({ error: "Bad request" }, 400, h);

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    try {
      // History is append-only (the browser echoes every assistant turn back unchanged, thinking
      // blocks included), so the cached prefix — tools, system, earlier turns — keeps hitting.
      const res = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "medium" },
        cache_control: { type: "ephemeral" },
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        tools: TOOLS,
        tool_choice: { type: "auto" },
        messages: body.messages,
      });
      return json({ content: res.content, stop_reason: res.stop_reason, stop_details: res.stop_details || null,
                    model: res.model, usage: res.usage }, 200, h);
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return json({ error: "The assistant is busy — try again in a moment.", code: "busy" }, 429, h);
      if (e instanceof Anthropic.BadRequestError) return json({ error: "The assistant couldn't read that conversation — start a new one.", code: "bad_request", detail: e.message }, 400, h);
      if (e instanceof Anthropic.AuthenticationError) return json({ error: "The assistant's key isn't valid.", code: "not_configured" }, 503, h);
      if (e instanceof Anthropic.APIError) return json({ error: "The assistant had a problem (" + e.status + ").", code: "upstream" }, 502, h);
      return json({ error: "Couldn't reach the assistant.", code: "network" }, 502, h);
    }
  },
};
