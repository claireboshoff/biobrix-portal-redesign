/* ============================================================
   BioBrix OS — column filters on every table (the 9five Resellers filter, made shared).

   Every table.bb in the page gets a funnel on each column header. The funnel opens a menu:
   Filter by condition (custom operator list: text Contains/Equals/…; numbers = ≠ > ≥ < ≤ a – b,
   Top N, Bottom N, Above/Below avg; dates On/Before/After/Between) · Filter by value (searchable
   checkbox list with counts, Select all / Clear) · Sort. Rules carried over from 9five:
   - the menu sits at the bottom-right of its funnel and follows it on scroll;
   - "Any" is the empty operator; number operators are symbols;
   - custom dropdowns only, never the OS <select>;
   - tables run full height (the page scrolls, not the table) with headers sticking under the top bar;
   - column widths are locked to the full data so nothing shifts as rows filter out;
   - a table filtered to nothing keeps its shape with placeholder rows.
   Works on the rendered table (no page changes needed): pages that redraw a table get their
   filters re-applied. Totals rows recalculate for the visible rows. Opt out: data-nofilter.
   Loaded by bb-shell.js. Exposes BB.tableFilters.
   ============================================================ */
(function () {
  "use strict";
  var esc = BB.esc;
  var FUNNEL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></svg>';
  var page = (location.pathname.split('/').pop() || 'index.html');
  var SKEY = 'bb_tf:' + page;
  var STATE = (function () { try { return JSON.parse(sessionStorage.getItem(SKEY)) || {}; } catch (e) { return {}; } })();
  function saveState() { try { sessionStorage.setItem(SKEY, JSON.stringify(STATE, function (k, v) { return v instanceof Set ? { __set: Array.from(v) } : v; })); } catch (e) {} }
  // revive Sets
  Object.keys(STATE).forEach(function (k) { var f = STATE[k].f || {}; Object.keys(f).forEach(function (c) { if (f[c] && f[c].set && f[c].set.__set) f[c].set = new Set(f[c].set.__set); }); });

  var TEXT_OPS = [[['', 'Any']], [['contains', 'Contains'], ['ncontains', 'Does Not Contain']], [['eq', 'Equals'], ['neq', 'Does Not Equal']], [['starts', 'Starts With'], ['ends', 'Ends With']], [['empty', 'Is Empty'], ['nempty', 'Is Not Empty']]];
  var NUM_OPS = [[['', 'Any']], [['eq', '='], ['neq', '≠']], [['gt', '>'], ['gte', '≥'], ['lt', '<'], ['lte', '≤'], ['between', 'a – b']], [['top', 'Top N'], ['bottom', 'Bottom N'], ['above', 'Above avg'], ['below', 'Below avg']]];
  var DATE_OPS = [[['', 'Any']], [['on', 'On'], ['non', 'Not On']], [['after', 'After'], ['onafter', 'On or After'], ['before', 'Before'], ['onbefore', 'On or Before'], ['between', 'Between']], [['empty', 'Is Empty'], ['nempty', 'Is Not Empty']]];
  function opsFor(t) { return t === 'number' ? NUM_OPS : t === 'date' ? DATE_OPS : TEXT_OPS; }
  function opLabel(groups, v) { for (var i = 0; i < groups.length; i++) for (var j = 0; j < groups[i].length; j++) if (groups[i][j][0] === v) return groups[i][j][1]; return 'Any'; }
  function opMenuHTML(groups) { return groups.map(function (g) { return g.map(function (o) { return '<div class="cf-opopt" data-v="' + esc(o[0]) + '">' + esc(o[1]) + '</div>'; }).join(''); }).join('<div class="cf-opsep"></div>'); }
  function needsValue(op) { return !!op && ['empty', 'nempty', 'above', 'below'].indexOf(op) < 0; }

  // ---- reading cells ----------------------------------------------------------------------------
  var MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
  function parseNum(s) {
    s = String(s || '').replace(/−/g, '-').trim(); if (!s) return null;
    var m = s.match(/^[~≈]?\s*(-?)\s*R?\s*(-?[\d][\d\s ,]*(?:\.\d+)?)\s*(%|k|m|l|kg|ha|t|days?|units?|x)?\b/i);
    if (!m) return null;
    if (/[a-z]{3,}/i.test(s.slice(m[0].length).trim().split(/\s+/)[0] || '') && s.slice(m[0].length).trim().length > 12) return null; // a number followed by a sentence isn't a figure
    var n = parseFloat(m[2].replace(/[\s ,]/g, '')); if (!isFinite(n)) return null;
    if (m[1] === '-') n = -n;
    var u = (m[3] || '').toLowerCase(); if (u === 'k') n *= 1e3; else if (u === 'm' && /R/.test(s)) n *= 1e6;
    return n;
  }
  function parseDate(s) {
    s = String(s || '').trim(); if (!s) return null;
    var m = s.match(/(\d{4})-(\d{2})-(\d{2})/); if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,5})\.?\s*(\d{4})?/); if (m && MON[m[2].toLowerCase()] != null) return Date.UTC(m[3] ? +m[3] : new Date().getFullYear(), MON[m[2].toLowerCase()], +m[1]);
    return null;
  }
  function firstLine(td) { var t = String(td.innerText || td.textContent || ''); var l = t.split('\n').map(function (x) { return x.trim(); }).filter(Boolean)[0] || ''; return l.replace(/\s+/g, ' '); }
  function fullText(td) { return String(td.innerText || td.textContent || '').replace(/\s+/g, ' ').trim(); }

  // ---- attaching ---------------------------------------------------------------------------------
  var TABLES = [];
  function eligible(t) {
    if (t.hasAttribute('data-nofilter') || t.dataset.bbt) return false;
    if (t.closest('#askdock,.bbp,.bbc-table,.bbc,details,.bb-nav,#bbNav,.rail-flyout')) return false;
    if (!t.tHead || !t.tBodies[0]) return false;
    return true;
  }
  function cardTitle(t) { var c = t.closest('.card'); var h = c && c.querySelector('.card-h h3'); return h ? h.textContent.trim() : ''; }
  function headRow(t) { var rs = t.tHead.rows; return rs[rs.length - 1]; }
  function readRows(T) {
    var n = T.ncols, rows = [], cur = null;
    [].slice.call(T.el.tBodies[0].rows).forEach(function (tr) {
      if (tr.classList.contains('bbt-skel') || tr.classList.contains('ln-sizer')) return;
      var spans = [].slice.call(tr.cells).some(function (c) { return c.colSpan > 1; });
      var isKid = cur && (tr.cells.length < n && spans);
      if (isKid) { cur.kids.push(tr); return; }
      if (tr.cells.length === 1 && tr.cells[0].colSpan >= n - 1 && !cur) { return; }   // an empty-state row
      cur = { tr: tr, kids: [], idx: rows.length, v: [], full: [] };
      for (var i = 0; i < n; i++) { var td = tr.cells[i]; cur.v.push(td ? firstLine(td) : ''); cur.full.push(td ? fullText(td) : ''); }
      rows.push(cur);
    });
    T.rows = rows;
  }
  function detectTypes(T) {
    T.cols.forEach(function (c) {
      var vals = T.rows.map(function (r) { return r.v[c.i]; }).filter(function (v) { return v && v !== '—' && v !== '-'; });
      if (!vals.length) { c.type = 'text'; return; }
      var nums = vals.filter(function (v) { return parseNum(v) != null && !/^\d{4}-\d{2}-\d{2}/.test(v) && !parseDate(v); }).length;
      var dates = vals.filter(function (v) { return parseDate(v) != null; }).length;
      c.type = dates / vals.length >= 0.8 ? 'date' : nums / vals.length >= 0.8 ? 'number' : 'text';
    });
  }
  function attach(t) {
    if (!eligible(t)) return null;
    var hr = headRow(t), ths = [].slice.call(hr.cells);
    var T = { el: t, ths: ths, ncols: ths.length, cols: [] };
    ths.forEach(function (th, i) { var lbl = th.textContent.replace(/\s+/g, ' ').trim(); if (lbl && th.colSpan === 1) T.cols.push({ i: i, label: lbl }); });
    readRows(T);
    if (T.rows.length < 2 || !T.cols.length) return null;
    t.dataset.bbt = '1';
    T.key = cardTitle(t) + '|' + T.cols.map(function (c) { return c.label; }).join('|');
    if (!STATE[T.key]) STATE[T.key] = { f: {}, sort: null };
    T.st = STATE[T.key];
    detectTypes(T);
    // lock widths to the full data before anything is filtered out
    ths.forEach(function (th) { th.style.minWidth = Math.ceil(th.getBoundingClientRect().width) + 'px'; });
    T.cols.forEach(function (c) {
      var th = ths[c.i]; if (th.querySelector('.th-filter')) return;
      var label = th.innerHTML;
      th.innerHTML = '<span class="th-inner' + (th.classList.contains('num') ? ' num' : '') + '"><span class="th-label">' + label + '</span><button type="button" class="th-filter" aria-label="Filter ' + esc(c.label) + '" data-c="' + c.i + '">' + FUNNEL + '</button></span>';
      th.querySelector('.th-filter').addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); openMenu(T, c, e.currentTarget); });
    });
    // totals rows: remember which figures are sums of the column, so they can follow the filter
    T.foot = [];
    if (t.tFoot) [].slice.call(t.tFoot.rows).forEach(function (tr) {
      var colAt = 0;
      [].slice.call(tr.cells).forEach(function (td) {
        var i = colAt; colAt += td.colSpan || 1;
        var n = parseNum(firstLine(td)); var col = T.cols.filter(function (c) { return c.i === i; })[0];
        var entry = { td: td, html: td.innerHTML, text: firstLine(td) };
        if (n != null && col && col.type === 'number' && td.colSpan === 1) {
          var sum = T.rows.reduce(function (a, r) { return a + (parseNum(r.v[i]) || 0); }, 0);
          if (Math.abs(sum - n) <= Math.max(1, Math.abs(n) * 0.005)) { entry.sumCol = i; entry.money = /R/.test(entry.text); entry.suffix = (entry.text.match(/[a-z%]+$/i) || [''])[0]; }
        }
        var cm = entry.text.match(/(\d+)\s+([a-z]+)/i);
        if (cm && +cm[1] === T.rows.length) entry.countRe = true;
        T.foot.push(entry);
      });
    });
    // full height: the page scrolls, never the table. Headers stick under the top bar only when the
    // page is the scroller; inside a sideways-scrolling wrapper they stick to the wrapper's top.
    var wrap = t.parentElement;
    if (wrap && wrap.classList.contains('scroll')) {
      wrap.classList.remove('tall');
      if (wrap.scrollWidth <= wrap.clientWidth + 1) wrap.classList.add('bbt-fit');
    }
    var p = t.parentElement, pageScrolls = true;
    while (p && p !== document.body) { var cs = getComputedStyle(p); if (/(auto|scroll|hidden)/.test(cs.overflowX + cs.overflowY)) { pageScrolls = false; break; } p = p.parentElement; }
    t.classList.toggle('bbt-sticky', pageScrolls);
    TABLES.push(T);
    apply(T);
    return T;
  }

  // ---- filtering ---------------------------------------------------------------------------------
  function matchText(val, op, q) {
    var V = String(val || '').toLowerCase(), Q = String(q == null ? '' : q).toLowerCase();
    switch (op) { case 'contains': return V.indexOf(Q) >= 0; case 'ncontains': return V.indexOf(Q) < 0; case 'eq': return V === Q; case 'neq': return V !== Q;
      case 'starts': return V.indexOf(Q) === 0; case 'ends': return V.slice(-Q.length) === Q; case 'empty': return !V.trim() || V === '—'; case 'nempty': return !!V.trim() && V !== '—'; }
    return true;
  }
  function matchNum(n, op, a, b) {
    a = parseFloat(a); b = parseFloat(b); if (n == null) return op === 'neq';
    switch (op) { case 'eq': return n === a; case 'neq': return n !== a; case 'gt': return n > a; case 'gte': return n >= a; case 'lt': return n < a; case 'lte': return n <= a; case 'between': return n >= Math.min(a, b) && n <= Math.max(a, b); }
    return true;
  }
  function matchDate(d, op, a, b, raw) {
    if (op === 'empty') return d == null && (!raw || raw === '—'); if (op === 'nempty') return d != null;
    var A = parseDate(a), B = parseDate(b); if (d == null) return false;
    switch (op) { case 'on': return d === A; case 'non': return d !== A; case 'after': return d > A; case 'onafter': return d >= A; case 'before': return d < A; case 'onbefore': return d <= A;
      case 'between': return d >= Math.min(A, B) && d <= Math.max(A, B); }
    return true;
  }
  function colStats(T, i) { var v = T.rows.map(function (r) { return parseNum(r.v[i]); }).filter(function (x) { return x != null; }).sort(function (a, b) { return a - b; });
    return { vals: v, mean: v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : 0 }; }
  function passes(T, r) {
    var f = T.st.f;
    for (var k in f) {
      var c = T.cols.filter(function (x) { return String(x.i) === String(k); })[0], F = f[k]; if (!c || !F) continue;
      var raw = r.v[c.i], val = raw || '(Blank)';
      if (F.kind === 'in') { if (!F.set.has(raw && raw !== '—' ? raw : '(Blank)')) return false; continue; }
      if (F.kind !== 'cond' || !F.op) continue;
      if (needsValue(F.op) && String(F.v1 || '') === '') continue;
      if (F.op === 'between' && String(F.v2 || '') === '') continue;
      if (c.type === 'number') {
        var n = parseNum(raw), S = colStats(T, c.i);
        if (F.op === 'above') { if (!(n > S.mean)) return false; }
        else if (F.op === 'below') { if (!(n < S.mean)) return false; }
        else if (F.op === 'top' || F.op === 'bottom') { var N = parseInt(F.v1, 10) || 10; if (!S.vals.length || n == null) return false;
          if (F.op === 'top' ? !(n >= S.vals[Math.max(0, S.vals.length - N)]) : !(n <= S.vals[Math.min(S.vals.length - 1, N - 1)])) return false; }
        else if (!matchNum(n, F.op, F.v1, F.v2)) return false;
      } else if (c.type === 'date') { if (!matchDate(parseDate(raw), F.op, F.v1, F.v2, raw)) return false; }
      else if (!matchText(r.full[c.i], F.op, F.v1)) return false;
    }
    return true;
  }
  function sortKey(T, r, c) { var v = r.v[c.i]; if (c.type === 'number') { var n = parseNum(v); return n == null ? -Infinity : n; } if (c.type === 'date') { var d = parseDate(v); return d == null ? -Infinity : d; } return String(v || '').toLowerCase(); }
  var applying = false;
  function apply(T) {
    applying = true;
    try {
      var tb = T.el.tBodies[0]; if (!tb) return;
      [].slice.call(tb.querySelectorAll('tr.bbt-skel')).forEach(function (x) { x.remove(); });
      var shown = 0, order = T.rows.slice();
      if (T.st.sort) { var c = T.cols.filter(function (x) { return x.i === T.st.sort.i; })[0];
        if (c) order.sort(function (a, b) { var A = sortKey(T, a, c), B = sortKey(T, b, c); var r = A < B ? -1 : A > B ? 1 : a.idx - b.idx; return T.st.sort.dir === 'desc' ? -r : r; }); }
      order.forEach(function (r) {
        var ok = passes(T, r);
        if (ok) { shown++; if (r.tr.style.display === 'none' && r.tr.dataset.bbtHid) { r.tr.style.display = ''; delete r.tr.dataset.bbtHid; }
          r.kids.forEach(function (k) { if (k.dataset.bbtHid) { k.style.display = k.dataset.bbtWas || ''; delete k.dataset.bbtHid; delete k.dataset.bbtWas; } }); }
        else { if (!r.tr.dataset.bbtHid) { r.tr.dataset.bbtHid = '1'; r.tr.style.display = 'none'; }
          r.kids.forEach(function (k) { if (!k.dataset.bbtHid) { k.dataset.bbtHid = '1'; k.dataset.bbtWas = k.style.display || ''; k.style.display = 'none'; } }); }
        if (T.st.sort) { tb.appendChild(r.tr); r.kids.forEach(function (k) { tb.appendChild(k); }); }
      });
      if (!T.st.sort && T.wasSorted) order.forEach(function (r) { tb.appendChild(r.tr); r.kids.forEach(function (k) { tb.appendChild(k); }); });
      T.wasSorted = !!T.st.sort;
      if (!shown) for (var s = 0; s < 2; s++) { var sk = document.createElement('tr'); sk.className = 'bbt-skel'; sk.innerHTML = T.ths.map(function () { return '<td><i></i></td>'; }).join(''); tb.appendChild(sk); }
      // funnels light up when their column is filtered or sorted
      T.cols.forEach(function (c) { var b = T.ths[c.i].querySelector('.th-filter'); if (b) b.classList.toggle('active', !!T.st.f[c.i] || !!(T.st.sort && T.st.sort.i === c.i)); });
      // totals follow the visible rows
      var filtered = Object.keys(T.st.f).length > 0, vis = T.rows.filter(function (r) { return !r.tr.dataset.bbtHid; });
      T.foot.forEach(function (e) {
        if (!filtered) { if (e.changed) { e.td.innerHTML = e.html; e.changed = false; } return; }
        if (e.sumCol != null) { var sum = vis.reduce(function (a, r) { return a + (parseNum(r.v[e.sumCol]) || 0); }, 0);
          e.td.innerHTML = (e.money ? BB.money(sum) : BB.num(Math.round(sum * 100) / 100)) + (e.suffix && !e.money ? ' ' + e.suffix : ''); e.changed = true; }
        else if (e.countRe) { e.td.innerHTML = esc(e.text.replace(/(\d+)(\s+[a-z]+)/i, vis.length + '$2')); e.changed = true; }
      });
      info(T, shown, filtered);
    } finally { setTimeout(function () { applying = false; }, 0); }
  }
  function info(T, shown, filtered) {
    var card = T.el.closest('.card'), host = card && card.querySelector('.card-h'), el = T.info;
    if (!filtered && !T.st.sort) { if (el) { el.remove(); T.info = null; } return; }
    if (!el) { el = document.createElement('span'); el.className = 'bbt-info'; T.info = el;
      if (host) host.appendChild(el); else T.el.parentElement.parentElement.insertBefore(el, T.el.parentElement);
      el.addEventListener('click', function (e) { if (e.target.closest('[data-clear]')) { T.st.f = {}; T.st.sort = null; saveState(); apply(T); closeMenu(); } }); }
    el.innerHTML = (filtered ? 'Showing <b>' + shown + '</b> of ' + T.rows.length : 'Sorted') + ' · <a href="#" data-clear onclick="return false">Clear ' + (filtered ? 'filters' : 'sort') + '</a>';
  }

  // ---- the menu ----------------------------------------------------------------------------------
  var menu = null, openFor = null;
  function ensureMenu() {
    if (menu) return menu;
    menu = document.createElement('div'); menu.className = 'col-filter-menu'; menu.setAttribute('role', 'dialog'); document.body.appendChild(menu);
    document.addEventListener('click', function (e) {
      if (menu.style.display !== 'block') return;
      if (!menu.contains(e.target) && !e.target.closest('.th-filter')) { closeMenu(); return; }
      if (!e.target.closest('.cf-opsel')) { var om = menu.querySelector('.cf-opmenu.open'); if (om) om.classList.remove('open'); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('scroll', position, true);
    window.addEventListener('resize', position);
    return menu;
  }
  function closeMenu() { if (menu) menu.style.display = 'none'; openFor = null; }
  // Always the bottom-right of the funnel (9five rule). Phones only keep it on screen.
  function position() {
    if (!menu || menu.style.display !== 'block' || !openFor) return;
    var b = openFor.T.ths[openFor.c.i] && openFor.T.ths[openFor.c.i].querySelector('.th-filter'); if (!b || !document.contains(b)) { closeMenu(); return; }
    var r = b.getBoundingClientRect(), left = r.right - menu.offsetWidth;
    if (window.innerWidth < 600) left = Math.max(8, Math.min(left, window.innerWidth - menu.offsetWidth - 8));
    menu.style.left = left + 'px'; menu.style.top = (r.bottom + 4) + 'px';
  }
  function openMenu(T, c, btn) {
    var m = ensureMenu();
    if (openFor && openFor.T === T && openFor.c === c && m.style.display === 'block') { closeMenu(); return; }
    var ops = opsFor(c.type), F = T.st.f[c.i], cond = F && F.kind === 'cond' ? F : null, inSet = F && F.kind === 'in' ? F.set : null;
    var counts = {}; T.rows.forEach(function (r) { var v = r.v[c.i] && r.v[c.i] !== '—' ? r.v[c.i] : '(Blank)'; counts[v] = (counts[v] || 0) + 1; });
    var vals = Object.keys(counts).sort(function (a, b) {
      if (a === '(Blank)') return 1; if (b === '(Blank)') return -1;
      if (c.type === 'number') return (parseNum(a) || 0) - (parseNum(b) || 0);
      if (c.type === 'date') return (parseDate(a) || 0) - (parseDate(b) || 0);
      return a.localeCompare(b, undefined, { numeric: true }); });
    var cur = cond ? cond.op : '';
    var inType = c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : 'text';
    var sortLbl = c.type === 'number' ? ['Smallest to largest', 'Largest to smallest'] : c.type === 'date' ? ['Oldest to newest', 'Newest to oldest'] : ['Sort A–Z', 'Sort Z–A'];
    m.innerHTML = '<div class="cf-heading">Filter by condition</div>' +
      '<div class="cf-cond"><div class="cf-opsel"><button type="button" class="cf-opbtn"><span class="cf-oplbl">' + esc(opLabel(ops, cur)) + '</span><span class="cf-opcaret">' + BB.icon('chevron') + '</span></button><div class="cf-opmenu">' + opMenuHTML(ops) + '</div></div>' +
      '<div class="cf-vals"><input type="' + inType + '" class="cf-v1" placeholder="' + (c.type === 'number' ? 'Value' : 'Value') + '" value="' + esc(cond ? toInput(c, cond.v1) : '') + '"><input type="' + inType + '" class="cf-v2" placeholder="and" value="' + esc(cond ? toInput(c, cond.v2) : '') + '"></div></div>' +
      '<div class="cf-sep"></div><div class="cf-heading">Filter by value</div>' +
      '<div class="cf-search"><input type="text" class="cf-q" placeholder="Search values…" autocomplete="off"></div>' +
      '<div class="cf-actions"><a href="#" data-all>Select all</a><a href="#" data-none>Clear</a></div>' +
      '<div class="cf-list">' + vals.map(function (v) { return '<label class="cf-item"><input type="checkbox" value="' + esc(v) + '"' + (!inSet || inSet.has(v) ? ' checked' : '') + '><span class="cf-lbl">' + (v === '(Blank)' ? '<i>(Blank)</i>' : esc(v)) + '</span><span class="cf-count">' + counts[v] + '</span></label>'; }).join('') + '</div>' +
      '<div class="cf-sep"></div><button type="button" class="cf-sort" data-dir="asc">↑ ' + sortLbl[0] + '</button><button type="button" class="cf-sort" data-dir="desc">↓ ' + sortLbl[1] + '</button>' +
      (F || (T.st.sort && T.st.sort.i === c.i) ? '<div class="cf-sep"></div><button type="button" class="cf-sort cf-reset">Clear this column</button>' : '');
    openFor = { T: T, c: c };
    m.style.display = 'block'; position();
    var v1 = m.querySelector('.cf-v1'), v2 = m.querySelector('.cf-v2'), opbtn = m.querySelector('.cf-opbtn'), opmenu = m.querySelector('.cf-opmenu'), oplbl = m.querySelector('.cf-oplbl');
    function sync() { v1.style.display = needsValue(cur) ? '' : 'none'; v2.style.display = cur === 'between' ? '' : 'none'; v1.placeholder = (cur === 'top' || cur === 'bottom') ? 'N (10)' : 'Value'; }
    function applyCond() {
      var incomplete = !cur || (needsValue(cur) && !String(v1.value).trim() && cur !== 'top' && cur !== 'bottom') || (cur === 'between' && !String(v2.value).trim());
      if (incomplete) { if (T.st.f[c.i] && T.st.f[c.i].kind === 'cond') delete T.st.f[c.i]; }
      else T.st.f[c.i] = { kind: 'cond', op: cur, v1: fromInput(c, v1.value) || (cur === 'top' || cur === 'bottom' ? '10' : ''), v2: fromInput(c, v2.value) };
      saveState(); apply(T); position();
    }
    sync();
    opbtn.onclick = function (e) { e.stopPropagation(); opmenu.classList.toggle('open'); };
    [].slice.call(opmenu.querySelectorAll('.cf-opopt')).forEach(function (o) { o.onclick = function (e) { e.stopPropagation(); cur = o.getAttribute('data-v'); oplbl.textContent = opLabel(ops, cur); opmenu.classList.remove('open'); sync(); applyCond(); }; });
    v1.oninput = applyCond; v2.oninput = applyCond;
    function applySet() { var boxes = [].slice.call(m.querySelectorAll('.cf-list input')), on = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
      if (on.length === boxes.length) delete T.st.f[c.i]; else T.st.f[c.i] = { kind: 'in', set: new Set(on) }; saveState(); apply(T); position(); }
    [].slice.call(m.querySelectorAll('.cf-list input')).forEach(function (b) { b.onchange = applySet; });
    m.querySelector('.cf-q').oninput = function (e) { var q = e.target.value.toLowerCase(); [].slice.call(m.querySelectorAll('.cf-item')).forEach(function (it) { it.style.display = it.querySelector('input').value.toLowerCase().indexOf(q) >= 0 ? '' : 'none'; }); };
    m.querySelector('[data-all]').onclick = function (e) { e.preventDefault(); [].slice.call(m.querySelectorAll('.cf-item')).forEach(function (it) { if (it.style.display !== 'none') it.querySelector('input').checked = true; }); applySet(); };
    m.querySelector('[data-none]').onclick = function (e) { e.preventDefault(); [].slice.call(m.querySelectorAll('.cf-item')).forEach(function (it) { if (it.style.display !== 'none') it.querySelector('input').checked = false; }); applySet(); };
    [].slice.call(m.querySelectorAll('.cf-sort[data-dir]')).forEach(function (b) { b.onclick = function () { T.st.sort = { i: c.i, dir: b.getAttribute('data-dir') }; saveState(); apply(T); closeMenu(); }; });
    var rs = m.querySelector('.cf-reset'); if (rs) rs.onclick = function () { delete T.st.f[c.i]; if (T.st.sort && T.st.sort.i === c.i) T.st.sort = null; saveState(); apply(T); closeMenu(); };
  }
  // date inputs speak YYYY-MM-DD; the filter keeps that too
  function toInput(c, v) { return v == null ? '' : String(v); }
  function fromInput(c, v) { return String(v || '').trim(); }

  // ---- find tables now and whenever a page redraws one ------------------------------------------------
  function scan() {
    TABLES = TABLES.filter(function (T) { return document.contains(T.el); });
    [].slice.call(document.querySelectorAll('main table.bb, main table.cover, .wrap table.bb')).forEach(function (t) {
      var known = TABLES.filter(function (T) { return T.el === t; })[0];
      if (!known) { attach(t); return; }
      // the page rebuilt the rows inside the same table: read them again and re-apply
      var live = [].slice.call(t.tBodies[0].rows).filter(function (r) { return !r.classList.contains('bbt-skel'); });
      var mains = known.rows.map(function (r) { return r.tr; });
      if (live.some(function (r) { return mains.indexOf(r) < 0 && known.rows.every(function (x) { return x.kids.indexOf(r) < 0; }); }) || mains.some(function (r) { return !t.contains(r); })) {
        readRows(known); detectTypes(known); apply(known);
      }
    });
    position();
  }
  var timer = null;
  new MutationObserver(function () { if (applying) return; clearTimeout(timer); timer = setTimeout(scan, 60); }).observe(document.body, { childList: true, subtree: true });
  scan();
  // ---- for the Ask bar: read and set column filters by table + column name -------------------------
  function find(table) { scan(); var q = String(table == null ? '' : table).toLowerCase(), live = TABLES.filter(function (T) { return document.contains(T.el); });
    return live.filter(function (T, i) { return String(i) === q || cardTitle(T.el).toLowerCase() === q; })[0] || live.filter(function (T) { return cardTitle(T.el).toLowerCase().indexOf(q) >= 0; })[0] || (live.length === 1 ? live[0] : null); }
  function list() {
    scan();
    return TABLES.filter(function (T) { return document.contains(T.el); }).map(function (T, i) {
      var shown = T.rows.filter(function (r) { return !r.tr.dataset.bbtHid; }).length;
      return { table: i, title: cardTitle(T.el) || ('Table ' + (i + 1)), rows: T.rows.length, shown: shown,
        sort: T.st.sort ? { column: (T.cols.filter(function (c) { return c.i === T.st.sort.i; })[0] || {}).label, dir: T.st.sort.dir } : null,
        columns: T.cols.map(function (c) {
          var vals = {}; T.rows.forEach(function (r) { var v = r.v[c.i] && r.v[c.i] !== '—' ? r.v[c.i] : '(Blank)'; vals[v] = (vals[v] || 0) + 1; });
          var keys = Object.keys(vals), F = T.st.f[c.i];
          return { column: c.label, type: c.type, values: c.type === 'text' && keys.length <= 30 ? keys : undefined, distinct: keys.length,
            filter: F ? (F.kind === 'in' ? { values: Array.from(F.set) } : { op: F.op, value: F.v1, value2: F.v2 || undefined }) : undefined };
        }) };
    });
  }
  // spec: {values:[…]} | {op, value, value2} | {sort:'asc'|'desc'} | {clear:true}; column '*' with clear resets the table
  function set(table, column, spec) {
    var T = find(table); if (!T) throw new Error('No table called "' + table + '" on this page.');
    spec = spec || {};
    if (column === '*' && spec.clear) { T.st.f = {}; T.st.sort = null; saveState(); apply(T); return list()[TABLES.indexOf(T)]; }
    var q = String(column || '').toLowerCase(), c = T.cols.filter(function (x) { return x.label.toLowerCase() === q; })[0] || T.cols.filter(function (x) { return x.label.toLowerCase().indexOf(q) >= 0; })[0];
    if (!c) throw new Error('No column "' + column + '". Columns: ' + T.cols.map(function (x) { return x.label; }).join(', '));
    if (spec.clear) { delete T.st.f[c.i]; if (T.st.sort && T.st.sort.i === c.i) T.st.sort = null; }
    else if (spec.sort) T.st.sort = { i: c.i, dir: spec.sort === 'desc' ? 'desc' : 'asc' };
    else if (spec.values) {
      var have = {}; T.rows.forEach(function (r) { have[r.v[c.i] && r.v[c.i] !== '—' ? r.v[c.i] : '(Blank)'] = 1; });
      var keep = Object.keys(have).filter(function (v) { return spec.values.some(function (w) { return String(w).toLowerCase() === v.toLowerCase(); }); });
      // a cell can carry more than its value ("Awaiting stock HOLD"): fall back to starts-with
      if (!keep.length) keep = Object.keys(have).filter(function (v) { return spec.values.some(function (w) { return v.toLowerCase().indexOf(String(w).toLowerCase()) === 0; }); });
      if (!keep.length) throw new Error('None of those values are in "' + c.label + '". Values: ' + Object.keys(have).slice(0, 30).join(', '));
      T.st.f[c.i] = { kind: 'in', set: new Set(keep) };
    } else if (spec.op) {
      var ok = opsFor(c.type).some(function (g) { return g.some(function (o) { return o[0] === spec.op; }); });
      if (!ok) throw new Error('Operator "' + spec.op + '" doesn\'t apply to a ' + c.type + ' column.');
      T.st.f[c.i] = { kind: 'cond', op: spec.op, v1: spec.value == null ? '' : String(spec.value), v2: spec.value2 == null ? '' : String(spec.value2) };
    }
    saveState(); apply(T);
    return list()[TABLES.indexOf(T)];
  }
  BB.tableFilters = { scan: scan, list: list, set: set, clearAll: function () { TABLES.forEach(function (T) { T.st.f = {}; T.st.sort = null; apply(T); }); saveState(); } };
})();
