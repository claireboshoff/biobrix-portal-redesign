/* ============================================================
   BioBrix Intelligence — the Ask bar on every page.

   Claude (through the fh-biobrix-ask Worker) decides what to do; this file does it, as the
   signed-in seat: reads the page, queries the seat's own data and the accounting snapshot,
   navigates, operates filters and tabs, and draws tables and charts in the answer.
   Anything that changes data or sends something waits for the person to confirm.

   The conversation lives in sessionStorage and is append-only (every assistant turn is sent
   back exactly as it came), so it survives navigation: a navigate call finishes on the next
   page. With no signal, or before the Worker is switched on, questions fall back to the
   built-in rules in bb-intel.js.
   Loaded by bb-shell.js after the page renders. Exposes BB.ask.
   ============================================================ */
(function () {
  "use strict";
  var u = window.BB && BB.user;
  if (!u || u.roleKey === 'farmer' || document.getElementById('askdock')) return;
  var CFG = window.BB_CONFIG || {};
  var API = CFG.ASK_API || '';
  var d = BB.data, esc = BB.esc, icon = BB.icon;
  var SKEY = 'bb_ask_v1', MINKEY = 'bb_ask_min';
  var MAX_STEPS = 12;

  // ---------- state ----------------------------------------------------------------------------
  function load() { try { return JSON.parse(sessionStorage.getItem(SKEY)) || null; } catch (e) { return null; } }
  var S = load() || { messages: [], view: [], pending: null };
  function save() {
    try { sessionStorage.setItem(SKEY, JSON.stringify(S)); }
    catch (e) { // storage full: keep the conversation going, drop the oldest display items
      S.view = S.view.slice(-20); try { sessionStorage.setItem(SKEY, JSON.stringify(S)); } catch (e2) {} }
  }
  var busy = false;

  function file() { var f = location.pathname.split('/').pop() || 'index.html'; if (f.indexOf('.') < 0) f += '.html'; return f; }
  function pageTitle() { var h = document.querySelector('main.wrap h1, main h1'); return (h ? h.textContent : document.title.split('·')[0]).replace(/\s+/g, ' ').trim(); }
  function context() {
    var now = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return '[Seat: ' + u.name + ' — ' + (u.role || '') + ' (' + u.roleKey + ')' + (u.region ? ', ' + u.region : '') +
      '. Page: ' + pageTitle() + ' (' + file() + location.search + location.hash + '). Today: ' + now + '.]';
  }

  // ---------- page reading ------------------------------------------------------------------------
  var MAIN = function () { return document.querySelector('main.wrap') || document.querySelector('main') || document.body; };
  function txt(el) { return el ? String(el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function visible(el) { return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length)); }
  function outside(el) { return !el.closest('#askdock,#bbNav,.bb-top,.bb-nav'); }
  function cardTitle(el) {
    var c = el.closest('.card,.stat'); var h = c && c.querySelector('.card-h h3, h3');
    if (h) return txt(h);
    var s = el.closest('section'); h = s && s.querySelector('h2,h3'); return h ? txt(h) : '';
  }
  function controlLabel(el) {
    var t = el.getAttribute('aria-label') || '';
    if (!t && el.id) { var l = document.querySelector('label[for="' + el.id + '"]'); if (l) t = txt(l); }
    if (!t && el.closest('.fld')) { var fl = el.closest('.fld').querySelector('label'); if (fl) t = txt(fl); }
    if (!t) t = txt(el) || el.getAttribute('placeholder') || el.getAttribute('title') || el.name || el.id || '';
    return t.slice(0, 80);
  }
  function groupLabel(el) {
    // A row of chips usually sits after a small caption ("REGION", "REP") or inside a card header.
    var p = el.parentElement, prev = el;
    for (var i = 0; i < 6 && prev; i++) { prev = prev.previousElementSibling; if (prev && !prev.matches('.chip,.seg,button,a,select,input') && txt(prev).length < 30 && txt(prev)) return txt(prev); }
    return cardTitle(el) || (p && p.getAttribute('aria-label')) || '';
  }
  function kindOf(el) {
    if (el.tagName === 'SELECT') return 'dropdown';
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return (el.type === 'search' || /search|filter|find/i.test(el.placeholder || el.id || '')) ? 'search' : 'field';
    if (el.closest('.seg') || el.getAttribute('role') === 'tab') return 'tab';
    if (el.classList.contains('chip')) return el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href').charAt(0) !== '#' ? 'link' : 'filter';
    if (el.tagName === 'A') return 'link';
    return 'button';
  }
  function isOn(el) {
    return el.classList.contains('on') || el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-selected') === 'true';
  }
  // A plain button may change data or send something — those wait for the person.
  function needsConfirm(el, kind) { return kind === 'button' && !/^(show|hide|close|cancel|more|less|earlier|later|expand|collapse|view|open|print|\+|−|‹|›)/i.test(controlLabel(el)); }

  var refSeq = 0;
  function readControls() {
    var out = [];
    MAIN().querySelectorAll('.chip,.seg button,.seg a,[role="tab"],select,input[type="search"],input[type="text"],input:not([type]),textarea,button,a.btn').forEach(function (el) {
      if (!outside(el) || !visible(el) || el.disabled) return;
      if (out.length >= 140) return;
      var kind = kindOf(el);
      if (!el.dataset.askRef) el.dataset.askRef = 'c' + (++refSeq);
      var c = { ref: el.dataset.askRef, kind: kind, label: controlLabel(el) };
      var g = groupLabel(el); if (g && g !== c.label) c.group = g.slice(0, 60);
      if (kind === 'filter' || kind === 'tab') c.on = isOn(el);
      if (kind === 'dropdown') { c.value = (el.options[el.selectedIndex] || {}).text || ''; c.options = [].slice.call(el.options, 0, 40).map(function (o) { return o.text; }); }
      if (kind === 'search' || kind === 'field') c.value = el.value || '';
      if (kind === 'link') c.href = el.getAttribute('href');
      if (needsConfirm(el, kind)) c.confirm = true;
      out.push(c);
    });
    return out;
  }
  function readTables(maxRows) {
    return [].slice.call(MAIN().querySelectorAll('table')).filter(function (t) { return outside(t) && (visible(t) || t.closest('details')); }).slice(0, 12).map(function (t) {
      var heads = [].slice.call(t.querySelectorAll('thead th')).map(txt);
      var rows = [].slice.call(t.querySelectorAll('tbody tr')).filter(function (r) { return visible(r) || t.closest('details'); });
      var foot = [].slice.call(t.querySelectorAll('tfoot tr')).map(function (r) { return [].slice.call(r.cells).map(txt); });
      return { title: cardTitle(t) || (t.closest('details') ? 'chart data' : ''), columns: heads, total_rows: rows.length,
        rows: rows.slice(0, maxRows).map(function (r) { return [].slice.call(r.cells).map(function (c) { return txt(c).slice(0, 160); }); }),
        totals: foot.length ? foot : undefined };
    });
  }
  function readPage(maxRows) {
    var m = MAIN();
    var stats = [].slice.call(m.querySelectorAll('.stat')).filter(visible).slice(0, 16).map(function (s) {
      return { label: txt(s.querySelector('.l')), value: txt(s.querySelector('.v')), sub: txt(s.querySelector('.s')) };
    });
    var charts = [].slice.call(m.querySelectorAll('.bbc svg[aria-label], .donut-wrap svg[aria-label]')).filter(outside).slice(0, 10).map(function (svg) {
      return { title: cardTitle(svg), data: String(svg.getAttribute('aria-label')).slice(0, 1500) };
    });
    var ranks = [].slice.call(m.querySelectorAll('.hbars')).filter(outside).slice(0, 6).map(function (h) {
      return { title: cardTitle(h), rows: [].slice.call(h.querySelectorAll('.hbar')).slice(0, 25).map(function (r) { return txt(r.querySelector('.top')); }) };
    });
    var sample = m.querySelector('.bb-sample');
    var scope = document.querySelector('.bb-scope');
    var out = {
      page: file() + location.search + location.hash, title: pageTitle(),
      breadcrumb: txt(document.querySelector('.bb-crumbs')),
      intro: txt(m.querySelector('.page-head p')).slice(0, 300),
      scope: scope ? txt(scope) : undefined,
      sample: sample ? txt(sample).slice(0, 300) : undefined,
      figures: stats, charts: charts, rankings: ranks,
      tables: readTables(Math.min(200, maxRows || 25)),
      column_filters: BB.tableFilters ? BB.tableFilters.list().map(function (t) { return { table: t.table, title: t.title, shown: t.shown, rows: t.rows, filtered: t.columns.filter(function (c) { return c.filter; }).map(function (c) { return c.column; }) }; }) : undefined,
      controls: readControls()
    };
    var s = JSON.stringify(out);
    if (s.length > 60000) { out.tables.forEach(function (t) { t.rows = t.rows.slice(0, 10); t.note = 'trimmed to 10 rows; ask with max_rows or use query_data'; }); }
    return out;
  }

  // ---------- data ----------------------------------------------------------------------------------
  var NAMES = { farmer: function (id) { var f = d.farmer(id); return f && (f.farm || f.name); }, rep: function (id) { var r = d.rep(id); return r && r.name; },
    prod: function (id) { var p = d.product(id); return p && p.name; }, depot: function (id) { var x = d.depot(id); return x && x.name; },
    supplier: function (id) { var x = d.supplier(id); return x && x.name; }, advisor: function (id) { var r = d.rep(id); return r && r.name; } };
  function enrich(table, r) {
    var o = {}; for (var k in r) if (Object.prototype.hasOwnProperty.call(r, k)) o[k] = r[k];
    Object.keys(NAMES).forEach(function (k) { if (typeof o[k] === 'string' && o[k]) { try { var n = NAMES[k](o[k]); if (n) o[k + '_name'] = n; } catch (e) {} } });
    if (table === 'orders') { try { o.value = d.orderValue(r); o.deliver_month_name = BB.monthName(r.deliverMonth); } catch (e) {} }
    if (Array.isArray(o.lines)) o.lines = o.lines.map(function (l) { var x = {}; for (var k in l) x[k] = l[k]; if (l.prod) x.prod_name = NAMES.prod(l.prod); return x; });
    return o;
  }
  function sage() { try { var s = d.sage && d.sage(); return s && s.live ? s : null; } catch (e) { return null; } }
  function ledgerAllowed() { return BB.auth.can('finance') || u.roleKey === 'director' || u.roleKey === 'advisor'; }
  function tableNames() {
    var st = d.store ? d.store() : {}, out = [];
    Object.keys(st).forEach(function (k) { if (Array.isArray(st[k]) && k !== 'queue') out.push(k); });
    return out;
  }
  function rowsOf(table) {
    if (/^sage\./.test(table)) {
      var s = sage(), k = table.slice(5);
      if (!s) throw new Error('The accounting snapshot is not available on this seat.');
      if (k !== 'products' && !ledgerAllowed()) throw new Error('This seat does not have access to customer accounts.');
      if (!Array.isArray(s[k])) throw new Error('No ' + k + ' in the accounting snapshot. Available: ' + Object.keys(s).filter(function (x) { return Array.isArray(s[x]); }).map(function (x) { return 'sage.' + x; }).join(', '));
      return { rows: s[k].slice(), source: 'sage' };
    }
    if (tableNames().indexOf(table) < 0) throw new Error('Unknown table "' + table + '". Tables: ' + tableNames().concat(sage() ? ['sage.customers', 'sage.invoices', 'sage.payments', 'sage.products'] : []).join(', '));
    var rows = d.all(table).map(function (r) { return enrich(table, r); });
    return { rows: rows, source: rows.some(function (r) { return r.src === 'sage' || r.sageId; }) ? 'sage' : 'portal' };
  }
  function fieldsOf(rows) { var f = {}; rows.slice(0, 8).forEach(function (r) { Object.keys(r).forEach(function (k) { f[k] = typeof r[k]; }); }); return f; }
  function trimRow(r) { var o = {}; Object.keys(r).forEach(function (k) { var v = r[k]; o[k] = (typeof v === 'string' && v.length > 300) ? v.slice(0, 300) + '…' : v; }); return o; }
  function describeData() {
    var out = { tables: {}, sage: null };
    tableNames().forEach(function (t) { try { var rs = rowsOf(t).rows; out.tables[t] = { count: rs.length, fields: fieldsOf(rs), example: rs[0] ? trimRow(rs[0]) : null, sample: !!(BB.sageLive() && rs.length && BB.isSample(rs[0])) }; } catch (e) {} });
    var s = sage();
    if (s) { out.sage = { last_read: (s.meta || {}).lastSast, tables: {} };
      ['customers', 'invoices', 'payments', 'products'].forEach(function (k) { if (Array.isArray(s[k]) && (k === 'products' || ledgerAllowed())) out.sage.tables['sage.' + k] = { count: s[k].length, fields: fieldsOf(s[k]), example: s[k][0] ? trimRow(s[k][0]) : null }; }); }
    out.note = BB.sageLive() ? 'Customers, invoices and payments come from Sage; other tables are still sample data unless a row says src:"sage".' : 'All portal tables are demonstration data (Sage not connected on this seat).';
    return out;
  }
  function num(v) { var n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.\-]/g, '')); return isFinite(n) ? n : null; }
  function queryData(a) {
    var got = rowsOf(a.table), rows = got.rows;
    var low = function (v) { return String(v == null ? '' : v).toLowerCase(); };
    if (a.where) Object.keys(a.where).forEach(function (k) { rows = rows.filter(function (r) { var v = r[k], w = a.where[k]; return Array.isArray(v) ? v.indexOf(w) >= 0 : (v === w || low(v) === low(w)); }); });
    if (a.contains) Object.keys(a.contains).forEach(function (k) { rows = rows.filter(function (r) { return low(Array.isArray(r[k]) ? r[k].join(' ') : r[k]).indexOf(low(a.contains[k])) >= 0; }); });
    if (a.min) Object.keys(a.min).forEach(function (k) { rows = rows.filter(function (r) { var n = num(r[k]); return n != null && n >= a.min[k]; }); });
    if (a.max) Object.keys(a.max).forEach(function (k) { rows = rows.filter(function (r) { var n = num(r[k]); return n != null && n <= a.max[k]; }); });
    var count = rows.length;
    if (a.group_by) {
      var g = {};
      rows.forEach(function (r) { var key = String(r[a.group_by + '_name'] || r[a.group_by] || '(none)'); g[key] = g[key] || { group: key, count: 0 }; g[key].count++; if (a.sum) g[key].sum = (g[key].sum || 0) + (num(r[a.sum]) || 0); });
      var groups = Object.keys(g).map(function (k) { return g[k]; }).sort(function (x, y) { return a.sum ? (y.sum || 0) - (x.sum || 0) : y.count - x.count; });
      return { table: a.table, source: got.source, matched: count, group_by: a.group_by, sum_of: a.sum, groups: groups.slice(0, 100) };
    }
    if (a.sort) { var desc = a.sort.charAt(0) === '-', f = desc ? a.sort.slice(1) : a.sort;
      rows = rows.slice().sort(function (x, y) { var p = x[f], q = y[f], np = num(p), nq = num(q); var c = (np != null && nq != null) ? np - nq : String(p || '').localeCompare(String(q || '')); return desc ? -c : c; }); }
    var lim = Math.max(1, Math.min(300, a.limit || 50));
    var out = rows.slice(0, lim).map(function (r) { if (!a.fields || !a.fields.length) return trimRow(r); var o = {}; a.fields.forEach(function (k) { o[k] = r[k]; if (r[k + '_name'] !== undefined) o[k + '_name'] = r[k + '_name']; }); return o; });
    var res = { table: a.table, source: got.source, count: count, returned: out.length, rows: out };
    if (a.sum) res.sum = rows.reduce(function (t, r) { return t + (num(r[a.sum]) || 0); }, 0);
    if (got.source !== 'sage' && BB.sageLive()) res.sample = true;
    return res;
  }
  function summary(topic) {
    var I = BB.intel || {};
    if (topic === 'alerts') { var al = I.alerts ? I.alerts() : []; return { count: al.length, alerts: al.slice(0, 40).map(function (x) { return { severity: x.sev, text: x.txt, page: x.to }; }) }; }
    if (topic === 'reorder') return { lines: (I.reorderForecast ? I.reorderForecast() : []).map(function (r) { return { product: r.p.name, depot: r.depot.name, on_hand: r.qty, days_cover: r.daysCover, supplier: r.sup.name, lead_days: r.lead, order_now: r.urgent }; }) };
    if (topic === 'farm_health') return { farms: d.all('farmers').map(function (f) { var h = I.farmHealth(f.id); return { farm: f.farm, farmer: f.name, id: f.id, score: h.score, drivers: h.drivers, samples: h.samples, visits: h.visits }; })
      .filter(function (x) { return x.samples || x.visits; }).sort(function (a, b) { return a.score - b.score; }) };
    if (topic === 'pipeline') {
      var os = d.all('orders'), by = function (key, name) { var g = {}; os.forEach(function (o) { var k = name(o); g[k] = g[k] || { count: 0, value: 0 }; g[k].count++; g[k].value += d.orderValue(o); }); return g; };
      return { orders: os.length, total_value: os.reduce(function (t, o) { return t + d.orderValue(o); }, 0),
        by_status: by('status', function (o) { return o.status; }), by_delivery_month: by('m', function (o) { return BB.monthName(o.deliverMonth); }),
        by_rep: by('rep', function (o) { return (d.rep(o.rep) || {}).name || o.rep; }), sample: BB.sageLive() || undefined };
    }
    if (topic === 'ledger') {
      var s = sage(); if (!s) return { error: 'The accounting snapshot is not available on this seat.' };
      if (!ledgerAllowed()) return { error: 'This seat does not have access to customer accounts.' };
      var open = function (i) { return i.outstanding != null ? i.outstanding : (i.status === 'Paid' ? 0 : (i.amount || 0)); };
      var t0 = new Date(new Date().toISOString().slice(0, 10)), inv = s.invoices || [], pay = s.payments || [], byId = {};
      (s.customers || []).forEach(function (c) { byId[c.id] = c; });
      var age = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90_plus: 0 }, owed = 0, overdue = 0, perCust = {};
      inv.forEach(function (i) { var v = open(i); if (v <= 0.5) return; owed += v; var dd = i.dueDate ? Math.round((t0 - new Date(i.dueDate)) / 86400000) : 0;
        if (dd > 0) overdue += v; age[dd <= 0 ? 'current' : dd <= 30 ? 'd1_30' : dd <= 60 ? 'd31_60' : dd <= 90 ? 'd61_90' : 'd90_plus'] += v;
        perCust[i.customer] = (perCust[i.customer] || 0) + v; });
      var months = []; for (var k = 5; k >= 0; k--) { var x = new Date(t0.getFullYear(), t0.getMonth() - k, 1); months.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0')); }
      return { source: 'sage', last_read: (s.meta || {}).lastSast, owed: owed, overdue: overdue, ageing: age,
        by_month: months.map(function (m) { return { month: m, invoiced: inv.filter(function (i) { return (i.date || '').slice(0, 7) === m; }).reduce(function (t, i) { return t + (i.amount || 0); }, 0),
          received: pay.filter(function (p) { return (p.date || '').slice(0, 7) === m; }).reduce(function (t, p) { return t + (p.amount || 0); }, 0) }; }),
        top_debtors: Object.keys(perCust).map(function (id) { var c = byId[id] || {}; return { customer: c.name || id, owed: perCust[id], credit_limit: c.creditLimit, on_hold: !!c.onHold }; }).sort(function (a, b) { return b.owed - a.owed; }).slice(0, 12),
        over_limit: (s.customers || []).filter(function (c) { return c.creditLimit > 0 && c.balance > c.creditLimit; }).map(function (c) { return { customer: c.name, balance: c.balance, limit: c.creditLimit }; }) };
    }
    return { error: 'Unknown topic' };
  }
  var PAGE_HINTS = {
    'finance.html': '?show=open | ?show=overdue (invoice filters)', 'farms.html': '?show=overlimit | ?show=accounts',
    'farm-detail.html': '?farmer=<farmer id from query_data farmers>', 'bioanalyze-soil.html': '?block=<block id>', 'bioanalyze-leaf.html': '?block=<block id>',
    'biowatch.html': '?block=<block id>', 'document.html': '?farmer=&kind=&id=', 'client-portal.html': '#orders | #account | #docs'
  };
  function listPages() {
    var pages = (BB.railPages ? BB.railPages() : []).map(function (p) { var o = { page: p.href, label: p.label, section: p.cat }; if (PAGE_HINTS[p.href]) o.params = PAGE_HINTS[p.href]; return o; });
    if (BB.auth.canPage('farm-detail.html')) pages.push({ page: 'farm-detail.html', label: 'Farm record (one farm)', section: 'BioServices', params: PAGE_HINTS['farm-detail.html'] });
    return { current: file() + location.search, pages: pages };
  }

  // ---------- acting ------------------------------------------------------------------------------
  function findRef(ref) { return document.querySelector('[data-ask-ref="' + String(ref).replace(/[^\w-]/g, '') + '"]'); }
  function quickState() {
    var on = [].slice.call(MAIN().querySelectorAll('.chip.on,.seg .on,[aria-selected="true"]')).filter(outside).map(txt).filter(Boolean);
    var stats = [].slice.call(MAIN().querySelectorAll('.stat')).filter(visible).slice(0, 6).map(function (s) { return txt(s.querySelector('.l')) + ': ' + txt(s.querySelector('.v')); });
    var tables = [].slice.call(MAIN().querySelectorAll('table.bb')).filter(function (t) { return outside(t) && visible(t); }).map(function (t) { return (cardTitle(t) || 'table') + ': ' + t.querySelectorAll('tbody tr').length + ' rows'; });
    return { now_on: on, figures: stats, tables: tables };
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function safeHref(h) {
    h = String(h || '').trim(); if (!h || /^(https?:|javascript:|data:|\/\/)/i.test(h)) return null;
    var f = h.split(/[?#]/)[0]; if (!/^[\w-]+\.html$/.test(f)) return null;
    return BB.auth.canPage(f) ? h : null;
  }
  // Confirmation: the loop waits here until the person answers in the panel.
  var confirmWaiter = null;
  function askConfirm(label) {
    return new Promise(function (resolve) {
      confirmWaiter = resolve;
      addView({ who: 'confirm', label: label, state: 'open' }, true);
    });
  }
  function settleConfirm(ok) {
    var v = S.view[S.view.length - 1]; if (v && v.who === 'confirm') { v.state = ok ? 'yes' : 'no'; save(); paint(); }
    var w = confirmWaiter; confirmWaiter = null; if (w) w(ok);
  }
  async function interact(a, partial, id) {
    var el = findRef(a.ref);
    if (!el || !document.contains(el)) return { error: 'That control is no longer on the page (it may have redrawn). Call get_page again for fresh refs.' };
    var kind = kindOf(el), label = controlLabel(el);
    if (kind === 'link' || (el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href').charAt(0) !== '#' && kind !== 'filter')) {
      var href = safeHref(el.getAttribute('href'));
      if (!href) return { error: 'That link leads outside what this seat can open.' };
      return goTo(href, 'Opening ' + label, partial, id);
    }
    if (needsConfirm(el, kind)) {
      step('Waiting for you: ' + label);
      var ok = await askConfirm(label);
      if (!ok) return { done: false, declined: true, note: 'The person chose not to click "' + label + '".' };
    }
    // The page may reload on a click (some actions save and redraw). Leave a note so the
    // conversation picks up on the reloaded page instead of hanging.
    S.pending = { results: partial, id: id, kind: 'interact', label: label }; save();
    if (a.action === 'select' && el.tagName === 'SELECT') {
      var want = String(a.value || '').toLowerCase(), opt = [].slice.call(el.options).find(function (o) { return o.text.toLowerCase() === want || o.value.toLowerCase() === want; }) ||
        [].slice.call(el.options).find(function (o) { return o.text.toLowerCase().indexOf(want) >= 0; });
      if (!opt) { S.pending = null; save(); return { error: 'No option "' + a.value + '". Options: ' + [].slice.call(el.options).map(function (o) { return o.text; }).join(', ') }; }
      el.value = opt.value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
      step('Set ' + (groupLabel(el) || label) + ': ' + opt.text);
    } else if (a.action === 'type' && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
      el.value = a.value || ''; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
      step('Typed “' + (a.value || '') + '” in ' + label);
    } else {
      el.click(); step((kind === 'filter' || kind === 'tab' ? 'Switched to ' : 'Clicked ') + label);
    }
    await wait(450);
    S.pending = null; save();
    var st = quickState(); st.done = true; st.note = 'Refs may have changed if the page redrew; call get_page before the next interact.';
    return st;
  }
  function goTo(href, reason, partial, id) {
    href = safeHref(href);
    if (!href) return { error: 'That page is not one this seat can open. Use list_pages.' };
    step(reason || ('Opening ' + href));
    S.pending = { results: partial, id: id, kind: 'navigate', to: href }; save();
    setTimeout(function () { location.href = href; }, 250);
    return { navigating: true };
  }

  // ---------- show (tables + charts in the answer) ------------------------------------------------
  var showSeq = 0;
  function renderShow(spec, host) {
    var id = 'askc' + (++showSeq), money = !!spec.money, fmt = money ? BB.money : BB.num;
    var head = spec.title ? '<div class="ask-sh">' + esc(spec.title) + '</div>' : '';
    if (spec.kind === 'table') {
      var nc = spec.numeric_columns || [];
      host.innerHTML = head + '<div class="scroll ask-tbl"><table class="bb"><thead><tr>' + (spec.columns || []).map(function (c, i) { return '<th' + (nc.indexOf(i) >= 0 ? ' class="num"' : '') + '>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        (spec.rows || []).slice(0, 300).map(function (r) { return '<tr>' + (Array.isArray(r) ? r : [r]).map(function (c, i) { return '<td' + (nc.indexOf(i) >= 0 ? ' class="num"' : '') + '>' + esc(c == null ? '' : c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
      return;
    }
    if (spec.kind === 'stats') {
      host.innerHTML = head + '<div class="ask-stats">' + (spec.rows || []).slice(0, 8).map(function (r) { return '<div class="stat"><div class="l">' + esc(r.label) + '</div><div class="v">' + esc(typeof r.value === 'number' ? fmt(r.value) : r.value) + '</div>' + (r.sub ? '<div class="s">' + esc(r.sub) + '</div>' : '') + '</div>'; }).join('') + '</div>';
      return;
    }
    host.innerHTML = head + '<div id="' + id + '"></div>';
    var el = host.querySelector('#' + id);
    try {
      if (spec.kind === 'bar' || spec.kind === 'line') BB.chart[spec.kind](el, { labels: spec.labels || [], series: (spec.series || []).map(function (s) { return { name: s.name, values: (s.values || []).map(Number) }; }), stacked: !!spec.stacked, money: money, height: 200, table: true });
      else if (spec.kind === 'hbar') BB.chart.hbar(el, { money: money, rows: (spec.rows || []).slice(0, 25).map(function (r, i) { return { label: r.label, sub: r.sub, value: Number(r.value) || 0, color: '#3f6b28', href: safeHref(r.href) || undefined }; }) });
      else if (spec.kind === 'donut') BB.chart.donut(el, { money: money, size: 128, rows: (spec.rows || []).slice(0, 8).map(function (r) { return { label: r.label, value: Number(r.value) || 0 }; }) });
    } catch (e) { el.innerHTML = '<div class="faint">Couldn’t draw that chart.</div>'; }
  }

  // ---------- the loop ------------------------------------------------------------------------------
  var TOOLS = {
    get_page: function (a) { step('Reading this page'); return readPage(a.max_rows); },
    filter_table: function (a) {
      if (!BB.tableFilters) throw new Error('Tables are still loading; try again.');
      if (!a.column) return { tables: BB.tableFilters.list() };
      var spec = a.clear ? { clear: true } : a.sort ? { sort: a.sort } : (a.values && a.values.length) ? { values: a.values } : a.op ? { op: a.op, value: a.value, value2: a.value2 } : null;
      if (!spec) return { tables: BB.tableFilters.list() };
      step((a.clear ? 'Cleared ' : a.sort ? 'Sorted by ' : 'Filtered ') + a.column + (a.values ? ': ' + a.values.join(', ') : a.op ? ' ' + a.op + ' ' + (a.value || '') : ''));
      return BB.tableFilters.set(a.table, a.column, spec);
    },
    list_pages: function () { return listPages(); },
    describe_data: function () { step('Checking what you can see'); return describeData(); },
    query_data: function (a) { step('Looking up ' + String(a.table).replace(/^sage\./, '') + (a.group_by ? ' by ' + a.group_by : '')); return queryData(a); },
    business_summary: function (a) { step('Checking ' + String(a.topic).replace('_', ' ')); return summary(a.topic); },
    show: function (a) { addView({ who: 'show', spec: a }); return { shown: true }; },
    interact: function (a, partial, id) { return interact(a, partial, id); },
    navigate: function (a, partial, id) { return goTo(a.page, a.reason, partial, id); }
  };
  function clip(obj) {
    var s = JSON.stringify(obj === undefined ? null : obj);
    return s.length > 40000 ? s.slice(0, 40000) + '…(truncated — narrow the request)' : s;
  }
  async function runTools(blocks) {
    var results = [];
    S.batch = blocks.map(function (b) { return b.id; }); save();   // so a reload mid-batch can close every call
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i], fn = TOOLS[b.name], out, err = false;
      try {
        if (!fn) throw new Error('Unknown tool ' + b.name);
        out = await fn(b.input || {}, results.slice(), b.id);
      } catch (e) { out = { error: String(e && e.message || e) }; err = true; }
      if (out && out.navigating) return null;   // the navigate result (and any calls after it) are sent from the next page
      results.push({ type: 'tool_result', tool_use_id: b.id, content: clip(out), is_error: err || !!(out && out.error) || undefined });
    }
    return results;
  }
  async function call(messages) {
    var h = { 'Content-Type': 'application/json' }, t = BB.auth.token && BB.auth.token();
    if (t) h.Authorization = 'Bearer ' + t;
    var r = await fetch(API.replace(/\/$/, '') + '/ask', { method: 'POST', headers: h, body: JSON.stringify({ messages: messages }) });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) { var e = new Error(j.error || ('HTTP ' + r.status)); e.code = j.code || r.status; throw e; }
    return j;
  }
  async function loop() {
    busy = true; paint();
    try {
      for (var n = 0; n < MAX_STEPS; n++) {
        var res = await call(S.messages);
        S.messages.push({ role: 'assistant', content: res.content });   // exactly as received
        var text = (res.content || []).filter(function (b) { return b.type === 'text' && b.text; }).map(function (b) { return b.text; }).join('\n\n');
        if (text) addView({ who: 'ai', text: text });
        if (res.stop_reason === 'refusal') { addView({ who: 'note', text: 'The assistant declined that one. Try asking another way.' }); break; }
        if (res.stop_reason === 'max_tokens') { addView({ who: 'note', text: 'That answer ran long and was cut off.' }); break; }
        if (res.stop_reason !== 'tool_use') break;
        var uses = res.content.filter(function (b) { return b.type === 'tool_use'; });
        var results = await runTools(uses);
        if (results === null) return;                                   // navigating — continues on the next page
        S.messages.push({ role: 'user', content: results }); S.batch = null; save();
        if (n === MAX_STEPS - 1) addView({ who: 'note', text: 'Stopped after ' + MAX_STEPS + ' steps.' });
      }
    } catch (e) {
      fallback(e);
    } finally { busy = false; save(); paint(); }
  }
  // No Worker, no signal, or not switched on yet: answer from the built-in rules and keep the
  // conversation clean (drop the unanswered turn so the history stays valid for later).
  function fallback(e) {
    var last = S.messages[S.messages.length - 1];
    if (last && last.role === 'user' && typeof last.content === 'string') {
      S.messages.pop();
      var q = last.content.replace(/^\[[^\]]*\]\s*/, '');
      var a = BB.intel && (BB.intel.answer(q) || BB.intel.answer('at a glance'));
      if (a) addView({ who: 'ai', text: '# ' + a.title + '\n' + a.lines.join('\n') + '\n\n[Open the detail](' + a.to + ')', offline: true });
    } else if (last && last.role === 'user') {
      // a tool round failed to send: drop it and the assistant turn that asked for it
      S.messages.pop(); if (S.messages.length && S.messages[S.messages.length - 1].role === 'assistant') S.messages.pop();
    }
    var why = !navigator.onLine ? 'No signal' : (e && e.code === 'not_configured') ? 'The assistant isn’t switched on yet' :
      (e && e.code === 'unauthenticated') ? 'Your session needs a fresh sign-in' : (e && e.code) ? (e.message || 'The assistant had a problem') : 'The assistant couldn’t be reached';
    addView({ who: 'note', text: why + ' — ' + (S.view.some(function (v) { return v.offline; }) ? 'that answer came from the built-in rules.' : 'try again in a moment.') });
  }
  function ask(q) {
    q = String(q || '').trim(); if (!q || busy) return;
    if (!API) { S.messages.push({ role: 'user', content: q }); addView({ who: 'me', text: q }); fallback({ code: 'not_configured' }); save(); paint(); return; }
    S.messages.push({ role: 'user', content: context() + '\n\n' + q });
    addView({ who: 'me', text: q }); openPanel();
    loop();
  }
  // Coming back from a navigate (or a click that reloaded the page): finish the tool round here.
  function resume() {
    var p = S.pending; if (!p) return;
    S.pending = null;
    var results = (p.results || []).slice();
    if (p.kind === 'navigate') results.push({ type: 'tool_result', tool_use_id: p.id, content: clip({ done: true, now_on: file() + location.search + location.hash, title: pageTitle(), note: 'Call get_page to read this page or get control refs.' }) });
    else results.push({ type: 'tool_result', tool_use_id: p.id, content: clip({ done: true, note: 'Clicked "' + p.label + '"; the page reloaded.', state: quickState() }) });
    var have = results.map(function (r) { return r.tool_use_id; });
    (S.batch || []).forEach(function (rid) { if (have.indexOf(rid) < 0) results.push({ type: 'tool_result', tool_use_id: rid, content: clip({ skipped: true, note: 'Skipped: the page changed. Call it again here if still needed.' }), is_error: true }); });
    S.batch = null;
    S.messages.push({ role: 'user', content: results }); save();
    openPanel(); loop();
  }

  // ---------- view ----------------------------------------------------------------------------------
  function step(t) { addView({ who: 'step', text: t }); }
  function addView(v, now) { S.view.push(v); if (S.view.length > 120) S.view = S.view.slice(-120); save(); paint(); }
  function md(s) {
    var lines = esc(s).split('\n'), out = '', list = null;
    function inline(t) {
      return t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, label, href) { var h = safeHref(href.replace(/&amp;/g, '&')); return h ? '<a href="' + esc(h) + '">' + label + '</a>' : label; });
    }
    lines.forEach(function (l) {
      var m = l.match(/^\s*(?:[-•*]|(\d+)[.)])\s+(.*)$/);
      if (m) { var tag = m[1] ? 'ol' : 'ul'; if (list !== tag) { if (list) out += '</' + list + '>'; out += '<' + tag + '>'; list = tag; } out += '<li>' + inline(m[2]) + '</li>'; return; }
      if (list) { out += '</' + list + '>'; list = null; }
      var h = l.match(/^#{1,4}\s+(.*)$/);
      if (h) out += '<p class="h">' + inline(h[1]) + '</p>'; else if (l.trim()) out += '<p>' + inline(l) + '</p>';
    });
    if (list) out += '</' + list + '>';
    return out;
  }
  var SUGGEST = {
    'index.html': ['What needs me today?', 'How is the season tracking against last month?', 'Which farms need attention?'],
    'finance.html': ['Who owes us the most?', 'Show only the overdue invoices', 'How much came in this month?'],
    'orders.html': ['Show only pending orders', 'Which orders are waiting on stock?', 'Biggest orders this season'],
    'stock.html': ['What will run out first?', 'Show only George depot', 'Which lines are below reorder?'],
    'farms.html': ['Who is over their credit limit?', 'Show only Limpopo farms', 'Which farms grow citrus?'],
    'operations.html': ['What needs action today?', 'Where is the gap between reported and invoiced?'],
    'forecast.html': ['Which month is busiest?', 'How much of the pipeline is confirmed?']
  };
  function suggestions() { return SUGGEST[file()] || ['Summarise this page', 'What needs me today?', 'Which farms need attention?']; }

  var dock, panel, log, input;
  function build() {
    document.body.classList.add('has-ask');
    document.body.insertAdjacentHTML('beforeend',
      '<div class="askdock' + (localStorage.getItem(MINKEY) === '1' ? ' min' : '') + '" id="askdock" role="region" aria-label="Ask BioBrix">' +
        '<div class="ask-panel" id="askPanel" aria-live="polite">' +
          '<div class="ask-ph"><span class="ask-ti">' + icon('sparkles') + '<h4 id="askTitle">BioBrix Intelligence</h4></span>' +
            '<button type="button" class="ask-x" id="askClose" title="Close" aria-label="Close">×</button></div>' +
          '<div class="ask-log" id="askLog"></div>' +
          '<div class="ask-ft" id="askFt"></div>' +
        '</div>' +
        '<div class="ask-sugs" id="askSugs"></div>' +
        '<form class="ask-bar" id="askForm" autocomplete="off">' +
          '<span class="spark" aria-hidden="true">' + icon('sparkles') + '</span>' +
          '<input id="askQ" type="text" placeholder="Ask BioBrix about your business, or tell it what to show" aria-label="Ask BioBrix">' +
          '<button class="ask-ib hist" type="button" id="askHist" title="Show the last answer" aria-label="Show the last answer">' + icon('message') + '</button>' +
          '<button class="ask-ib go" type="submit" title="Ask" aria-label="Ask">' + icon('chevron') + '</button>' +
          '<button class="ask-ib minb" type="button" id="askMin" title="Hide the Ask bar" aria-label="Hide the Ask bar">–</button>' +
        '</form>' +
        '<button type="button" class="ask-fab" id="askFab" aria-label="Ask BioBrix">' + icon('sparkles') + '<span>Ask BioBrix</span></button>' +
      '</div>');
    dock = document.getElementById('askdock'); panel = document.getElementById('askPanel'); log = document.getElementById('askLog'); input = document.getElementById('askQ');
    document.getElementById('askForm').addEventListener('submit', function (e) { e.preventDefault(); var q = input.value; input.value = ''; ask(q); });
    document.getElementById('askClose').onclick = function () { closePanel(); };
    document.getElementById('askHist').onclick = function () { dock.classList.contains('open') ? closePanel() : openPanel(); };
    document.getElementById('askMin').onclick = function () { dock.classList.add('min'); localStorage.setItem(MINKEY, '1'); closePanel(); };
    document.getElementById('askFab').onclick = function () { dock.classList.remove('min'); localStorage.removeItem(MINKEY); input.focus(); };
    document.getElementById('askSugs').addEventListener('click', function (e) { var b = e.target.closest('[data-q]'); if (b) ask(b.getAttribute('data-q')); });
    log.addEventListener('click', function (e) { var c = e.target.closest('[data-confirm]'); if (c) settleConfirm(c.getAttribute('data-confirm') === 'yes'); });
    // Clicking outside closes the answer (it stays one tap away on the bar), unless it's still working.
    document.addEventListener('click', function (e) { if (!busy && !confirmWaiter && dock.classList.contains('open') && !e.target.closest('#askdock')) closePanel(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closePanel(); input.blur(); } });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && !/input|textarea|select/i.test((document.activeElement || {}).tagName || '')) { e.preventDefault(); dock.classList.remove('min'); input.focus(); }
    });
  }
  function openPanel() { dock.classList.add('open'); paint(); }
  function closePanel() { dock.classList.remove('open'); }
  // One answer card, like a search result: the latest question and what came back. Earlier turns stay
  // in the conversation behind it (so "now only George depot" still works) but aren't shown as a thread.
  function linksIn(text) {
    var out = [], re = /\[([^\]]+)\]\(([^)\s]+)\)/g, m;
    while ((m = re.exec(text))) { var h = safeHref(m[2]); if (h && !out.some(function (x) { return x.href === h; })) out.push({ label: m[1], href: h }); }
    return out;
  }
  function paint() {
    if (!dock) return;
    var sugs = document.getElementById('askSugs');
    sugs.innerHTML = suggestions().map(function (q) { return '<button type="button" class="ask-sug" data-q="' + esc(q) + '">' + esc(q) + icon('plus') + '</button>'; }).join('');
    document.getElementById('askHist').style.display = S.view.length ? '' : 'none';
    if (!dock.classList.contains('open')) return;
    var start = 0; S.view.forEach(function (v, i) { if (v.who === 'me') start = i; });
    var turn = S.view.slice(start), q = turn[0] && turn[0].who === 'me' ? turn[0].text : '';
    var title = '', body = '', links = [], steps = [];
    turn.forEach(function (v, k) {
      var i = start + k;
      if (v.who === 'ai') {
        var t = v.text, m = t.match(/^\s*#{1,3}\s+(.+)\n?/);
        if (m && !title) { title = m[1].replace(/\*\*/g, ''); t = t.slice(m[0].length); }
        links = links.concat(linksIn(t));
        t = t.replace(/^\s*\[[^\]]+\]\([^)\s]+\)\s*$/gm, '');   // a link on its own line lives in the footer as a button
        body += '<div class="ask-ai">' + md(t) + '</div>';
      } else if (v.who === 'show') body += '<div class="ask-show" data-i="' + i + '"></div>';
      else if (v.who === 'note') body += '<div class="ask-note">' + esc(v.text) + '</div>';
      else if (v.who === 'step') steps.push(v.text);
      else if (v.who === 'confirm') body += '<div class="ask-confirm">' + icon('alert') + '<span>Click <b>' + esc(v.label) + '</b> on this page? It may change a record or send something.</span>' +
        (v.state === 'open' ? '<button type="button" class="btn lime sm" data-confirm="yes">Go ahead</button><button type="button" class="btn ghost sm" data-confirm="no">Don’t</button>' : '<em>' + (v.state === 'yes' ? 'You allowed it' : 'You said no') + '</em>') + '</div>';
    });
    // While it works, the latest step reads as a status line; once done the steps fold away.
    if (busy) body += '<div class="ask-busy"><span class="dots"><i></i><i></i><i></i></span>' + esc(steps.length ? steps[steps.length - 1] : 'Thinking') + '…</div>';
    document.getElementById('askTitle').textContent = title || (busy ? 'Working on it' : 'BioBrix Intelligence');
    log.innerHTML = q ? '<div class="ask-q">You asked: “' + esc(q) + '”</div>' + body
                      : '<div class="ask-empty">Ask about orders, stock, farms, money owed or anything on this page. It can also take you somewhere, or switch filters for you.</div>';
    log.querySelectorAll('.ask-show').forEach(function (h) { renderShow(S.view[+h.getAttribute('data-i')].spec, h); });
    var ft = document.getElementById('askFt');
    ft.innerHTML = busy ? '' : links.slice(0, 3).map(function (l, i) { return '<a class="' + (i ? '' : 'pri') + '" href="' + esc(l.href) + '">' + esc(l.label) + icon('chevron') + '</a>'; }).join('');
    ft.style.display = ft.innerHTML ? '' : 'none';
    log.scrollTop = 0;
  }

  build(); paint();
  if (S.pending) setTimeout(resume, 300);
  BB.ask = { ask: ask, open: openPanel, close: closePanel, readPage: readPage, _state: function () { return S; } };
})();
