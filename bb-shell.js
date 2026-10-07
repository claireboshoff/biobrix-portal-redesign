/* ============================================================
   BioBrix Operating System — shared shell (brand, header, nav, helpers)
   Loaded on every app page AFTER guard.js. Exposes window.BB.
   Demo build: 100% client-side. No backend required — works offline.
   Production path (documented): swap BB.data for the n8n data-proxy +
   voice worker, mirroring the SureWay Operations stack.
   ============================================================ */
(function () {
  "use strict";

  // ---- Brand tokens (BioBrix — "The Biological Way") --------------
  var CSS = `

  /* Sample-data marker — nothing fabricated may ever read as the client's own. */
  .bb-sample{display:flex;gap:10px;align-items:flex-start;margin:14px 0 4px;padding:10px 14px;border:1px dashed var(--amber);background:var(--amber-bg);border-radius:10px;color:#6b4708;font-size:.82rem;line-height:1.45;}
  .bb-sample b{font-weight:700;}
  .bb-sample .t{background:var(--amber);color:#fff;border-radius:6px;padding:1px 7px;font-size:.7rem;font-weight:700;letter-spacing:.4px;text-transform:uppercase;flex:none;margin-top:1px;}
  .chip-sample{display:inline-block;background:var(--amber-bg);border:1px dashed var(--amber);color:#6b4708;border-radius:999px;padding:0 7px;font-size:.66rem;font-weight:700;letter-spacing:.3px;text-transform:uppercase;vertical-align:middle;margin-left:6px;}
  a.stat.tap{display:block;text-decoration:none;color:inherit;transition:transform .12s ease,box-shadow .12s ease,border-color .12s ease;}
  a.stat.tap:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(20,41,12,.10);border-color:var(--green-bright);}
  a.stat.tap .s{color:var(--green);font-weight:600;}
  .chip-live{display:inline-block;background:var(--ok-bg);border:1px solid var(--ok);color:var(--ok);border-radius:999px;padding:0 7px;font-size:.66rem;font-weight:700;letter-spacing:.3px;text-transform:uppercase;vertical-align:middle;margin-left:6px;}
  :root{
    --green-darkest:#12210c; --green-dark:#22431a; --green:#3f6b28;
    --green-mid:#43782a; --green-bright:#68a53e; --lime:#b7d97a;
    --bg:#f3f6ee; --panel:#ffffff; --ink:#16240f; --muted:#5d6b52;
    --faint:#8a9880; --line:#e2e8d8; --line-soft:#eef2e7;
    --amber:#c77d17; --amber-bg:#fdf3e0; --red:#c0392b; --red-bg:#fcebe9;
    --blue:#2f6f9e; --blue-bg:#e8f1f8; --ok:#2f8a3f; --ok-bg:#e7f4e9;
    --shadow:0 1px 2px rgba(20,41,12,.05),0 4px 14px rgba(20,41,12,.06);
    --shadow-lg:0 6px 26px rgba(20,41,12,.12);
    --radius:16px; --radius-sm:11px;
    --display:'Space Grotesk',system-ui,sans-serif;
    --body:'Inter',system-ui,-apple-system,sans-serif;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{font-size:16px;-webkit-text-size-adjust:100%;}
  body{font-family:var(--body);background:var(--bg);color:var(--ink);line-height:1.55;
    -webkit-font-smoothing:antialiased;padding-bottom:76px;min-height:100vh;}
  a{color:inherit;text-decoration:none;}
  .wrap{max-width:1160px;margin:0 auto;padding:0 18px;}
  /* Header */
  .bb-head{position:sticky;top:0;z-index:80;background:linear-gradient(112deg,var(--green-darkest),var(--green-dark) 55%,var(--green-mid));
    color:#f2f7ea;box-shadow:0 2px 14px rgba(18,33,12,.28);}
  .bb-head-in{max-width:1160px;margin:0 auto;padding:11px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .bb-brand{display:flex;align-items:center;gap:11px;min-width:0;}
  .bb-mark{width:38px;height:38px;border-radius:11px;flex:none;background:linear-gradient(140deg,var(--green-bright),var(--lime));
    display:flex;align-items:center;justify-content:center;font-family:var(--display);font-weight:700;color:#13260c;font-size:1.15rem;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.25);}
  .bb-word{font-family:var(--display);font-weight:700;font-size:1.12rem;letter-spacing:.3px;line-height:1;}
  .bb-word b{font-weight:700;} .bb-word .os{color:var(--lime);font-weight:500;}
  .bb-sub{font-size:.6rem;letter-spacing:2.4px;text-transform:uppercase;opacity:.72;margin-top:3px;}
  .bb-user{display:flex;align-items:center;gap:10px;text-align:right;}
  .bb-user .nm{font-weight:600;font-size:.86rem;line-height:1.1;}
  .bb-user .rl{font-size:.64rem;opacity:.8;text-transform:uppercase;letter-spacing:.5px;}
  .bb-av{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.16);border:1.5px solid rgba(255,255,255,.32);
    display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;flex:none;}
  .bb-back{color:#dfeccb;font-size:.8rem;display:inline-flex;align-items:center;gap:5px;opacity:.9;}
  /* Scope band (advisor / depot seats) */
  .bb-scope{display:flex;align-items:center;justify-content:center;gap:8px;font-size:.72rem;letter-spacing:.2px;padding:6px 14px;background:rgba(255,255,255,.10);color:#eaf4d8;border-top:1px solid rgba(255,255,255,.08);}
  .bb-scope b{font-weight:700;} .bb-scope .dot{width:8px;height:8px;border-radius:50%;flex:none;box-shadow:0 0 0 2px rgba(255,255,255,.25);}
  /* Offline / sync banner */
  .bb-sync{display:none;align-items:center;gap:9px;justify-content:center;font-size:.78rem;font-weight:600;padding:7px 14px;color:#fff;}
  .bb-sync.off{display:flex;background:#8a6d1f;} .bb-sync.syncing{display:flex;background:var(--blue);}
  .bb-sync .dot{width:8px;height:8px;border-radius:50%;background:#fff;animation:bbpulse 1.1s infinite;}
  @keyframes bbpulse{0%,100%{opacity:.35}50%{opacity:1}}
  /* Page head */
  .page-head{padding:22px 0 8px;}
  .page-head h1{font-family:var(--display);font-size:1.5rem;font-weight:600;color:var(--green-dark);letter-spacing:-.2px;}
  .page-head p{color:var(--muted);font-size:.9rem;margin-top:2px;max-width:640px;}
  .eyebrow{font-size:.66rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--green-bright);}
  /* Cards */
  .card{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);}
  .card-p{padding:18px;}
  .grid{display:grid;gap:14px;}
  .g2{grid-template-columns:repeat(2,1fr);} .g3{grid-template-columns:repeat(3,1fr);} .g4{grid-template-columns:repeat(4,1fr);}
  @media(max-width:860px){.g3,.g4{grid-template-columns:repeat(2,1fr);}}
  @media(max-width:560px){.g2,.g3,.g4{grid-template-columns:1fr;}}
  /* A <select> sizes itself to its widest option. With 300+ real customer names in the list that
     is ~900px, which pushed the whole page sideways on a phone. Never let a control exceed its box. */
  select, input, textarea, .selbar{max-width:100%;}
  select{text-overflow:ellipsis;}
  .row, .selbar{min-width:0;}

  /* ---- Phone (this is a field tool; most of its use is on a phone) ---------------- */
  @media(max-width:480px){
    /* the header was wrapping to three lines and eating a third of the screen */
    .bb-head-in{padding:9px 14px;gap:8px;}
    .bb-mark{width:32px;height:32px;border-radius:9px;font-size:1rem;}
    .bb-word{font-size:1rem;white-space:nowrap;}
    .bb-sub{display:none;}                      /* the tagline belongs on the sign-in screen, not on every page */
    .bb-user .rl{display:none;}
    .bb-user .nm{font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:38vw;}
    .bb-user{gap:8px;}
    .bb-av{width:30px;height:30px;font-size:.72rem;}
    .bb-back{white-space:nowrap;font-size:.8rem;}
    /* section headings were colliding with their captions */
    .sec{flex-wrap:wrap;gap:4px 10px;margin:22px 0 10px;}
    .sec h2{font-size:1rem;flex:1 1 auto;}
    .sec .ln{display:none;}
    .sec .cnt{flex:1 1 100%;order:3;font-size:.7rem;line-height:1.35;}
    .page-head h1{font-size:1.28rem;}
    .page-head p{font-size:.86rem;}
    .stat .v{font-size:1.32rem;}
    .bb-sample{font-size:.78rem;padding:9px 11px;gap:8px;}
    .btn.sm{padding:5px 9px;}
    /* An action group marked flex:none cannot shrink, so on a narrow screen it pushes the whole
       page sideways. On a phone every row may wrap and nothing is allowed to exceed the screen. */
    .row > *{min-width:0;max-width:100%;}
    .row [style*="flex:none"], .row [style*="flex: none"]{flex:0 1 auto !important;}
    .card, .card-p, main.wrap, .stat{max-width:100%;}
    .btn{white-space:nowrap;}
  }
  /* Tiles (home / hubs) */
  .tile{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:18px;box-shadow:var(--shadow);
    display:block;transition:.16s;position:relative;overflow:hidden;}
  .tile:hover{border-color:var(--green-bright);box-shadow:var(--shadow-lg);transform:translateY(-2px);}
  .tile .ic{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:13px;font-size:1.3rem;background:var(--green-darkest);color:var(--lime);}
  .tile h3{font-family:var(--display);font-weight:600;font-size:1.02rem;color:var(--green-dark);}
  .tile p{font-size:.8rem;color:var(--muted);margin-top:3px;line-height:1.5;}
  .tile .meta{margin-top:11px;font-size:.72rem;color:var(--faint);display:flex;gap:12px;flex-wrap:wrap;}
  .tile .meta b{color:var(--green-mid);}
  /* Stat */
  .stat{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--green-bright);border-radius:var(--radius-sm);padding:14px 15px;box-shadow:var(--shadow);}
  .stat .l{font-size:.64rem;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--faint);}
  .stat .v{font-family:var(--display);font-size:1.5rem;font-weight:600;color:var(--green-dark);margin-top:2px;line-height:1.1;}
  .stat .s{font-size:.72rem;color:var(--muted);}
  .stat.warn{border-left-color:var(--amber);} .stat.warn .v{color:var(--amber);}
  .stat.bad{border-left-color:var(--red);} .stat.bad .v{color:var(--red);}
  /* Section title */
  .sec{display:flex;align-items:center;gap:12px;margin:26px 0 14px;}
  .sec h2{font-family:var(--display);font-size:1.06rem;font-weight:600;color:var(--green-dark);}
  .sec .ln{flex:1;height:1px;background:var(--line);}
  .sec .cnt{font-size:.72rem;color:var(--faint);}
  /* Badge / pill */
  .badge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:.68rem;font-weight:700;letter-spacing:.2px;}
  .b-ok{background:var(--ok-bg);color:var(--ok);} .b-warn{background:var(--amber-bg);color:var(--amber);}
  .b-bad{background:var(--red-bg);color:var(--red);} .b-blue{background:var(--blue-bg);color:var(--blue);}
  .b-grey{background:#eef1ea;color:var(--muted);} .b-lime{background:#eef6dc;color:var(--green-mid);}
  /* Buttons */
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;font-family:var(--body);font-weight:600;font-size:.9rem;
    padding:11px 18px;border-radius:11px;border:1.5px solid transparent;cursor:pointer;transition:.15s;background:var(--green-mid);color:#fff;}
  .btn:hover{background:var(--green-dark);} .btn:disabled{opacity:.5;cursor:not-allowed;}
  .btn.ghost{background:transparent;border-color:var(--line);color:var(--green-dark);} .btn.ghost:hover{border-color:var(--green-bright);background:#f5f9ee;}
  .btn.lime{background:var(--lime);color:#1b2f10;} .btn.lime:hover{background:#a9cf68;}
  .btn.sm{padding:7px 12px;font-size:.8rem;border-radius:9px;} .btn.block{width:100%;}
  /* Tables */
  table.bb{width:100%;border-collapse:collapse;font-size:.85rem;}
  table.bb th{text-align:left;font-size:.66rem;text-transform:uppercase;letter-spacing:.6px;color:var(--faint);font-weight:700;padding:9px 12px;border-bottom:1px solid var(--line);}
  table.bb td{padding:11px 12px;border-bottom:1px solid var(--line-soft);vertical-align:middle;}
  table.bb tr:last-child td{border-bottom:none;}
  table.bb tr.click{cursor:pointer;} table.bb tr.click:hover td{background:#f5f9ee;}
  .scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}
  /* Forms */
  .fld{margin-bottom:13px;} .fld label{display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:5px;}
  .fld input,.fld select,.fld textarea{width:100%;padding:11px 13px;font-family:inherit;font-size:.95rem;border:1.5px solid var(--line);border-radius:10px;outline:none;background:#fff;color:var(--ink);transition:.15s;}
  .fld input:focus,.fld select:focus,.fld textarea:focus{border-color:var(--green-bright);}
  /* Bottom nav */
  .bb-nav{position:fixed;bottom:0;left:0;right:0;z-index:90;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);border-top:1px solid var(--line);
    display:flex;justify-content:space-around;padding:6px 4px calc(6px + env(safe-area-inset-bottom));}
  .bb-nav a{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 2px;color:var(--faint);font-size:.6rem;font-weight:600;letter-spacing:.2px;}
  .bb-nav a .ni{font-size:1.15rem;line-height:1;}
  .bb-nav a.on{color:var(--green-mid);} .bb-nav a.on .ni{transform:translateY(-1px);}
  /* Misc */
  .muted{color:var(--muted);} .faint{color:var(--faint);} .right{text-align:right;} .center{text-align:center;}
  .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;} .between{justify-content:space-between;}
  .chip{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;background:#eef2e7;font-size:.76rem;font-weight:600;color:var(--green-dark);border:1px solid var(--line);}
  .chip.on{background:var(--green-dark);color:#eaf4d8;border-color:var(--green-dark);}
  .empty{text-align:center;padding:40px 20px;color:var(--faint);} .empty .big{font-size:2rem;margin-bottom:8px;}
  .toast{position:fixed;left:50%;bottom:86px;transform:translateX(-50%) translateY(20px);background:var(--green-dark);color:#fff;padding:12px 20px;border-radius:12px;font-size:.86rem;font-weight:600;box-shadow:var(--shadow-lg);opacity:0;pointer-events:none;transition:.25s;z-index:200;max-width:90vw;text-align:center;}
  .toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
  .divider{height:1px;background:var(--line);margin:16px 0;}
  .hero-band{background:linear-gradient(112deg,var(--green-darkest),var(--green-dark));color:#eaf4d8;border-radius:var(--radius);padding:20px 22px;box-shadow:var(--shadow);}
  `;

  // ---- escape ---------------------------------------------------
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  // ---- header + bottom nav rendering ----------------------------
  var HOME = { id:'home', href:'index.html', icon:'◆', label:'Home' };
  // Each seat gets a nav tailored to its job — so the seats genuinely differ.
  var NAVS = {
    director: [ HOME,
      { id:'sales', href:'orders.html',      icon:'▲', label:'Sales' },
      { id:'ops',   href:'operations.html',  icon:'⬡', label:'Ops' },
      { id:'tech',  href:'bioservices.html', icon:'✦', label:'BioServices' },
      { id:'voice', href:'voice-order.html', icon:'🎙', label:'Capture' } ],
    advisor: [ HOME,
      { id:'voice', href:'voice-order.html', icon:'🎙', label:'Capture' },
      { id:'tech',  href:'bioservices.html', icon:'✦', label:'BioServices' },
      { id:'farms', href:'farms.html',       icon:'🌾', label:'Farms' },
      { id:'intel', href:'intelligence.html',icon:'✦', label:'Insights' } ],
    operations: [ HOME,
      { id:'sales', href:'orders.html',      icon:'📋', label:'Orders' },
      { id:'ops',   href:'operations.html',  icon:'⬡', label:'Board' },
      { id:'stock', href:'stock.html',       icon:'📦', label:'Stock' },
      { id:'sup',   href:'suppliers.html',   icon:'🔗', label:'Suppliers' } ],
    finance: [ HOME,
      { id:'finance', href:'finance.html',      icon:'🧾', label:'Finance' },
      { id:'sales', href:'orders.html',        icon:'📋', label:'Orders' },
      { id:'ops',   href:'operations.html',    icon:'⬡', label:'Board' },
      { id:'jobs',  href:'jobs.html',          icon:'✉', label:'Jobs' } ],
    farmer: [
      { id:'home',   href:'client-portal.html',          icon:'🌾', label:'My farm' },
      { id:'orders', href:'client-portal.html#orders',   icon:'📦', label:'Orders' },
      { id:'account',href:'client-portal.html#account',  icon:'🧾', label:'Account' },
      { id:'docs',   href:'client-portal.html#docs',     icon:'🗂', label:'Documents' } ],
    warehouse: [ HOME,
      { id:'dispatch', href:'dispatch.html', icon:'📦', label:'Moving' },
      { id:'stock', href:'stock.html',       icon:'📦', label:'Stock' },
      { id:'depots',href:'depots.html',      icon:'🏭', label:'Depots' },
      { id:'deliveries', href:'deliveries.html', icon:'🚚', label:'Deliveries' },
      { id:'labels',href:'labels.html',      icon:'🏷', label:'Labels' } ]
  };

  function initials(name){return String(name||'?').split(/\s+/).map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();}

  function renderHeader(opts){
    opts = opts || {};
    var u = (window.BB && BB.user) || { name:'BioBrix', role:'—' };
    var back = opts.back ? '<a class="bb-back" href="'+esc(opts.back)+'">‹ Back</a>' : '';
    var head =
    '<header class="bb-head">'+
      '<div class="bb-head-in">'+
        '<div class="bb-brand">'+
          (opts.back ? back : '<div class="bb-mark">B</div>')+
          '<div>'+
            '<div class="bb-word"><b>BIOBRIX</b> <span class="os">OS</span></div>'+
            '<div class="bb-sub">'+esc(opts.sub||'The Biological Way')+'</div>'+
          '</div>'+
        '</div>'+
        '<div class="bb-user">'+
          '<div><div class="nm">'+esc(u.name)+'</div><div class="rl">'+esc(u.role)+'</div></div>'+
          '<a class="bb-av" href="login.html" title="Switch seat / sign out">'+initials(u.name)+'</a>'+
        '</div>'+
      '</div>'+
      '<div class="bb-sync" id="bbSync"></div>'+
    '</header>';

    // role-aware nav: each seat gets its own tailored set
    var rk = (window.BB.user && window.BB.user.roleKey) || 'director';
    var navItems = NAVS[rk] || NAVS.director;
    // The bar at the bottom is the most-used way around the app — it must obey the same rules as
    // everything else, or it quietly offers a client the sections built on sample data.
    try{
      if(window.BB.auth && typeof BB.auth.can === 'function'){
        var canGo = (typeof BB.auth.canPage === 'function') ? BB.auth.canPage : function(){ return true; };
        var swapped = navItems.filter(function(n){ return n.id==='home' || canGo(n.href); });
        // keep the bar useful: fill the gaps with what this person actually has
        var spares = [
          { id:'finance',     href:'finance.html',       icon:'▤', label:'Finance' },
          { id:'salesreport', href:'sales-report.html',  icon:'▲', label:'Sales' },
          { id:'plan',        href:'forecast-plan.html', icon:'◎', label:'Forecast' },
          { id:'farms',       href:'farms.html',         icon:'🌾', label:'Customers' },
          { id:'ops',         href:'operations.html',    icon:'⬡', label:'Board' },
          { id:'dispatch',    href:'dispatch.html',      icon:'📦', label:'Moving' },
          { id:'commission',  href:'commission.html',    icon:'◈', label:'Commission' },
          { id:'jobs',        href:'jobs.html',          icon:'✉', label:'Jobs' }
        ];
        spares.forEach(function(sp){
          if(swapped.length>=5) return;
          if(!canGo(sp.href)) return;
          if(swapped.some(function(n){ return n.id===sp.id; })) return;
          swapped.push(sp);
        });
        if(swapped.length>1) navItems = swapped.slice(0,5);
      }
    }catch(e){}
    var nav = '<nav class="bb-nav">'+ navItems.map(function(n){
      return '<a href="'+n.href+'" class="'+(opts.active===n.id?'on':'')+'"><span class="ni">'+n.icon+'</span>'+n.label+'</a>';
    }).join('') +'</nav>';

    // scope band — makes it unmistakable whose view this is (advisor / depot seats)
    var sc = (window.BB.data && BB.data.scope) ? BB.data.scope() : null;
    if(sc){
      var band='';
      if(sc.rep){ var rr=BB.data.rep(sc.rep);
        // Say what this seat actually holds. On their own figures it is accounts, sales and the
        // plan; before that it is the portal's own farmers, orders and farm files.
        var rWhat = sageLive() ? 'your accounts, your sales and the plan \u2014 nobody else\u2019s'
                               : 'your farmers, orders, forecast and farm files only';
        band='<div class="bb-scope"><span class="dot" style="background:'+esc(rr.colour||'#68a53e')+';"></span><b>'+esc((u.name||'').split(' ')[0])+'\u2019s view</b> \u00b7 '+esc(rr.region||'')+' \u00b7 '+rWhat+'</div>'; }
      else if(sc.farmer){ var ff=BB.data.farmer(sc.farmer); band='<div class="bb-scope"><span class="dot" style="background:var(--lime);"></span><b>'+esc(ff.farm||'My farm')+'</b> · your farm, your orders, your account — nothing else</div>'; }
      else if(sc.depot){ var dd=BB.data.depot(sc.depot);
        // What a depot seat holds depends on whether the business is live: on its own figures it is
        // product movement, before that it is the portal's own stock and deliveries.
        var dWhat = sageLive() ? 'what is going out, and jobs \u2014 no customer accounts'
                               : 'your stock, deliveries, blending and labels only';
        band='<div class="bb-scope"><span class="dot" style="background:var(--lime);"></span><b>'+esc(dd.name||'Depot')+' view</b> \u00b7 '+dWhat+'</div>'; }
      head = head.replace('<div class="bb-sync" id="bbSync"></div>', band+'<div class="bb-sync" id="bbSync"></div>');
    }
    document.body.insertAdjacentHTML('afterbegin', head);
    document.body.insertAdjacentHTML('beforeend', nav);
    refreshSync();
    setTimeout(markSamplePage, 0);
  }


  // ---- What is real, and what is still sample --------------------
  // Only these came out of the accounting system. Every other section is still seeded
  // demonstration data, and must SAY so on screen — a client must never mistake our
  // sample farms and orders for their own records.
  var LIVE_TABLES = ['farmers','invoices','payments'];
  var SAMPLE_PAGES = {
    'orders.html':'orders','voice-order.html':'captured orders','forecast.html':'the sales forecast',
    'territory.html':'territory potential','stock.html':'stock levels','depots.html':'depots',
    'suppliers.html':'suppliers','deliveries.html':'deliveries','operations.html':'the operations board',
    'products-library.html':'the product library','bioservices.html':'BioServices','farm-files.html':'farm files',
    'biowatch.html':'BioWatch visits','bioconsult.html':'BioConsult programmes','bioanalyze-soil.html':'soil results',
    'bioanalyze-leaf.html':'leaf results','labels.html':'labels','team.html':'the team feed','jobs.html':'jobs',
    'client-portal.html':'the farmer view','intelligence.html':'the farm health scores, and the stock and sample alerts'
  };
  // How old is the accounting data, and is the connection currently failing? A figure that is
  // silently stale is worse than no figure — say it on the page, everywhere it is shown.
  function sageAge(){
    try{
      var sg = BB.data.sage && BB.data.sage(); if(!sg || !sg.live) return null;
      var m = sg.meta||{}; if(!m.last) return null;
      var hrs = Math.round((Date.now() - new Date(m.last).getTime())/3600000);
      return { hours:hrs, days:Math.floor(hrs/24), failing:!!m.lastError, fails:m.consecutiveErrors||0,
               stale: hrs > 26, lastSast:m.lastSast, next:m.next };
    }catch(e){ return null; }
  }
  function staleNote(){
    var a = sageAge(); if(!a || (!a.stale && !a.failing)) return '';
    var howOld = a.days>=1 ? (a.days+(a.days===1?' day':' days')+' old') : (a.hours+' hours old');
    return '<div class="bb-sample" style="border-color:var(--red);background:var(--red-bg);color:#7a1d15;">'+
      '<span class="t" style="background:var(--red);">Check</span><div>'+
      'These figures are <b>'+howOld+'</b> — last read '+esc(a.lastSast||'')+'. '+
      (a.failing? 'The connection to the accounting system has failed '+a.fails+' time'+(a.fails===1?'':'s')+' since then and the team is on it.' : 'The next read is due '+esc(a.next||'shortly')+'.')+
      ' Treat them as at that date, not as today.</div></div>';
  }
  function sageLive(){ try{ var s=BB.data.sage&&BB.data.sage(); return !!(s&&s.live); }catch(e){ return false; } }
  function isSample(rec){ return !(rec && (rec.src==='sage' || rec.sageId)); }
  function sampleNote(what){
    return '<div class="bb-sample"><span class="t">Sample</span><div>The figures in <b>'+esc(what)+'</b> are demonstration data, not BioBrix\'s own. '+
      (sageLive()? 'Your customers, invoices and payments are live from your accounting system — this section is not connected to it yet.' : 'Nothing here comes from your systems yet.')+'</div></div>';
  }
  // Pages where the top of the screen is now real (fed by the accounting system) and only the
  // sections below it are demonstration data. The note goes above the first of those sections.
  var PARTLY_LIVE = {
    'operations.html':{ after:'.grid', what:'the sections below — orders, stock, blending and deliveries' },
    'intelligence.html':{ after:'#alerts', what:'the farm health scores below, and the stock and sample alerts' }
  };
  function markSamplePage(){
    if(!sageLive()) return;                                  // in pure demo mode the whole thing is a demo
    // On a live client seat there is no sample data left to mark: the store stops serving seeded
    // records altogether (see bb-data, "the sample-data cut-off"). A banner here would be warning
    // people about figures they can no longer see.
    try{
      if(BB.auth && BB.auth.tenantLive && BB.auth.tenantLive() && !(BB.auth.isFreedomHub && BB.auth.isFreedomHub())) return;
    }catch(e){}
    var f = location.pathname.split('/').pop() || 'index.html';
    if(f.indexOf('.')<0) f += '.html';                    // host may have stripped the extension
    var host = document.querySelector('main.wrap') || document.body;
    var partly = PARTLY_LIVE[f];
    if(partly){
      var anchor = host.querySelector(partly.after);
      if(anchor){ anchor.insertAdjacentHTML('afterend', sampleNote(partly.what)); return; }
    }
    var what = SAMPLE_PAGES[f];
    if(!what) return;
    var head = host.querySelector('.page-head');
    var html = sampleNote(what);
    if(head) head.insertAdjacentHTML('afterend', html); else host.insertAdjacentHTML('afterbegin', html);
  }

  // ---- offline / sync indicator ---------------------------------
  function refreshSync(){
    var el = document.getElementById('bbSync'); if(!el) return;
    var q = BB.data.queue();
    if(!navigator.onLine){
      el.className='bb-sync off';
      el.innerHTML='<span class="dot"></span>Offline — '+q.length+' change'+(q.length===1?'':'s')+' saved on this device, will sync when signal returns';
    } else if(q.length){
      el.className='bb-sync syncing';
      el.innerHTML='<span class="dot"></span>Back online — syncing '+q.length+' change'+(q.length===1?'':'s')+'…';
      setTimeout(function(){ BB.data.flushQueue(); refreshSync(); }, 1400);
    } else {
      el.className='bb-sync'; el.innerHTML='';
    }
  }
  window.addEventListener('online', refreshSync);
  window.addEventListener('offline', refreshSync);

  // ---- toast ----------------------------------------------------
  function toast(msg){
    var t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add('show'); });
    setTimeout(function(){ t.classList.remove('show'); setTimeout(function(){t.remove();},300); }, 2400);
  }

  // ---- formatting ----------------------------------------------
  function money(v){ if(v==null||v==='')return 'R0'; return 'R'+Number(v).toLocaleString('en-ZA',{maximumFractionDigits:0}); }
  function money2(v){ return new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',minimumFractionDigits:0,maximumFractionDigits:0}).format(v||0); }
  function num(v){ return Number(v||0).toLocaleString('en-ZA'); }
  function date(d){ if(!d)return '—'; try{return new Date(d).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'});}catch(e){return d;} }
  function shortDate(d){ if(!d)return '—'; try{return new Date(d).toLocaleDateString('en-ZA',{day:'numeric',month:'short'});}catch(e){return d;} }
  function monthName(i){ return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]; }

  function statusBadge(s){
    var m={ 'Confirmed':'b-ok','Delivered':'b-ok','Paid':'b-ok','Active':'b-ok','In stock':'b-ok','Healthy':'b-ok','Approved':'b-ok',
      'Pending':'b-warn','Forecast':'b-warn','Awaiting stock':'b-warn','Low stock':'b-warn','In progress':'b-warn','Monitoring':'b-warn','Reorder':'b-warn',
      'Draft':'b-grey','Planned':'b-grey','New':'b-grey',
      'Out of stock':'b-bad','Overdue':'b-bad','Urgent':'b-bad','Critical':'b-bad','At risk':'b-bad',
      'Ordered':'b-blue','In transit':'b-blue','Blending':'b-blue','Quoted':'b-blue','Proof received':'b-blue','Sent':'b-ok','Shipped':'b-ok','In flight':'b-blue','Awaiting you':'b-warn','Open':'b-grey','Done':'b-ok','Design':'b-grey','Live':'b-ok' };
    return '<span class="badge '+(m[s]||'b-grey')+'">'+esc(s)+'</span>';
  }

  // ---- expose ---------------------------------------------------
  window.BB = window.BB || {};
  Object.assign(window.BB, {
    esc:esc, toast:toast, money:money, money2:money2, num:num, date:date, shortDate:shortDate,
    monthName:monthName, statusBadge:statusBadge, initials:initials,
    renderHeader:renderHeader, refreshSync:refreshSync,
    sageLive:sageLive, isSample:isSample, sampleNote:sampleNote, sageAge:sageAge, staleNote:staleNote,
    sampleChip:function(rec){ return isSample(rec) && sageLive() ? '<span class="chip-sample">Sample</span>' : ''; },
    liveChip:function(){ return sageLive() ? '<span class="chip-live">From your accounts</span>' : ''; },
    // inject brand CSS immediately
    _cssInjected:false
  });

  // inject CSS + fonts as early as possible
  (function injectCSS(){
    if(!document.querySelector('link[data-bb-fonts]')){
      var l=document.createElement('link'); l.rel='stylesheet'; l.setAttribute('data-bb-fonts','1');
      l.href='https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap';
      document.head.appendChild(l);
    }
    if(!document.querySelector('style[data-bb]')){
      var s=document.createElement('style'); s.setAttribute('data-bb','1'); s.textContent=CSS; document.head.appendChild(s);
    }
  })();
})();
