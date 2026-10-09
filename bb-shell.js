/* ============================================================
   BioBrix Operating System — shared shell (brand, side rail, top bar, helpers, charts)
   Loaded on every app page AFTER guard.js. Exposes window.BB.
   Pages keep calling BB.renderHeader({ active, back, sub }) exactly as before; the shell now
   draws the FreedomHub category rail (the same nav as our other client portals) on the left,
   a slim top bar with breadcrumbs, and keeps the bottom bar for phones in the field.
   ============================================================ */
(function () {
  "use strict";

  // ---- Design tokens + components (BioBrix — "The Biological Way") --------------
  var CSS = `
  :root{
    --green-darkest:#12210c; --green-dark:#22431a; --green:#3f6b28;
    --green-mid:#43782a; --green-bright:#68a53e; --lime:#b7d97a;
    --rail:#0f1c0a; --rail-2:#172a10; --rail-line:rgba(183,217,122,.12);
    --on-rail:rgba(222,236,203,.62); --on-rail-hi:#c9e59a;
    --bg:#f4f6f1; --panel:#ffffff; --panel-2:#f8faf5; --ink:#17240f; --muted:#526047;
    --faint:#66745b; --line:#e2e8da; --line-soft:#eef2e9;
    --amber:#b06d0f; --amber-bg:#fdf3e0; --red:#b8382a; --red-bg:#fcebe9;
    --blue:#2f6f9e; --blue-bg:#e8f1f8; --ok:#2b7d39; --ok-bg:#e6f3e8;
    --shadow:0 1px 2px rgba(18,33,12,.05),0 1px 3px rgba(18,33,12,.04);
    --shadow-lg:0 12px 32px -8px rgba(18,33,12,.18);
    --radius:12px; --radius-sm:9px;
    --display:'Space Grotesk',system-ui,sans-serif;
    --body:'Inter',system-ui,-apple-system,sans-serif;
    --nav:252px; --top:60px;
    --c1:#3f6b28; --c2:#c77d17; --c3:#2f6f9e; --c4:#7d4f9a; --c5:#8fbf5a; --c6:#a3533f; --c7:#6b7a5e;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{font-size:16px;-webkit-text-size-adjust:100%;}
  body{font-family:var(--body);font-size:.9375rem;background:var(--bg);color:var(--ink);line-height:1.5;
    -webkit-font-smoothing:antialiased;min-height:100vh;padding-left:var(--nav);font-variant-numeric:tabular-nums;}
  html,body{max-width:100%;overflow-x:clip;}   /* clip, not hidden: hidden makes body a scroll box and breaks every sticky header */
  a{color:inherit;text-decoration:none;}
  button{font-family:inherit;}
  :focus-visible{outline:2px solid var(--green-bright);outline-offset:2px;border-radius:4px;}
  .ico{width:18px;height:18px;flex:none;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
  .wrap{max-width:1480px;margin:0 auto;padding:0 28px 48px;}

  /* ── Side rail: the FreedomHub category rail ─────────────────────────── */
  #bbNav{position:fixed;top:0;left:0;bottom:0;width:var(--nav);background:var(--rail);color:#fff;display:flex;flex-direction:column;
    z-index:100;overflow-y:auto;overflow-x:hidden;border-right:1px solid rgba(0,0,0,.2);scrollbar-width:thin;scrollbar-color:rgba(183,217,122,.2) transparent;}
  .nav-brand{display:flex;align-items:center;gap:11px;padding:18px 18px 16px;border-bottom:1px solid var(--rail-line);}
  .bb-mark{width:36px;height:36px;border-radius:10px;flex:none;background:linear-gradient(140deg,var(--green-bright),var(--lime));
    display:flex;align-items:center;justify-content:center;font-family:var(--display);font-weight:700;color:#13260c;font-size:1.08rem;}
  .bb-word{font-family:var(--display);font-weight:700;font-size:1.04rem;letter-spacing:.4px;line-height:1;color:#f1f7e8;}
  .bb-word .os{color:var(--lime);font-weight:500;}
  .bb-sub{font-size:.58rem;letter-spacing:2.2px;text-transform:uppercase;color:rgba(222,236,203,.45);margin-top:4px;}
  .nav-seat{margin:12px 14px 4px;padding:10px 12px;border-radius:10px;background:var(--rail-2);border:1px solid var(--rail-line);display:flex;align-items:center;gap:10px;}
  .nav-seat .bb-av{width:30px;height:30px;font-size:.7rem;}
  .nav-seat .nm{font-size:.82rem;font-weight:600;color:#eef6e2;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .nav-seat .rl{font-size:.66rem;color:rgba(222,236,203,.5);line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .nav-search{position:relative;margin:10px 14px 6px;}
  .nav-search .ico{position:absolute;left:10px;top:50%;transform:translateY(-50%);width:15px;height:15px;color:rgba(222,236,203,.45);pointer-events:none;}
  .nav-search input{width:100%;padding:8px 10px 8px 32px;font:inherit;font-size:.8rem;border-radius:8px;border:1px solid var(--rail-line);
    background:rgba(255,255,255,.05);color:#fff;outline:none;transition:border-color .15s;}
  .nav-search input::placeholder{color:rgba(222,236,203,.42);}
  .nav-search input:focus{border-color:rgba(183,217,122,.5);}
  .nav-label{padding:14px 18px 6px;font-size:.6rem;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:rgba(222,236,203,.34);}
  #nav-items.rail{padding:0 0 10px;display:flex;flex-direction:column;gap:1px;}
  .rail-tab{position:relative;}
  .rail-head{width:100%;display:flex;align-items:center;gap:12px;padding:10px 18px;background:none;border:0;color:var(--on-rail);
    font:inherit;font-size:.74rem;font-weight:700;letter-spacing:.8px;text-transform:uppercase;text-align:left;cursor:pointer;transition:color .15s;position:relative;}
  .rail-head .ico{opacity:.7;transition:opacity .15s;}
  .rt-label{flex:1;min-width:0;white-space:nowrap;}
  .rt-caret{width:14px;height:14px;opacity:.45;transition:transform .18s;}
  .rail-tab:hover>.rail-head,.rail-tab.open>.rail-head{color:var(--on-rail-hi);}
  .rail-tab.active>.rail-head{color:#fff;}
  .rail-tab.active>.rail-head::before{content:"";position:absolute;left:0;top:7px;bottom:7px;width:3px;border-radius:0 3px 3px 0;background:var(--lime);}
  .rail-tab:hover>.rail-head .ico,.rail-tab.active>.rail-head .ico,.rail-tab.open>.rail-head .ico{opacity:1;}
  .rail-tab.open>.rail-head .rt-caret{transform:rotate(90deg);}
  .rail-flyout{position:fixed;top:0;left:-9999px;opacity:0;visibility:hidden;transform:translateX(-4px);transition:opacity .14s,transform .14s;z-index:120;pointer-events:none;}
  .rail-tab.open>.rail-flyout{opacity:1;visibility:visible;transform:none;pointer-events:auto;}
  .rail-flyout-card{background:var(--rail-2);border:1px solid var(--rail-line);border-left:none;border-radius:0 14px 14px 0;padding:14px 14px 12px;
    box-shadow:14px 18px 44px -12px rgba(0,0,0,.55);max-height:82vh;overflow:auto;min-width:236px;}
  .rail-flyout-head{font-size:.62rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--lime);padding:0 8px 10px;margin-bottom:6px;border-bottom:1px solid var(--rail-line);}
  .rail-flyout-grid{display:grid;grid-template-columns:1fr;}
  .rail-flyout .nav-item{display:flex;align-items:center;gap:10px;border-radius:7px;padding:8px 8px;font-size:.84rem;font-weight:500;white-space:nowrap;color:rgba(222,236,203,.72);transition:color .12s,background .12s;}
  .rail-flyout .nav-item .ico{width:16px;height:16px;opacity:.6;}
  .rail-flyout .nav-item:hover{color:#fff;background:rgba(183,217,122,.07);}
  .rail-flyout .nav-item.active{color:#fff;background:rgba(183,217,122,.12);}
  .rail-flyout .nav-item.active .ico,.rail-flyout .nav-item:hover .ico,.rail-flyout .nav-item.match .ico{opacity:1;color:var(--lime);}
  .rail-flyout .nav-item.match{color:#fff;box-shadow:inset 3px 0 0 var(--lime);}
  #nav-results{padding:4px 8px;}
  #nav-results .search-result{display:flex;align-items:center;gap:10px;border-radius:7px;padding:8px 10px;color:var(--on-rail);font-size:.84rem;transition:color .12s;}
  #nav-results .search-result .ico{width:16px;height:16px;opacity:.6;}
  #nav-results .search-result:hover,#nav-results .search-result.sr-active{color:#fff;background:rgba(183,217,122,.07);}
  .search-result .sr-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .search-result .sr-label b{color:var(--lime);font-weight:700;}
  .search-result .sr-tag{font-size:.54rem;max-width:72px;overflow:hidden;text-overflow:ellipsis;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:rgba(222,236,203,.38);white-space:nowrap;}
  .nav-noresult{padding:12px 18px;font-size:.78rem;color:rgba(222,236,203,.45);}
  .sr-head{padding:10px 18px 4px;font-size:.66rem;letter-spacing:.6px;text-transform:uppercase;font-weight:700;color:rgba(222,236,203,.45);}
  .search-preview{opacity:1;visibility:visible;transform:none;pointer-events:auto;transition:none;}
  .search-preview[hidden]{display:none;}
  .nav-footer{margin-top:auto;padding:14px 18px;border-top:1px solid var(--rail-line);font-size:.66rem;color:rgba(222,236,203,.34);line-height:1.6;}
  .nav-footer b{color:rgba(222,236,203,.6);font-weight:600;}

  /* ── Top bar ───────────────────────────────────────────────────────────── */
  .bb-top{position:sticky;top:0;z-index:80;background:rgba(255,255,255,.92);backdrop-filter:saturate(1.4) blur(10px);border-bottom:1px solid var(--line);}
  .bb-top-in{height:var(--top);max-width:1480px;margin:0 auto;padding:0 28px;display:flex;align-items:center;gap:14px;}
  .bb-burger{display:none;width:40px;height:40px;border-radius:9px;border:1px solid var(--line);background:#fff;color:var(--green-dark);align-items:center;justify-content:center;cursor:pointer;flex:none;}
  .bb-crumbs{display:flex;align-items:center;gap:8px;min-width:0;flex:1;font-size:.84rem;color:var(--faint);}
  .bb-crumbs a:hover{color:var(--green-dark);}
  .bb-crumbs .sep{width:14px;height:14px;opacity:.5;}
  .bb-crumbs .here{color:var(--ink);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .bb-back{display:inline-flex;align-items:center;gap:4px;padding:6px 10px 6px 6px;border-radius:8px;border:1px solid var(--line);color:var(--green-dark);font-size:.8rem;font-weight:600;background:#fff;flex:none;}
  .bb-back:hover{border-color:var(--green-bright);}
  .bb-back .ico{width:15px;height:15px;transform:rotate(180deg);}
  .bb-net{display:inline-flex;align-items:center;gap:7px;font-size:.74rem;font-weight:600;color:var(--muted);padding:5px 10px;border-radius:999px;background:var(--panel-2);border:1px solid var(--line);white-space:nowrap;}
  .bb-net .dot{width:7px;height:7px;border-radius:50%;background:var(--ok);}
  .bb-net.off .dot,.bb-net.stale .dot{background:var(--amber);} .bb-net.stale{color:var(--amber);} .bb-net.sync .dot{background:var(--blue);animation:bbpulse 1.1s infinite;}
  .bb-user{position:relative;display:flex;align-items:center;gap:10px;cursor:pointer;padding:4px 4px 4px 10px;border-radius:999px;border:1px solid transparent;background:none;font:inherit;color:inherit;text-align:right;}
  .bb-user:hover{border-color:var(--line);}
  .bb-user .nm{font-weight:600;font-size:.82rem;line-height:1.15;color:var(--ink);}
  .bb-user .rl{font-size:.68rem;color:var(--faint);line-height:1.2;}
  .bb-av{width:34px;height:34px;border-radius:50%;background:var(--green-dark);color:var(--lime);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.76rem;flex:none;font-family:var(--display);}
  .bb-menu{position:absolute;right:0;top:calc(100% + 8px);min-width:230px;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow-lg);padding:6px;display:none;z-index:130;text-align:left;}
  .bb-user.open .bb-menu{display:block;}
  .bb-menu .mh{padding:10px 12px 10px;border-bottom:1px solid var(--line-soft);margin-bottom:4px;}
  .bb-menu .mh .nm{font-size:.86rem;} .bb-menu .mh .rl{font-size:.72rem;}
  .bb-menu a{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;font-size:.84rem;color:var(--ink);}
  .bb-menu a:hover{background:var(--panel-2);}
  .bb-menu a .ico{width:16px;height:16px;color:var(--muted);}
  /* Scope band (advisor / depot / farmer seats) */
  .bb-scope{display:flex;align-items:center;gap:8px;font-size:.76rem;padding:7px 28px;background:#eef4e4;color:var(--green-dark);border-top:1px solid var(--line-soft);}
  .bb-scope{flex-wrap:wrap;line-height:1.4;} .bb-scope b{font-weight:700;white-space:nowrap;} .bb-scope .dot{width:8px;height:8px;border-radius:50%;flex:none;}
  /* Offline / sync banner */
  .bb-sync{display:none;align-items:center;gap:9px;justify-content:center;font-size:.78rem;font-weight:600;padding:7px 14px;color:#fff;position:absolute;left:0;right:0;top:100%;z-index:2;box-shadow:0 6px 14px -8px rgba(0,0,0,.3);}   /* overlays: never pushes the page while you tap */
  .bb-sync.off{display:flex;background:#8a6d1f;} .bb-sync.syncing{display:flex;background:var(--blue);}
  .bb-sync .dot{width:8px;height:8px;border-radius:50%;background:#fff;animation:bbpulse 1.1s infinite;}
  @keyframes bbpulse{0%,100%{opacity:.35}50%{opacity:1}}

  /* ── Page furniture ────────────────────────────────────────────────────── */
  .page-head{padding:26px 0 6px;}
  .page-head h1{font-family:var(--display);font-size:1.6rem;font-weight:600;color:var(--green-darkest);letter-spacing:-.3px;line-height:1.2;}
  .page-head p{color:var(--muted);font-size:.9rem;margin-top:4px;max-width:760px;}
  .page-head.row{align-items:flex-end;}
  .eyebrow{font-size:.66rem;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:var(--green-mid);margin-bottom:4px;}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);min-width:0;}
  .card-p{padding:18px 20px;}
  .card-h{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-bottom:1px solid var(--line-soft);flex-wrap:wrap;}
  .card-h h3{font-family:var(--display);font-size:.98rem;font-weight:600;color:var(--green-darkest);}
  .card-h .sub{font-size:.76rem;color:var(--faint);margin-top:1px;}
  .card-f{padding:10px 20px;border-top:1px solid var(--line-soft);font-size:.78rem;color:var(--faint);}
  .grid{display:grid;gap:16px;}
  .g2{grid-template-columns:repeat(2,minmax(0,1fr));} .g3{grid-template-columns:repeat(3,minmax(0,1fr));}
  .g4{grid-template-columns:repeat(4,minmax(0,1fr));} .g5{grid-template-columns:repeat(5,minmax(0,1fr));} .g6{grid-template-columns:repeat(6,minmax(0,1fr));}
  .split{display:grid;gap:16px;grid-template-columns:minmax(0,2fr) minmax(0,1fr);}
  .split-r{display:grid;gap:16px;grid-template-columns:minmax(0,1fr) minmax(0,2fr);}
  .span2{grid-column:span 2;} .span3{grid-column:span 3;}
  @media(max-width:1280px){.g5,.g6{grid-template-columns:repeat(3,minmax(0,1fr));}}
  @media(max-width:1100px){.split,.split-r{grid-template-columns:minmax(0,1fr);} .g4{grid-template-columns:repeat(2,minmax(0,1fr));}}
  @media(max-width:860px){.g3,.g5,.g6{grid-template-columns:repeat(2,minmax(0,1fr));} .span2,.span3{grid-column:auto;}}
  @media(max-width:560px){.g2,.g3,.g4{grid-template-columns:minmax(0,1fr);}
    .g3:has(> .stat),.g4:has(> .stat),.g5:has(> .stat),.g6:has(> .stat){grid-template-columns:repeat(2,minmax(0,1fr));} .stat .v{font-size:1.2rem;}}
  select, input, textarea, .selbar{max-width:100%;}
  select{text-overflow:ellipsis;}
  .row, .selbar{min-width:0;}

  /* Tiles (hubs) */
  .tile{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:16px 18px;box-shadow:var(--shadow);
    display:block;transition:border-color .15s,box-shadow .15s;position:relative;overflow:hidden;}
  .tile:hover{border-color:var(--green-bright);box-shadow:0 4px 18px -6px rgba(18,33,12,.18);}
  .tile .ic{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;font-size:1.05rem;background:#eef4e4;color:var(--green-dark);}
  .tile .ic .ico{width:20px;height:20px;}
  .tile h3{font-family:var(--display);font-weight:600;font-size:.98rem;color:var(--green-darkest);}
  .tile p{font-size:.8rem;color:var(--muted);margin-top:3px;line-height:1.5;}
  .tile .meta{margin-top:10px;font-size:.74rem;color:var(--faint);display:flex;gap:12px;flex-wrap:wrap;}
  .tile .meta b{color:var(--green-mid);}

  /* KPI / stat */
  .stat{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:14px 16px;box-shadow:var(--shadow);position:relative;min-width:0;}
  .stat .l{font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.7px;color:var(--faint);display:flex;align-items:center;gap:6px;}
  .stat .v{font-family:var(--display);font-size:1.55rem;font-weight:600;color:var(--green-darkest);margin-top:4px;line-height:1.1;letter-spacing:-.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .stat .s{font-size:.76rem;color:var(--muted);margin-top:3px;}
  .stat .spark{margin-top:8px;height:28px;}
  .stat.warn .v{color:var(--amber);} .stat.bad .v{color:var(--red);}
  .stat.warn .l::before,.stat.bad .l::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--amber);}
  .stat.bad .l::before{background:var(--red);}
  a.stat.tap{display:block;text-decoration:none;color:inherit;transition:border-color .15s,box-shadow .15s;}
  a.stat.tap:hover{box-shadow:0 4px 18px -6px rgba(18,33,12,.18);border-color:var(--green-bright);}
  a.stat.tap .s{color:var(--green);font-weight:600;}
  .delta{display:inline-flex;align-items:center;gap:2px;font-size:.72rem;font-weight:700;padding:1px 6px;border-radius:999px;}
  .delta.up{color:var(--ok);background:var(--ok-bg);} .delta.down{color:var(--red);background:var(--red-bg);} .delta.flat{color:var(--muted);background:var(--line-soft);}

  /* Section title */
  .sec{display:flex;align-items:center;gap:12px;margin:28px 0 12px;flex-wrap:wrap;}
  .sec h2{font-family:var(--display);font-size:1.02rem;font-weight:600;color:var(--green-darkest);}
  .sec .ln{flex:1;height:1px;background:var(--line);min-width:20px;}
  .sec .cnt{font-size:.76rem;color:var(--faint);}
  /* Badge / pill */
  .badge{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:999px;font-size:.7rem;font-weight:600;letter-spacing:.1px;white-space:nowrap;}
  .b-ok{background:var(--ok-bg);color:var(--ok);} .b-warn{background:var(--amber-bg);color:var(--amber);}
  .b-bad{background:var(--red-bg);color:var(--red);} .b-blue{background:var(--blue-bg);color:var(--blue);}
  .b-grey{background:#eef1ea;color:var(--muted);} .b-lime{background:#eef6dc;color:var(--green-mid);}
  /* Buttons */
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;font-family:var(--body);font-weight:600;font-size:.86rem;min-height:40px;
    padding:9px 16px;border-radius:9px;border:1px solid transparent;cursor:pointer;transition:background .15s,border-color .15s,color .15s;background:var(--green-dark);color:#fff;white-space:nowrap;}
  .btn:hover{background:var(--green-darkest);} .btn:disabled{opacity:.5;cursor:not-allowed;}
  .btn .ico{width:16px;height:16px;}
  .btn.ghost{background:#fff;border-color:var(--line);color:var(--green-dark);} .btn.ghost:hover{border-color:var(--green-bright);background:var(--panel-2);}
  .btn.lime{background:var(--lime);color:#1b2f10;} .btn.lime:hover{background:#a9cf68;}
  .btn.sm{min-height:32px;padding:5px 11px;font-size:.78rem;border-radius:8px;} .btn.block{width:100%;}
  /* Tables */
  table.bb{width:100%;border-collapse:separate;border-spacing:0;font-size:.86rem;}
  table.bb th{text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:var(--faint);font-weight:600;padding:10px 14px;
    background:var(--panel-2);border-bottom:1px solid var(--line);white-space:nowrap;position:sticky;top:0;z-index:1;}
  table.bb th:first-child{border-top-left-radius:var(--radius);} table.bb th:last-child{border-top-right-radius:var(--radius);}
  table.bb td{padding:10px 14px;border-bottom:1px solid var(--line-soft);vertical-align:middle;}
  table.bb tr:last-child td{border-bottom:none;}
  table.bb tbody tr:hover td{background:#fafcf7;}
  table.bb tr.click{cursor:pointer;} table.bb tr.click:hover td{background:#f3f8ec;}
  table.bb .num, table.bb th.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;}
  table.bb tfoot td{font-weight:700;background:var(--panel-2);border-top:1px solid var(--line);}
  .card > table.bb th, .card > .scroll > table.bb th{background:var(--panel-2);}
  .scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}
  .scroll.tall{max-height:520px;overflow:auto;}
  .bar-cell{display:flex;align-items:center;gap:8px;min-width:120px;}
  .bar-cell .trk{flex:1;height:6px;border-radius:3px;background:var(--line-soft);overflow:hidden;}
  .bar-cell .trk i{display:block;height:100%;border-radius:3px;background:var(--green-bright);}
  /* Forms */
  .fld{margin-bottom:14px;} .fld label{display:block;font-size:.74rem;font-weight:600;color:var(--muted);margin-bottom:5px;}
  .fld input,.fld select,.fld textarea{width:100%;padding:10px 12px;font-family:inherit;font-size:.92rem;border:1px solid var(--line);border-radius:9px;outline:none;background:#fff;color:var(--ink);transition:border-color .15s,box-shadow .15s;}
  .fld input:focus,.fld select:focus,.fld textarea:focus{border-color:var(--green-bright);box-shadow:0 0 0 3px rgba(104,165,62,.15);}
  /* Toolbar / segmented */
  .toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:16px 0 12px;}
  .seg{display:inline-flex;background:#fff;border:1px solid var(--line);border-radius:9px;padding:3px;gap:2px;}
  .seg button,.seg a{border:0;background:none;font:inherit;font-size:.8rem;font-weight:600;color:var(--muted);padding:6px 12px;border-radius:7px;cursor:pointer;}
  .seg .on{background:var(--green-dark);color:#fff;}
  /* Bottom nav — phones only */
  .bb-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:90;background:rgba(255,255,255,.97);backdrop-filter:blur(8px);border-top:1px solid var(--line);
    justify-content:space-around;padding:6px 4px calc(6px + env(safe-area-inset-bottom));}
  .bb-nav a{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:5px 2px;color:var(--faint);font-size:.62rem;font-weight:600;min-height:44px;justify-content:center;}
  .bb-nav a .ico{width:20px;height:20px;}
  .bb-nav a.on{color:var(--green-dark);}
  /* Misc */
  .muted{color:var(--muted);} .faint{color:var(--faint);} .right{text-align:right;} .center{text-align:center;}
  .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;} .between{justify-content:space-between;}
  .chip{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:999px;background:#fff;font-size:.78rem;font-weight:600;color:var(--green-dark);border:1px solid var(--line);cursor:pointer;}
  .chip.on{background:var(--green-dark);color:#eef6e2;border-color:var(--green-dark);}
  .empty{text-align:center;padding:36px 20px;color:var(--faint);font-size:.88rem;} .empty .big{font-size:1.6rem;margin-bottom:8px;}
  .toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(20px);background:var(--green-darkest);color:#fff;padding:12px 20px;border-radius:10px;font-size:.86rem;font-weight:600;box-shadow:var(--shadow-lg);opacity:0;pointer-events:none;transition:.25s;z-index:200;max-width:90vw;text-align:center;}
  .toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
  .toast.undo{display:flex;align-items:center;gap:14px;pointer-events:auto;text-align:left;}
  .toast.undo button{flex:none;background:none;border:0;color:var(--lime,#b5d334);font:inherit;font-weight:700;cursor:pointer;padding:6px 4px;margin:-6px -4px;min-height:32px;}
  .divider{height:1px;background:var(--line);margin:16px 0;}
  .hero-band{background:linear-gradient(112deg,var(--green-darkest),var(--green-dark));color:#eaf4d8;border-radius:var(--radius);padding:20px 24px;box-shadow:var(--shadow);}
  .legend{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:.76rem;color:var(--muted);}
  .legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px;}
  /* Sample-data marker — nothing fabricated may ever read as the client's own. */
  .bb-sample{display:flex;gap:10px;align-items:flex-start;margin:14px 0 4px;padding:10px 14px;border:1px dashed var(--amber);background:var(--amber-bg);border-radius:10px;color:#6b4708;font-size:.82rem;line-height:1.45;}
  .bb-sample b{font-weight:700;}
  .bb-sample .t{background:var(--amber);color:#fff;border-radius:6px;padding:1px 7px;font-size:.7rem;font-weight:700;letter-spacing:.4px;text-transform:uppercase;flex:none;margin-top:1px;}
  .chip-sample{display:inline-block;background:var(--amber-bg);border:1px dashed var(--amber);color:#6b4708;border-radius:999px;padding:0 7px;font-size:.66rem;font-weight:700;letter-spacing:.3px;text-transform:uppercase;vertical-align:middle;margin-left:6px;}
  .chip-live{display:inline-block;background:var(--ok-bg);border:1px solid var(--ok);color:var(--ok);border-radius:999px;padding:0 7px;font-size:.66rem;font-weight:700;letter-spacing:.3px;text-transform:uppercase;vertical-align:middle;margin-left:6px;}

  /* ── Charts (BB.chart) ─────────────────────────────────────────────────── */
  .bbc{position:relative;width:100%;}
  .bbc svg{display:block;width:100%;overflow:visible;}
  .bbc .ax{font-size:11px;fill:var(--faint);font-family:var(--body);}
  .bbc .grid-l{stroke:var(--line-soft);stroke-width:1;}
  .bbc .base-l{stroke:var(--line);stroke-width:1;}
  .bbc .hov{fill:transparent;cursor:crosshair;}
  .bbc .hov:hover{fill:rgba(104,165,62,.06);}
  .bbc-tip{position:fixed;z-index:300;pointer-events:none;background:var(--green-darkest);color:#fff;font-size:.76rem;line-height:1.45;padding:8px 10px;border-radius:8px;box-shadow:var(--shadow-lg);opacity:0;max-width:280px;visibility:hidden;}
  .bbc-tip.show{opacity:1;visibility:visible;}
  html.bbp-lock,html.bbp-lock body{overflow:hidden !important;}
  html.bbp-lock body{padding-right:var(--sbw,0px);}
  .bbc-tip b{font-weight:700;display:block;margin-bottom:2px;color:var(--lime);}
  .bbc-tip i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;}
  .bbc-legend{margin-top:10px;}
  .hbars{display:flex;flex-direction:column;gap:12px;}
  .hbar .top{display:flex;justify-content:space-between;gap:10px;font-size:.84rem;margin-bottom:5px;}
  .hbar .top .n{font-weight:600;color:var(--ink);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .hbar .top .n small{font-weight:400;color:var(--faint);margin-left:6px;}
  .hbar .top .val{font-weight:700;color:var(--green-darkest);white-space:nowrap;}
  .hbar .trk{height:8px;border-radius:4px;background:var(--line-soft);overflow:hidden;display:flex;}
  .hbar .trk i{display:block;height:100%;}
  .donut-wrap{display:flex;align-items:center;justify-content:center;gap:18px 24px;flex-wrap:wrap;}
  .donut-wrap svg{flex:none;}
  .donut-legend{flex:1;min-width:220px;display:flex;flex-direction:column;gap:8px;font-size:.82rem;}
  .donut-legend .r{display:flex;align-items:center;gap:8px;}
  .donut-legend .r i{width:10px;height:10px;border-radius:3px;flex:none;}
  .donut-legend .r span{flex:1;min-width:0;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .donut-legend .r b{font-weight:600;color:var(--ink);}
  .donut-legend .r em{font-style:normal;color:var(--faint);font-size:.74rem;width:38px;text-align:right;}
  .bbc-table summary{font-size:.74rem;color:var(--faint);cursor:pointer;margin-top:8px;}
  .bbc-table table{margin-top:6px;}





  /* Order pills — each status its own colour (tinted fill); the tags beside them use other styles:
     quote = purple with an icon · invoice = outlined · HOLD = the only solid pill. */
  .b-forecast{background:#edf1f5;color:#4a5a6b;}
  .b-pending{background:#fdf1dc;color:#9a5c0a;}
  .b-confirmed{background:#e3f2e5;color:#23702f;}
  .b-await{background:#f8e5e1;color:#9c3f33;}
  .b-delivered{background:#eaecfa;color:#4352a3;}
  .b-transit{background:#e0f3f7;color:#0e6e86;}
  .tag{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:.68rem;font-weight:600;white-space:nowrap;line-height:1.5;}
  .tag .ico{width:11px;height:11px;stroke-width:2.2;}
  .tag-quote{background:#f3ecf8;color:#6d3f8a;}
  .tag-inv{background:#fff;color:#16726a;box-shadow:inset 0 0 0 1px #8fcfc6;}
  .tag-uninv{background:#fff;color:#7a6250;box-shadow:none;border:1px dashed #c4ad97;padding:1px 7px;}
  .tag-hold{background:#b8382a;color:#fff;letter-spacing:.4px;}
  .tag-hold.med{background:#a15c08;}
  .tags{display:flex;gap:4px;flex-wrap:wrap;align-items:center;}

  /* ── Themed controls (no OS-drawn widgets) ── */
  .bb-sel{position:relative;display:inline-block;min-width:0;max-width:100%;vertical-align:middle;}
  .bb-sel .bb-native{position:absolute !important;inset:0;width:100% !important;height:100% !important;opacity:0 !important;pointer-events:none !important;margin:0 !important;}
  .bb-sel-btn{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:40px;padding:9px 12px;font:inherit;font-size:.9rem;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:9px;cursor:pointer;text-align:left;transition:border-color .15s,box-shadow .15s;}
  .bb-sel-btn:hover{border-color:var(--green-bright);}
  .bb-sel.open .bb-sel-btn,.bb-sel-btn:focus-visible{border-color:var(--green-bright);box-shadow:0 0 0 3px rgba(104,165,62,.15);outline:none;}
  .bb-sel-btn .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .bb-sel-btn.ph .t{color:var(--faint);}
  .bb-sel-btn .cv{width:15px;height:15px;color:var(--faint);transform:rotate(90deg);transition:transform .15s;flex:none;}
  .bb-sel.open .bb-sel-btn .cv{transform:rotate(-90deg);}
  .bb-sel-btn:disabled{opacity:.55;cursor:not-allowed;}
  .bb-sel-menu{position:fixed;z-index:520;background:#fff;border:1px solid var(--line);border-radius:10px;box-shadow:0 16px 40px -10px rgba(18,33,12,.3);padding:4px;max-width:min(380px,calc(100vw - 16px));font-size:.88rem;}
  .bb-sel-menu .ops{max-height:280px;overflow:auto;}
  .bb-sel-menu .op{padding:8px 10px;border-radius:7px;cursor:pointer;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .bb-sel-menu .op:hover,.bb-sel-menu .op.kb{background:var(--panel-2);}
  .bb-sel-menu .op.on{background:#eef4e4;color:var(--green-darkest);font-weight:600;}
  .bb-sel-menu .op.ph{color:var(--faint);}
  .bb-sel-menu .op.dis{opacity:.45;cursor:default;}
  .bb-sel-menu .og{padding:8px 10px 4px;font-size:.62rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--faint);}
  .bb-sel-menu .sq{padding:4px 4px 6px;}
  .bb-sel-menu .sq input{width:100%;padding:7px 9px;font:inherit;font-size:.84rem;border:1px solid var(--line);border-radius:8px;background:var(--panel-2);outline:none;color:var(--ink);}
  .bb-datew,.bb-numw{position:relative;display:inline-block;max-width:100%;vertical-align:middle;}
  .bb-datew input.bb-date{cursor:pointer;padding-right:34px !important;width:100%;}
  .bb-datew.has input.bb-date{color:transparent !important;}
  .bb-datew .dv{position:absolute;left:13px;right:36px;top:50%;transform:translateY(-50%);font-size:.92rem;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;}
  .col-filter-menu .bb-datew .dv{left:10px;font-size:.82rem;}
  .bb-datew .calic{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--faint);cursor:pointer;}
  .bb-datew:hover .calic{color:var(--green);}
  .bb-cal{position:fixed;z-index:520;width:268px;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 16px 40px -10px rgba(18,33,12,.3);padding:10px;font-size:.84rem;}
  .bb-cal .ch{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
  .bb-cal .ch b{font-family:var(--display);font-weight:600;color:var(--green-darkest);}
  .bb-cal .ch button{width:30px;height:30px;border:0;border-radius:8px;background:none;color:var(--muted);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;}
  .bb-cal .ch button:hover{background:var(--panel-2);}
  .bb-cal .ch .pv{transform:rotate(180deg);}
  .bb-cal .cg{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}
  .bb-cal .dw{font-size:.62rem;font-weight:700;color:var(--faint);text-align:center;padding:4px 0;}
  .bb-cal .cg button{height:32px;border:0;border-radius:8px;background:none;font:inherit;font-size:.82rem;color:var(--ink);cursor:pointer;}
  .bb-cal .cg button:hover{background:var(--panel-2);}
  .bb-cal .cg button.td{box-shadow:inset 0 0 0 1px var(--green-bright);}
  .bb-cal .cg button.on{background:var(--green-dark);color:#fff;}
  .bb-cal .cg button:disabled{opacity:.3;cursor:default;}
  .bb-cal .cf{display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid var(--line-soft);}
  .bb-cal .cf button{border:0;background:none;font:inherit;font-size:.8rem;font-weight:600;color:var(--green);cursor:pointer;padding:4px 6px;border-radius:6px;}
  .bb-cal .cf button:hover{background:var(--panel-2);}
  input[type=number]{-moz-appearance:textfield;appearance:textfield;}
  input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
  .bb-numw input{padding-right:26px !important;width:100%;}
  .bb-numw .st{position:absolute;right:3px;top:3px;bottom:3px;width:18px;display:flex;flex-direction:column;}
  .bb-numw .st button{flex:1;border:0;background:none;color:var(--faint);cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;border-radius:4px;}
  .bb-numw .st button:hover{color:var(--green-dark);background:var(--panel-2);}
  .bb-numw .st .ico{width:11px;height:11px;}
  .bb-numw .st button:first-child .ico{transform:rotate(-90deg);} .bb-numw .st button:last-child .ico{transform:rotate(90deg);}
  .bb-sel:has(> select[style*="display: none"]),.bb-datew:has(> input[style*="display: none"]),.bb-numw:has(> input[style*="display: none"]){display:none !important;}
  input[type=checkbox],input[type=radio]{-webkit-appearance:none;appearance:none;width:16px;height:16px;margin:0;flex:none;border:1.5px solid #b9c3ae;background:#fff;display:inline-grid;place-content:center;cursor:pointer;vertical-align:middle;transition:background .12s,border-color .12s;}
  input[type=checkbox]{border-radius:4px;} input[type=radio]{border-radius:50%;}
  input[type=checkbox]:hover,input[type=radio]:hover{border-color:var(--green-bright);}
  input[type=checkbox]:checked{background:var(--green-dark) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E") center/12px no-repeat;border-color:var(--green-dark);}
  input[type=radio]:checked{border-color:var(--green-dark);box-shadow:inset 0 0 0 4px #fff;background:var(--green-dark);}
  input[type=checkbox]:focus-visible,input[type=radio]:focus-visible{outline:2px solid var(--green-bright);outline-offset:2px;}
  input[type=file]{font:inherit;font-size:.84rem;color:var(--muted);max-width:100%;}
  input[type=file]::file-selector-button{font:inherit;font-weight:600;font-size:.84rem;padding:8px 14px;margin-right:10px;border-radius:9px;border:1px solid var(--line);background:#fff;color:var(--green-dark);cursor:pointer;transition:border-color .15s;}
  input[type=file]::file-selector-button:hover{border-color:var(--green-bright);background:var(--panel-2);}
  input[type=search]::-webkit-search-cancel-button,input[type=search]::-webkit-search-decoration{-webkit-appearance:none;appearance:none;}
  details > summary{list-style:none;cursor:pointer;} details > summary::-webkit-details-marker{display:none;}
  details > summary::before{content:"";display:inline-block;width:7px;height:7px;border-right:1.6px solid currentColor;border-bottom:1.6px solid currentColor;transform:rotate(-45deg);margin:0 8px 1px 1px;transition:transform .15s;opacity:.7;}
  details[open] > summary::before{transform:rotate(45deg);margin-bottom:3px;}
  *{scrollbar-width:thin;scrollbar-color:#c3ccb8 transparent;}
  ::-webkit-scrollbar{width:10px;height:10px;} ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#c3ccb8;border-radius:10px;border:3px solid transparent;background-clip:padding-box;}
  ::-webkit-scrollbar-thumb:hover{background:#9fae90;background-clip:padding-box;border:3px solid transparent;}
  ::-webkit-scrollbar-corner{background:transparent;}
  #bbNav{scrollbar-color:rgba(183,217,122,.25) transparent;}

  /* ── Column filters (bb-table.js) — the 9five filter, in BioBrix colours ── */
  table.bb.bbt-sticky th{top:var(--top);}
  .scroll.bbt-fit{overflow:visible;}
  .scroll.tall{max-height:none;}
  .th-inner{display:flex;align-items:center;gap:4px;}
  .th-inner.num{justify-content:flex-end;}
  .th-label{min-width:0;}
  .th-filter{margin-left:auto;display:inline-flex;align-items:center;justify-content:center;width:16px;height:18px;border:0;border-radius:5px;background:none;color:var(--faint);opacity:.55;cursor:pointer;padding:0;flex:none;}
  .th-inner.num .th-filter{margin-left:4px;}
  .th-filter:hover{opacity:1;background:var(--line-soft);}
  .th-filter svg{width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linejoin:round;}
  .th-filter.active{color:var(--green);opacity:1;} .th-filter.active svg{fill:currentColor;}
  tr.bbt-skel td{padding:12px 14px;} tr.bbt-skel td i{display:block;height:9px;border-radius:5px;background:var(--line-soft);width:68%;}
  tr.bbt-skel:hover td{background:none !important;}
  .bbt-info{font-size:.74rem;color:var(--muted);white-space:nowrap;} .bbt-info b{color:var(--ink);} .bbt-info a{color:var(--green);font-weight:600;}
  .col-filter-menu{position:fixed;z-index:300;display:none;width:264px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px;box-shadow:0 16px 40px -10px rgba(18,33,12,.28);font-size:.82rem;color:var(--ink);}
  .col-filter-menu .cf-heading{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--faint);margin:2px 2px 6px;}
  .col-filter-menu .cf-cond{display:flex;flex-direction:column;gap:6px;}
  .col-filter-menu .cf-vals{display:flex;gap:6px;}
  .col-filter-menu input[type=text],.col-filter-menu input[type=number],.col-filter-menu input[type=date]{width:100%;min-width:0;box-sizing:border-box;background:var(--panel-2);border:1px solid var(--line);border-radius:8px;padding:7px 9px;color:var(--ink);font:inherit;font-size:.82rem;outline:none;}
  .col-filter-menu input:focus{border-color:var(--green-bright);}
  .col-filter-menu .cf-opsel{position:relative;}
  .col-filter-menu .cf-opbtn{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--panel-2);border:1px solid var(--line);border-radius:8px;padding:7px 9px;color:var(--ink);font:inherit;font-size:.82rem;cursor:pointer;text-align:left;}
  .col-filter-menu .cf-opcaret .ico{width:13px;height:13px;transform:rotate(90deg);color:var(--faint);}
  .col-filter-menu .cf-opmenu{display:none;position:absolute;top:calc(100% + 3px);left:0;right:0;background:#fff;border:1px solid var(--line);border-radius:8px;padding:4px;max-height:240px;overflow-y:auto;z-index:2;box-shadow:0 12px 28px -8px rgba(18,33,12,.25);}
  .col-filter-menu .cf-opmenu.open{display:block;}
  .col-filter-menu .cf-opopt{padding:6px 9px;border-radius:6px;cursor:pointer;}
  .col-filter-menu .cf-opopt:hover{background:var(--panel-2);}
  .col-filter-menu .cf-opsep,.col-filter-menu .cf-sep{height:1px;background:var(--line-soft);margin:6px 0;}
  .col-filter-menu .cf-opsep{margin:4px 2px;}
  .col-filter-menu .cf-actions{display:flex;justify-content:space-between;padding:6px 2px 2px;}
  .col-filter-menu .cf-actions a{font-size:.74rem;color:var(--green);font-weight:600;}
  .col-filter-menu .cf-list{max-height:210px;overflow-y:auto;margin:2px -2px;scrollbar-width:thin;scrollbar-color:#b9c3ae transparent;}
  .col-filter-menu .cf-item{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:6px;cursor:pointer;}
  .col-filter-menu .cf-item:hover{background:var(--panel-2);}
  .col-filter-menu .cf-item input{width:15px;height:15px;margin:0;flex:0 0 15px;accent-color:var(--green-dark);}
  .col-filter-menu .cf-lbl{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .col-filter-menu .cf-count{font-size:.7rem;color:var(--faint);}
  .col-filter-menu .cf-sort{display:block;width:100%;text-align:left;background:none;border:0;color:var(--ink);font:inherit;font-size:.82rem;padding:6px 8px;border-radius:6px;cursor:pointer;}
  .col-filter-menu .cf-sort:hover{background:var(--panel-2);}
  .col-filter-menu .cf-reset{color:var(--red);}

  /* ── Popups (BB.popup): details open over the page instead of navigating away ── */
  .bbp-back{position:fixed;inset:0;z-index:400;background:rgba(10,18,6,.42);display:flex;align-items:center;justify-content:center;padding:24px;opacity:0;transition:opacity .15s;}
  .bbp-back.show{opacity:1;}
  .bbp{background:#fff;border-radius:16px;box-shadow:0 30px 70px -20px rgba(10,20,6,.5);width:min(640px,100%);max-height:min(82vh,760px);display:flex;flex-direction:column;overflow:hidden;transform:translateY(8px);transition:transform .15s;}
  .bbp-back.show .bbp{transform:none;}
  .bbp.wide{width:min(920px,100%);}
  .bbp-h{display:flex;align-items:flex-start;gap:12px;padding:18px 20px 14px;border-bottom:1px solid var(--line-soft);}
  .bbp-h .sw{width:12px;height:12px;border-radius:4px;margin-top:6px;flex:none;}
  .bbp-h .t{flex:1;min-width:0;}
  .bbp-h .eb{font-size:.64rem;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:var(--green-mid);}
  .bbp-h h3{font-family:var(--display);font-weight:600;font-size:1.18rem;color:var(--green-darkest);line-height:1.25;}
  .bbp-h .sub{font-size:.82rem;color:var(--muted);margin-top:2px;}
  .bbp-x{width:34px;height:34px;border-radius:9px;border:1px solid var(--line);background:#fff;color:var(--muted);cursor:pointer;font-size:1.2rem;line-height:1;flex:none;}
  .bbp-x:hover{border-color:var(--green-bright);color:var(--ink);}
  .bbp-b{padding:16px 20px;overflow:auto;}
  /* figures: one tidy strip (not separate cards) */
  .bbp-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1px;margin-bottom:14px;background:var(--line);border:1px solid var(--line);border-radius:12px;overflow:hidden;}
  .bbp-stats .stat{box-shadow:none;border:0;border-radius:0;background:#fff;padding:10px 12px;min-width:0;}
  .bbp-stats .stat .l{font-size:.6rem;letter-spacing:.6px;}
  .bbp-stats .stat .v{font-size:1.05rem;margin-top:3px;}
  .bbp-stats .stat .s{font-size:.7rem;margin-top:1px;color:var(--faint);}
  .bbp-stats .stat.act{cursor:pointer;transition:background .12s;} .bbp-stats .stat.act:hover{background:var(--panel-2);}
  .bbp-stats .stat.act .v{display:flex;align-items:center;gap:6px;} .bbp-stats .stat.act .v .cv{width:13px;height:13px;color:var(--faint);transform:rotate(90deg);}
  /* the record's details: icon + value, one per line (label on hover) */
  .bbp-meta{display:flex;flex-direction:column;gap:7px;margin:0 0 14px;padding:0;list-style:none;}
  .bbp-meta li{display:flex;align-items:center;gap:10px;font-size:.88rem;color:var(--ink);min-width:0;}
  .bbp-meta li > .ico{width:15px;height:15px;color:var(--faint);flex:none;}
  .bbp-meta li .mv{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .bbp-meta li .mv small{color:var(--faint);font-size:.76rem;margin-left:4px;}
  .bbp-meta li a{color:var(--green);font-weight:600;}
  .bbp-meta .av{width:18px;height:18px;border-radius:50%;flex:none;color:#fff;font-size:.56rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center;font-family:var(--display);}
  .bbp-meta li.muted .mv{color:var(--faint);}
  /* two columns: details + figures on the left, the record's content on the right */
  .bbp-split{display:grid;grid-template-columns:minmax(220px,260px) minmax(0,1fr);gap:20px;align-items:start;}
  .bbp-split > .side .bbp-stats{grid-template-columns:1fr 1fr;margin-bottom:0;}
  .bbp-split > .side .bbp-stats > .stat:last-child:nth-child(odd){grid-column:span 2;}
  .bbp-split > .main > :first-child{margin-top:0;}
  .bbp-split > .main .bbp-tt:first-child{margin-top:0;}
  @media(max-width:760px){ .bbp-split{grid-template-columns:minmax(0,1fr);} }
  .bbp-h .tags{margin-top:6px;}
  /* a slim notice line inside a popup */
  .bbp-alert{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:9px;background:var(--red-bg);color:#8f2a1f;font-size:.82rem;margin:0 0 12px;}
  .bbp-alert .ico{width:15px;height:15px;flex:none;} .bbp-alert.warn{background:var(--amber-bg);color:#7a4a08;}
  /* a compact action row (e.g. the quote) */
  .bbp-bar{display:flex;align-items:center;gap:10px 14px;flex-wrap:wrap;padding:10px 12px;border:1px solid var(--line);border-radius:10px;margin-top:12px;font-size:.84rem;}
  .bbp-bar .sp{flex:1;min-width:10px;}
  .bbp-bar .btn{min-height:32px;}
  /* small themed menu (e.g. pick a status) */
  .bb-pick{position:fixed;z-index:520;background:#fff;border:1px solid var(--line);border-radius:10px;box-shadow:0 16px 40px -10px rgba(18,33,12,.3);padding:4px;min-width:180px;}
  .bb-pick .op{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:7px;cursor:pointer;font-size:.86rem;}
  .bb-pick .op:hover{background:var(--panel-2);} .bb-pick .op .ico{width:14px;height:14px;color:var(--green);margin-left:auto;}
  .bb-pick .hd{padding:6px 10px 4px;font-size:.6rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--faint);}
  .bbp-b table.bb th{position:static;}
  .bbp-b table.bb td:first-child{white-space:nowrap;}
  .bbp-b table.bb td{overflow-wrap:normal;word-break:keep-all;}
  .bbp-tt{font-family:var(--display);font-weight:600;font-size:.9rem;color:var(--green-darkest);margin:14px 0 8px;}
  .bbp-b > .bbp-tt:first-child{margin-top:0;}
  .bbp-b .scroll{border:1px solid var(--line);border-radius:10px;}
  .bbp-b .bbp-note{font-size:.8rem;color:var(--faint);margin-top:10px;}
  .bbp-f{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;padding:12px 20px 16px;border-top:1px solid var(--line-soft);}
  .bbp-f:empty{display:none;}
  @media(max-width:600px){ .bbp-back{align-items:flex-end;padding:0;} .bbp{border-radius:16px 16px 0 0;max-height:88vh;width:100%;} }
  /* clickable chart parts */
  .bbc .hov{cursor:pointer;}
  .bbc .arc{cursor:pointer;transition:opacity .12s;} .bbc .donut-wrap svg:hover .arc{opacity:.55;} .bbc .donut-wrap svg .arc:hover{opacity:1;}
  .donut-legend .r{cursor:pointer;border-radius:6px;padding:2px 4px;margin:0 -4px;} .donut-legend .r:hover{background:var(--panel-2);}
  .hbar{display:block;cursor:pointer;border-radius:8px;padding:4px 6px;margin:-4px -6px;transition:background .12s;} .hbar:hover{background:var(--panel-2);}

  /* ── Ask bar (bb-ask.js): BioBrix Intelligence, docked at the bottom of every page ── */
  body.has-ask main.wrap{padding-bottom:150px;}
  .askdock{position:fixed;z-index:85;bottom:20px;left:calc(var(--nav) + (100vw - var(--nav)) / 2);transform:translateX(-50%);
    width:min(780px, calc(100vw - var(--nav) - 48px));display:flex;flex-direction:column;gap:8px;pointer-events:none;}
  .askdock > *{pointer-events:auto;}
  .ask-sugs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:0 4px;}
  .ask-sugs::-webkit-scrollbar{display:none;}
  .ask-sugs:empty{display:none;}
  .ask-sug{flex:none;display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(183,217,122,.22);background:rgba(18,33,12,.9);backdrop-filter:blur(8px);
    color:rgba(234,244,216,.88);font:inherit;font-size:.76rem;font-weight:500;padding:6px 10px 6px 12px;border-radius:8px;cursor:pointer;transition:border-color .15s,color .15s;}
  .ask-sug:hover{border-color:var(--lime);color:#fff;}
  .ask-sug .ico{width:13px;height:13px;color:var(--lime);}
  .ask-bar{display:flex;align-items:center;gap:8px;padding:8px;border-radius:14px;background:rgba(15,28,10,.95);backdrop-filter:saturate(1.3) blur(12px);
    border:1px solid rgba(183,217,122,.18);box-shadow:0 18px 44px -10px rgba(10,20,6,.55),0 2px 6px rgba(10,20,6,.2);}
  .ask-bar .spark{width:40px;height:40px;border-radius:10px;flex:none;display:flex;align-items:center;justify-content:center;background:linear-gradient(140deg,var(--green-bright),var(--lime));color:#13260c;}
  .ask-bar .spark .ico{width:20px;height:20px;}
  .ask-bar input{flex:1;min-width:0;background:none;border:0;outline:none;color:#fff;font:inherit;font-size:.95rem;padding:10px 4px;}
  .ask-bar input::placeholder{color:rgba(234,244,216,.55);}
  .ask-ib{width:38px;height:38px;border-radius:9px;flex:none;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(183,217,122,.18);background:rgba(255,255,255,.04);
    color:rgba(234,244,216,.8);cursor:pointer;transition:border-color .15s,color .15s;font:inherit;font-size:1.1rem;line-height:1;}
  .ask-ib:hover{border-color:var(--lime);color:#fff;}
  .ask-ib .ico{width:17px;height:17px;}
  .ask-ib.go{background:var(--lime);border-color:var(--lime);color:#13260c;}
  .ask-ib.go:hover{background:#a9cf68;color:#13260c;}
  .ask-ib.minb{width:30px;border-color:transparent;background:none;}
  .ask-fab{display:none;align-items:center;gap:8px;align-self:flex-end;padding:10px 16px 10px 12px;border-radius:999px;border:1px solid rgba(183,217,122,.25);background:rgba(15,28,10,.95);
    color:#eaf4d8;font:inherit;font-size:.84rem;font-weight:600;cursor:pointer;box-shadow:0 12px 30px -8px rgba(10,20,6,.5);}
  .ask-fab .ico{width:18px;height:18px;color:var(--lime);}
  .askdock.min{left:auto;right:24px;transform:none;width:auto;}
  .askdock.min .ask-bar,.askdock.min .ask-sugs,.askdock.min .ask-panel{display:none !important;}
  .askdock.min .ask-fab{display:inline-flex;}
  body.has-ask .toast{bottom:120px;}
  .ask-panel{display:none;flex-direction:column;border-radius:14px;background:rgba(15,28,10,.97);backdrop-filter:blur(12px);border:1px solid rgba(183,217,122,.18);color:#eaf4d8;
    box-shadow:0 18px 44px -10px rgba(10,20,6,.55);max-height:min(56vh,540px);overflow:hidden;}
  .askdock.open .ask-panel{display:flex;}
  .ask-ph{display:flex;align-items:center;gap:10px;padding:14px 12px 10px 16px;border-bottom:1px solid rgba(183,217,122,.12);}
  .ask-ti{flex:1;min-width:0;display:flex;align-items:center;gap:10px;}
  .ask-ti .ico{width:16px;height:16px;color:var(--lime);flex:none;}
  .ask-ti h4{font-family:var(--display);font-weight:600;font-size:.98rem;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .ask-x{width:30px;height:30px;border-radius:8px;border:0;background:none;color:rgba(234,244,216,.7);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:1.1rem;}
  .ask-x:hover{color:#fff;background:rgba(255,255,255,.06);}
  .ask-log{overflow:auto;padding:12px 16px 14px;font-size:.88rem;line-height:1.6;}
  .ask-q{font-size:.74rem;color:rgba(234,244,216,.5);margin-bottom:8px;}
  .ask-ai p{margin:0 0 6px;} .ask-ai p.h{font-weight:700;color:#fff;margin-top:6px;}
  .ask-ai ul,.ask-ai ol{margin:2px 0 8px 18px;} .ask-ai li{margin:2px 0;}
  .ask-ai b{color:#fff;}
  .ask-ai a{color:var(--lime);font-weight:600;text-decoration:underline;text-underline-offset:2px;}
  .ask-ai code{font-size:.82em;background:rgba(255,255,255,.08);padding:1px 4px;border-radius:4px;}
  .ask-note{font-size:.74rem;color:rgba(234,244,216,.5);margin-top:8px;}
  .ask-show{border-radius:10px;padding:12px;background:#fff;color:var(--ink);margin:8px 0 10px;}
  .ask-sh{font-family:var(--display);font-weight:600;font-size:.86rem;color:var(--green-darkest);margin-bottom:8px;}
  .ask-tbl{max-height:260px;overflow:auto;} .ask-tbl table.bb{font-size:.8rem;} .ask-tbl table.bb th,.ask-tbl table.bb td{padding:7px 10px;}
  .ask-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;} .ask-stats .stat{box-shadow:none;padding:10px 12px;} .ask-stats .stat .v{font-size:1.15rem;}
  .ask-confirm{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px;margin:8px 0;border-radius:10px;background:rgba(199,125,23,.14);border:1px solid rgba(199,125,23,.45);font-size:.82rem;color:#f6dfb4;}
  .ask-confirm > .ico{width:16px;height:16px;color:#e7a948;}
  .ask-confirm span{flex:1;min-width:180px;} .ask-confirm b{color:#fff;} .ask-confirm em{font-style:normal;font-weight:600;}
  .ask-confirm .btn.ghost{background:none;color:#eaf4d8;border-color:rgba(183,217,122,.3);}
  .ask-empty{font-size:.84rem;color:rgba(234,244,216,.65);}
  .ask-busy{display:flex;align-items:center;gap:10px;font-size:.8rem;color:rgba(234,244,216,.65);padding:4px 0;}
  .ask-busy .dots{display:inline-flex;gap:4px;} .ask-busy i{width:6px;height:6px;border-radius:50%;background:var(--lime);animation:bbpulse 1s infinite;}
  .ask-busy i:nth-child(2){animation-delay:.15s;} .ask-busy i:nth-child(3){animation-delay:.3s;}
  .ask-ft{display:flex;gap:8px;flex-wrap:wrap;padding:0 16px 14px;}
  .ask-ft a{display:inline-flex;align-items:center;gap:6px;font-size:.8rem;font-weight:600;padding:7px 12px;border-radius:8px;border:1px solid rgba(183,217,122,.25);color:#eaf4d8;}
  .ask-ft a:hover{border-color:var(--lime);color:#fff;}
  .ask-ft a.pri{background:var(--lime);border-color:var(--lime);color:#13260c;}
  .ask-ft a .ico{width:14px;height:14px;}
  @media(max-width:900px){
    .askdock{left:10px;right:10px;width:auto;transform:none;bottom:calc(72px + env(safe-area-inset-bottom));}
    .askdock.min{left:auto;right:12px;}
    body.has-ask main.wrap{padding-bottom:170px;}
    .ask-ib.minb{display:none;}
    /* phones: the suggestions show once the bar is in use, not over the page all the time */
    .askdock:not(:focus-within):not(.open) .ask-sugs{display:none;}
    body.has-ask main.wrap{padding-bottom:120px;}
    .ask-panel{max-height:62vh;}
    body.has-ask .toast{bottom:150px;}
  }
  @media print{ .askdock{display:none !important;} }

  /* ── Phone / tablet ───────────────────────────────────────────────────── */
  #bbOverlay{display:none;}
  @media(max-width:900px){
    body{padding-left:0;padding-bottom:76px;}
    #bbNav{transform:translateX(-100%);transition:transform .22s ease;width:min(86vw,300px);box-shadow:none;}
    body.nav-open #bbNav{transform:none;box-shadow:20px 0 60px rgba(0,0,0,.35);}
    body.nav-open #bbOverlay{display:block;position:fixed;inset:0;background:rgba(10,18,6,.45);z-index:95;}
    .rail-flyout{position:static;opacity:1;visibility:visible;transform:none;pointer-events:auto;display:none;}
    .rail-tab.open>.rail-flyout{display:block;}
    .rail-flyout-card{border:0;border-radius:0;box-shadow:none;background:rgba(0,0,0,.18);padding:4px 10px 8px 30px;min-width:0;max-height:none;}
    .rail-flyout-head{display:none;}
    .search-preview{display:none !important;}
    .bb-burger{display:inline-flex;}
    .bb-top-in{padding:0 16px;gap:10px;}
    .bb-user .who{display:none;}
    .bb-net span.t{display:none;}
    .bb-net.off span.t,.bb-net.stale span.t{display:inline;}   /* offline is said in words, not just a dot */
    .bb-nav{display:flex;}
    .toast{bottom:86px;}
    .wrap{padding:0 16px 32px;}
    .bb-scope{padding:7px 16px;}
  }
  @media(max-width:480px){
    .page-head h1{font-size:1.3rem;}
    .page-head p{font-size:.86rem;}
    .stat .v{font-size:1.3rem;}
    .sec .ln{display:none;}
    .sec .cnt{flex:1 1 100%;order:3;}
    .bb-crumbs .cat{display:none;}
    .bb-crumbs .cat + .sep{display:none;}
    .bb-sample{font-size:.78rem;padding:9px 11px;gap:8px;}
    .row > *{min-width:0;max-width:100%;}
    .row [style*="flex:none"], .row [style*="flex: none"]{flex:0 1 auto !important;}
    .card, .card-p, main.wrap, .stat{max-width:100%;}
    .card-p{padding:14px;} .card-h{padding:12px 14px;}
    .seg{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;} .seg button,.seg a{white-space:nowrap;flex:none;}
  }
  @media print{
    body{padding:0 !important;background:#fff;}
    #bbNav,#bbOverlay,.bb-top,.bb-nav,.toast,.bbc-tip{display:none !important;}
    .wrap{max-width:none;padding:0;}
    .card,.stat{box-shadow:none;break-inside:avoid;}
  }


  /* ── Phones, from the usability review ── */
  html.bbp-lock .askdock{display:none !important;}               /* a popup has the screen; the Ask bar steps aside */
  @media (max-width:900px){
    /* the Ask bar slides away while you scroll down and comes back when you scroll up or stop near the end */
    .askdock{transition:transform .2s ease, opacity .2s ease;}
    body.scroll-down .askdock:not(.open):not(:focus-within){transform:translateY(calc(100% + 90px));opacity:0;pointer-events:none;}
    /* the seat banner scrolls away instead of riding in the sticky header */
    body.scrolled .bb-scope{display:none;}
    /* a table's action column (a button, a status picker, a field) stays on screen */
    .scroll table.bb td:last-child:has(button, select, a.btn, input:not([type=checkbox])), .scroll table.bb tr:has(td:last-child :is(button, select, a.btn)) th:last-child{position:sticky;right:0;}
    .scroll table.bb td:last-child:has(button, select, a.btn, input:not([type=checkbox])){background:#fff;box-shadow:-10px 0 10px -10px rgba(18,33,12,.25);z-index:1;}
    .scroll table.bb tr:has(td:last-child :is(button, select, a.btn)) th:last-child{z-index:2;background:var(--panel-2);box-shadow:-10px 0 10px -10px rgba(18,33,12,.2);}
    /* the work before the charts: pages that opt in (body.work-first) put chart-only blocks last */
    body.work-first main.wrap, body.work-first main.wrap > div:only-child{display:flex;flex-direction:column;}   /* a page may wrap everything in one div */
    body.work-first main.wrap > *:has(.bbc, .hbars, .donut-wrap):not(:has(table.bb:not([data-nofilter]):not(.bbc table))):not(:has(.alert-list, .alert, .take)),
    body.work-first main.wrap > div:only-child > *:has(.bbc, .hbars, .donut-wrap):not(:has(table.bb:not([data-nofilter]):not(.bbc table))):not(:has(.alert-list, .alert, .take)){order:5;}
  }

  /* ── Phones and touch screens (mobile pass, Oct 2026) ── */
  @media (max-width:900px){
    /* iOS zooms into any field under 16px: keep every field at 16px on phones */
    input:not([type=checkbox]):not([type=radio]), select, textarea, .bb-sel-btn, .col-filter-menu input, .bb-sel-menu .sq input{font-size:16px !important;}
    /* readable minimum for the small uppercase labels */
    table.bb th, .stat .l, .eyebrow, .tag, .badge, .crop-chip, .bbp-stats .stat .l, .card-h .sub, .sec .cnt, .bbp-h .eb{font-size:11.5px !important;}
    .mo-kpi .l{font-size:10.5px !important;}
    .stat .s, .faint, small{font-size:max(12px, .76rem);}
  }
  @media (pointer:coarse){
    /* bigger hit areas without bigger visuals */
    .th-filter{position:relative;opacity:.8;}
    .th-filter::after{content:"";position:absolute;inset:-10px -8px;}
    .btn.sm{min-height:40px;padding:8px 12px;}
    .chip{min-height:36px;padding:7px 12px;}
    .seg button,.seg a{min-height:36px;padding:8px 12px;}
    .tog{min-height:36px;}
    .bbc-table summary{padding:10px 0;display:inline-block;}
    .donut-legend .r{padding:8px 4px;}
    .hbar{padding:8px 6px;}
    .bb-back{min-height:40px;padding:8px 12px 8px 8px;}
    .bb-cal .cg button{height:40px;}
    .bb-sel-menu .op, .bb-pick .op, .cf-opopt, .col-filter-menu .cf-item, .col-filter-menu .cf-sort{padding-top:11px !important;padding-bottom:11px !important;}
    table.bb td a{display:inline-block;padding:6px 0;}
    /* phones bring up a number keypad; the tiny up/down arrows are just in the way */
    .bb-numw .st{display:none;}
    .bb-numw input{padding-right:12px !important;}
  }
  @media (prefers-reduced-motion: reduce){ *{transition:none !important;animation:none !important;} }
  `;

  // ---- escape ---------------------------------------------------
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  // ---- Icons (Lucide-style line icons, 24px grid) -----------------
  var IC = {
    home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
    sales:'<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    truck:'<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    sprout:'<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
    wallet:'<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    sparkles:'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    search:'<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    chevron:'<path d="m9 18 6-6-6-6"/>',
    logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/>',
    package:'<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/>',
    receipt:'<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    chart:'<path d="M3 3v18h18"/><path d="M7 16v-5M12 16V8M17 16V6"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    percent:'<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    map:'<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    board:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    moving:'<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>',
    warehouse:'<path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12M6 14h12"/><path d="M6 22V10h12v12"/>',
    link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    tag:'<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    leaf:'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    flask:'<path d="M9 3h6"/><path d="M10 3v6.5L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9.5V3"/><path d="M7 15h10"/>',
    eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    clipboard:'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    folder:'<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    farm:'<path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M9 21v-6h6v6"/>',
    monitor:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    file:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h8M8 17h5"/>',
    alert:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    check:'<path d="M20 6 9 17l-5-5"/>',
    phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    message:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    refresh:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    filter:'<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    dot:'<circle cx="12" cy="12" r="3"/>'
  };
  function icon(name, cls){ return '<svg class="ico'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+(IC[name]||IC.dot)+'</svg>'; }

  // ---- The rail: categories → pages --------------------------------
  // Same shape as the Sphere / SureWay portals: a short rail of CATEGORIES, each opening a
  // flyout of its pages. Every page is filtered through BB.auth.canPage, so the rail never offers
  // a seat a page it can't open. Anything not listed here simply isn't in the menu.
  var RAIL = [
    { key:'home', icon:'home', label:'Home', items:[
      { href:'index.html', icon:'home', label:'Today' },
      { href:'team.html', icon:'message', label:'Team feed', kw:'chat updates' },
      { href:'showcase.html', icon:'monitor', label:'Device showcase' } ]},
    { key:'sales', icon:'sales', label:'Sales', items:[
      { href:'voice-order.html', icon:'mic', label:'Capture an order', kw:'voice new order speak' },
      { href:'orders.html', icon:'receipt', label:'Orders', kw:'quotes approve' },
      { href:'forecast.html', icon:'chart', label:'Sales forecast', kw:'pipeline' },
      { href:'forecast-plan.html', icon:'target', label:'Forecast & actual', kw:'plan budget' },
      { href:'sales-report.html', icon:'sales', label:'Sales report', kw:'weekly monthly' },
      { href:'commission.html', icon:'percent', label:'Commission', kw:'reps pay' },
      { href:'territory.html', icon:'map', label:'Territory potential', kw:'country region map' } ]},
    { key:'ops', icon:'truck', label:'Operations', items:[
      { href:'operations.html', icon:'board', label:'Operations board', kw:'board overview' },
      { href:'dispatch.html', icon:'moving', label:'Product movement', kw:'dispatch moving what is moving units out' },
      { href:'deliveries.html', icon:'truck', label:'Logistics & dispatch', kw:'deliveries transport' },
      { href:'stock.html', icon:'package', label:'Stock', kw:'inventory reorder' },
      { href:'depots.html', icon:'warehouse', label:'Depots', kw:'warehouse blending' },
      { href:'suppliers.html', icon:'link', label:'Suppliers', kw:'supply' },
      { href:'labels.html', icon:'tag', label:'Labels', kw:'print' } ]},
    { key:'bio', icon:'sprout', label:'BioServices', items:[
      { href:'bioservices.html', icon:'sprout', label:'BioServices hub', kw:'renewag' },
      { href:'farms.html', icon:'farm', label:'Farms & farmers', kw:'customers clients' },
      { href:'bioanalyze-soil.html', icon:'flask', label:'BioAnalyze — Soil', kw:'samples lab' },
      { href:'bioanalyze-leaf.html', icon:'leaf', label:'BioAnalyze — Leaf', kw:'samples lab sap' },
      { href:'biowatch.html', icon:'eye', label:'BioWatch', kw:'monitoring visits' },
      { href:'bioconsult.html', icon:'clipboard', label:'BioConsult', kw:'recommendations programme' },
      { href:'products-library.html', icon:'book', label:'Product library', kw:'data sheets' },
      { href:'farm-files.html', icon:'folder', label:'Farm files', kw:'documents' },
      { href:'client-portal.html', icon:'user', label:'Farmer portal preview', kw:'client customer view' } ]},
    { key:'finance', icon:'wallet', label:'Finance', items:[
      { href:'finance.html', icon:'wallet', label:'Finance & reconciliation', kw:'debtors invoices sage accounts' } ]},
    { key:'jobs', icon:'wrench', label:'Jobs to FreedomHub', direct:true, items:[
      { href:'jobs.html', icon:'wrench', label:'Jobs to FreedomHub', kw:'request support' } ]}
  ];
  // Pages that aren't in the menu but belong to a category (drill-downs) — for breadcrumbs + active state.
  var PARENT = { 'farm-detail.html':'farms.html', 'document.html':'farm-files.html' };
  // A farmer's rail is their own farm, nothing else.
  var FARMER_RAIL = [
    { key:'farm', icon:'farm', label:'My farm', direct:true, items:[{ href:'client-portal.html', icon:'farm', label:'My farm' }]},
    { key:'orders', icon:'package', label:'My orders', direct:true, items:[{ href:'client-portal.html#orders', icon:'package', label:'My orders' }]},
    { key:'account', icon:'receipt', label:'My account', direct:true, items:[{ href:'client-portal.html#account', icon:'receipt', label:'My account' }]},
    { key:'docs', icon:'folder', label:'Documents', direct:true, items:[{ href:'client-portal.html#docs', icon:'folder', label:'Documents' }]}
  ];

  function curFile(){ var f=location.pathname.split('/').pop()||'index.html'; if(f.indexOf('.')<0) f+='.html'; return f; }
  function canGo(href){ try{ return !(window.BB.auth && typeof BB.auth.canPage==='function') || BB.auth.canPage(href); }catch(e){ return true; } }
  function railBuckets(){
    var rk = (window.BB.user && window.BB.user.roleKey) || 'director';
    if(rk==='farmer') return FARMER_RAIL;
    return RAIL.map(function(c){
      return { key:c.key, icon:c.icon, label:c.label, direct:c.direct, items:c.items.filter(function(it){ return canGo(it.href); }) };
    }).filter(function(c){ return c.items.length; });
  }
  function isHere(href){
    var f = curFile(), h = href.split('#')[0];
    if(h===f){ var hash=href.split('#')[1]||''; return !hash || location.hash==='#'+hash || (!location.hash && !hash); }
    return PARENT[f]===h;
  }
  function whereAmI(){
    var bs = railBuckets();
    for(var i=0;i<bs.length;i++) for(var j=0;j<bs[i].items.length;j++) if(isHere(bs[i].items[j].href)) return { cat:bs[i], item:bs[i].items[j] };
    return null;
  }

  // Every page this seat can open, flat (the Ask bar uses it to navigate and to list pages).
  function railPages(){ var out=[]; railBuckets().forEach(function(b){ b.items.forEach(function(it){ out.push({ href:it.href, label:it.label, cat:b.label }); }); }); return out; }

  function navInnerHtml(){
    var u = (window.BB && BB.user) || { name:'BioBrix', role:'—' };
    var isMobile = (function(){ try{ return window.matchMedia('(max-width:900px)').matches; }catch(e){ return false; } })();
    var items = railBuckets().map(function(b){
      var hasActive = b.items.some(function(it){ return isHere(it.href); });
      if(b.direct){
        var it=b.items[0];
        return '<div class="rail-tab'+(hasActive?' active':'')+'"><a href="'+it.href+'" class="rail-head">'+icon(b.icon)+'<span class="rt-label">'+esc(b.label)+'</span></a></div>';
      }
      var links = b.items.map(function(it){
        return '<a href="'+it.href+'" class="nav-item'+(isHere(it.href)?' active':'')+'">'+icon(it.icon)+esc(it.label)+'</a>';
      }).join('');
      return '<div class="rail-tab'+(hasActive?' active':'')+((hasActive&&isMobile)?' open':'')+'">'+
        '<button type="button" class="rail-head" onclick="BB.toggleRail(this)" aria-haspopup="true">'+icon(b.icon)+'<span class="rt-label">'+esc(b.label)+'</span>'+icon('chevron','rt-caret')+'</button>'+
        '<div class="rail-flyout"><div class="rail-flyout-card"><div class="rail-flyout-head">'+esc(b.label)+'</div>'+
        '<div class="rail-flyout-grid">'+links+'</div></div></div></div>';
    }).join('');
    return '<a class="nav-brand" href="index.html"><div class="bb-mark">B</div><div><div class="bb-word">BIOBRIX <span class="os">OS</span></div><div class="bb-sub">The Biological Way</div></div></a>'+
      '<div class="nav-seat"><div class="bb-av">'+initials(u.name)+'</div><div style="min-width:0"><div class="nm">'+esc(u.name)+'</div><div class="rl">'+esc(u.role)+'</div></div></div>'+
      '<div class="nav-search">'+icon('search')+'<input id="nav-search" type="search" placeholder="Search pages, farmers, orders…" autocomplete="off" aria-label="Search the menu" oninput="BB.filterNav(this.value)" onkeydown="BB.navSearchKey(event)"></div>'+
      '<div id="nav-results" style="display:none"></div>'+
      '<div id="nav-preview" class="rail-flyout search-preview" hidden></div>'+
      '<div class="nav-label">Workspace</div>'+
      '<div id="nav-items" class="rail">'+items+'</div>'+
      '<div class="nav-footer"><b>FreedomHub</b> · Business OS<br>freedomhub.io</div>';
  }

  // Click a category to open its flyout (one open at a time); click it again, another, or outside to close.
  function toggleRail(btn){
    var tab = btn.closest('.rail-tab'); if(!tab) return;
    var wasOpen = tab.classList.contains('open');
    closeRail();
    if(!wasOpen){ railPos(btn); tab.classList.add('open'); setTimeout(function(){ document.addEventListener('click', railOutside); },0); }
  }
  function closeRail(){
    document.querySelectorAll('#nav-items .rail-tab.open').forEach(function(t){ t.classList.remove('open'); });
    document.removeEventListener('click', railOutside);
  }
  function railOutside(e){ if(e.target.closest && e.target.closest('.rail-tab.open')) return; closeRail(); }
  // The flyout is position:fixed (so the rail's scroll can't clip it), flush against the rail's edge.
  function railPos(head){
    try{
      if(window.matchMedia('(max-width:900px)').matches) return;
      var tab=head.closest('.rail-tab'), fly=tab&&tab.querySelector('.rail-flyout'); if(!fly) return;
      var navR=document.getElementById('bbNav').getBoundingClientRect(), r=head.getBoundingClientRect();
      var h=fly.offsetHeight||300;
      fly.style.top=Math.max(8, Math.min(r.top-4, window.innerHeight-12-h))+'px';
      fly.style.left=navR.right+'px';
    }catch(e){}
  }
  // Menu search: swap the rail for a flat jump-to list; each hit says which category it lives in,
  // and hovering/arrowing a hit floats that category beside it — so search teaches the layout too.
  var navHits=[];
  function filterNav(q){
    q=(q||'').trim().toLowerCase();
    var items=document.getElementById('nav-items'), results=document.getElementById('nav-results'), preview=document.getElementById('nav-preview');
    if(!items||!results) return;
    if(preview) preview.hidden=true;
    if(!q){ results.style.display='none'; results.innerHTML=''; items.style.display=''; navHits=[]; return; }
    navHits=[];
    railBuckets().forEach(function(b){ b.items.forEach(function(it){
      if(it.label.toLowerCase().indexOf(q)>=0 || b.label.toLowerCase().indexOf(q)>=0 || String(it.kw||'').toLowerCase().split(/[,\s]+/).some(function(k){ return k && k.indexOf(q)===0; }))
        navHits.push({ href:it.href, icon:it.icon, label:it.label, cat:b });
    }); });
    var pages=navHits.length;
    // records too: a farmer, a farm, an order or an invoice ref — only what this seat may see
    if(q.length>=2 && window.BB.data) try{
      var D=BB.data, has=function(t){ return String(t||'').toLowerCase().indexOf(q)>=0; }, rec=[], cap=8;
      var farmCat={ label:'Farmer', direct:true, items:[] }, ordCat={ label:'Order', direct:true, items:[] }, invCat={ label:'Invoice', direct:true, items:[] };
      D.all('farmers').forEach(function(f){ if(rec.length<cap && (has(f.name)||has(f.farm)))
        rec.push({ href:canGo('farm-detail.html')?'farm-detail.html?farmer='+encodeURIComponent(f.id):canGo('farms.html')?'farms.html':null, icon:'user', label:f.name+(f.farm&&f.farm!==f.name?' · '+f.farm:''), cat:farmCat }); });
      D.all('orders').forEach(function(o){ if(rec.length<cap && has(o.ref))
        rec.push({ href:canGo('orders.html')?'orders.html?open='+encodeURIComponent(o.id):null, icon:'receipt', label:o.ref+' · '+D.farmer(o.farmer).name, cat:ordCat }); });
      D.all('invoices').forEach(function(i){ var r=i.label||i.ref; if(rec.length<cap && has(r))
        rec.push({ href:canGo('finance.html')?'finance.html?cust='+encodeURIComponent(i.farmer||''):canGo('farm-detail.html')&&i.farmer?'farm-detail.html?farmer='+encodeURIComponent(i.farmer):null, icon:'file', label:r+' · '+D.farmer(i.farmer).name, cat:invCat }); });
      navHits=navHits.concat(rec.filter(function(h){ return h.href; }));
    }catch(e){ console.warn('record search', e); }
    items.style.display='none'; results.style.display='';
    if(!navHits.length){ results.innerHTML='<div class="nav-noresult">Nothing matches “'+esc(q)+'”.</div>'; return; }
    results.innerHTML=navHits.map(function(h,i){
      var k=h.label.toLowerCase().indexOf(q);
      var lbl = k<0 ? esc(h.label) : esc(h.label.slice(0,k))+'<b>'+esc(h.label.slice(k,k+q.length))+'</b>'+esc(h.label.slice(k+q.length));
      return (i===pages && pages? '<div class="sr-head">Records</div>' : '')+'<a href="'+h.href+'" class="search-result" data-i="'+i+'" onmouseenter="BB.navSearchActive('+i+')">'+icon(h.icon)+'<span class="sr-label">'+lbl+'</span><span class="sr-tag">'+esc(h.cat.label)+'</span></a>';
    }).join('');
  }
  function navSearchActive(i){
    var results=document.getElementById('nav-results'); if(!results) return;
    var rows=[].slice.call(results.querySelectorAll('.search-result')); if(!rows.length) return;
    i=Math.max(0,Math.min(rows.length-1,i));
    rows.forEach(function(r){ r.classList.remove('sr-active'); }); rows[i].classList.add('sr-active'); rows[i].scrollIntoView({block:'nearest'});
    var preview=document.getElementById('nav-preview'), hit=navHits[i];
    if(!preview||!hit||hit.cat.direct||window.matchMedia('(max-width:900px)').matches){ if(preview) preview.hidden=true; return; }
    preview.innerHTML='<div class="rail-flyout-card"><div class="rail-flyout-head">'+esc(hit.cat.label)+'</div><div class="rail-flyout-grid">'+
      hit.cat.items.map(function(it){ return '<a href="'+it.href+'" class="nav-item'+(it.href===hit.href?' match':'')+(isHere(it.href)?' active':'')+'">'+icon(it.icon)+esc(it.label)+'</a>'; }).join('')+'</div></div>';
    preview.hidden=false;
    var navR=document.getElementById('bbNav').getBoundingClientRect(), r=rows[i].getBoundingClientRect(), h=preview.offsetHeight||300;
    preview.style.top=Math.max(8,Math.min(r.top-4,window.innerHeight-12-h))+'px'; preview.style.left=navR.right+'px';
  }
  function navSearchKey(e){
    if(e.key==='Escape'){ e.target.value=''; filterNav(''); return; }
    var results=document.getElementById('nav-results'); var rows=results?[].slice.call(results.querySelectorAll('.search-result')):[];
    if(!rows.length) return;
    var cur=rows.findIndex(function(r){ return r.classList.contains('sr-active'); });
    if(e.key==='ArrowDown'){ e.preventDefault(); navSearchActive(cur<0?0:cur+1); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); navSearchActive(cur<0?0:cur-1); }
    else if(e.key==='Enter'){ e.preventDefault(); var r=rows[cur<0?0:cur]; if(r) location.href=r.getAttribute('href'); }
  }
  function toggleNav(force){
    var open = typeof force==='boolean' ? force : !document.body.classList.contains('nav-open');
    document.body.classList.toggle('nav-open', open);
  }
  function toggleUser(e){
    e.stopPropagation();
    var el=e.currentTarget, open=el.classList.toggle('open');
    if(open){ var close=function(ev){ if(ev.target.closest && ev.target.closest('.bb-menu')) return; el.classList.remove('open'); document.removeEventListener('click',close); }; setTimeout(function(){ document.addEventListener('click',close); },0); }
  }

  // ---- Bottom bar (phones): each seat gets a bar tailored to its job ----------
  var HOME = { id:'home', href:'index.html', icon:'home', label:'Home' };
  var NAVS = {
    director: [ HOME,
      { id:'sales', href:'orders.html',      icon:'receipt', label:'Sales' },
      { id:'ops',   href:'operations.html',  icon:'board', label:'Ops' },
      { id:'tech',  href:'bioservices.html', icon:'sprout', label:'BioServices' },
      { id:'voice', href:'voice-order.html', icon:'mic', label:'Capture' } ],
    advisor: [ HOME,
      { id:'voice', href:'voice-order.html', icon:'mic', label:'Capture' },
      { id:'tech',  href:'bioservices.html', icon:'sprout', label:'BioServices' },
      { id:'farms', href:'farms.html',       icon:'farm', label:'Farms' },
      { id:'sales', href:'orders.html',      icon:'receipt', label:'Orders' } ],
    operations: [ HOME,
      { id:'sales', href:'orders.html',      icon:'receipt', label:'Orders' },
      { id:'ops',   href:'operations.html',  icon:'board', label:'Board' },
      { id:'stock', href:'stock.html',       icon:'package', label:'Stock' },
      { id:'sup',   href:'suppliers.html',   icon:'link', label:'Suppliers' } ],
    finance: [ HOME,
      { id:'finance', href:'finance.html',   icon:'wallet', label:'Finance' },
      { id:'sales', href:'orders.html',      icon:'receipt', label:'Orders' },
      { id:'ops',   href:'operations.html',  icon:'board', label:'Board' },
      { id:'jobs',  href:'jobs.html',        icon:'wrench', label:'Jobs' } ],
    farmer: [
      { id:'home',   href:'client-portal.html',         icon:'farm', label:'My farm' },
      { id:'orders', href:'client-portal.html#orders',  icon:'package', label:'Orders' },
      { id:'account',href:'client-portal.html#account', icon:'receipt', label:'Account' },
      { id:'docs',   href:'client-portal.html#docs',    icon:'folder', label:'Documents' } ],
    warehouse: [ HOME,
      { id:'dispatch', href:'dispatch.html', icon:'moving', label:'Movement' },
      { id:'stock', href:'stock.html',       icon:'package', label:'Stock' },
      { id:'depots',href:'depots.html',      icon:'warehouse', label:'Depots' },
      { id:'deliveries', href:'deliveries.html', icon:'truck', label:'Deliveries' } ]
  };
  function bottomNav(active){
    var rk = (window.BB.user && window.BB.user.roleKey) || 'director';
    var navItems = NAVS[rk] || NAVS.director;
    // The bar must obey the same access rules as everything else, then fill gaps with what this seat has.
    try{
      if(window.BB.auth && typeof BB.auth.canPage === 'function'){
        var swapped = navItems.filter(function(n){ return n.id==='home' || canGo(n.href); });
        [ { id:'finance', href:'finance.html', icon:'wallet', label:'Finance' },
          { id:'salesreport', href:'sales-report.html', icon:'sales', label:'Sales' },
          { id:'plan', href:'forecast-plan.html', icon:'target', label:'Forecast' },
          { id:'farms', href:'farms.html', icon:'farm', label:'Customers' },
          { id:'ops', href:'operations.html', icon:'board', label:'Board' },
          { id:'dispatch', href:'dispatch.html', icon:'moving', label:'Moving' },
          { id:'commission', href:'commission.html', icon:'percent', label:'Commission' },
          { id:'jobs', href:'jobs.html', icon:'wrench', label:'Jobs' } ].forEach(function(sp){
          if(swapped.length>=5 || !canGo(sp.href) || swapped.some(function(n){ return n.id===sp.id; })) return;
          swapped.push(sp);
        });
        if(swapped.length>1) navItems = swapped.slice(0,5);
      }
    }catch(e){}
    // Light the tab for the page you are on. Only a tab that names a whole area (Sales, Ops,
    // BioServices) stands in for a page it doesn't link to; a tab named for one page ("Orders")
    // never lights up on another page that happens to share its area.
    var here = navItems.filter(function(n){ return isHere(n.href); })[0];
    var AREA = { Sales:1, Ops:1, BioServices:1 };
    var lit = here || navItems.filter(function(n){ return active===n.id && AREA[n.label]; })[0] || null;
    return '<nav class="bb-nav" aria-label="Quick links">'+navItems.map(function(n){
      return '<a href="'+n.href+'" class="'+(lit===n?'on':'')+'"'+(lit===n?' aria-current="page"':'')+'>'+icon(n.icon)+n.label+'</a>';
    }).join('')+'</nav>';
  }

  function initials(name){return String(name||'?').split(/\s+/).map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();}

  var STAT_DETAIL = {};
  function renderHeader(opts){
    opts = opts || {};
    pendingUndo();
    var u = (window.BB && BB.user) || { name:'BioBrix', role:'—' };
    var here = whereAmI();
    // On phones these pages lead with the work (lists, actions) and put chart-only blocks after it.
    if(['index.html','orders.html','deliveries.html','farms.html','bioanalyze-soil.html','bioanalyze-leaf.html','biowatch.html'].indexOf(curFile())>=0) document.body.classList.add('work-first');
    (function(){ var last=window.scrollY, tick=false;
      window.addEventListener('scroll', function(){ if(tick) return; tick=true; requestAnimationFrame(function(){ var y=window.scrollY, nearEnd=(window.innerHeight+y)>=document.documentElement.scrollHeight-40;
        document.body.classList.toggle('scrolled', y>60);
        if(Math.abs(y-last)>6){ document.body.classList.toggle('scroll-down', y>last && y>120 && !nearEnd); last=y; }
        if(nearEnd) document.body.classList.remove('scroll-down');
        tick=false; }); }, { passive:true }); })();
    // Breadcrumb: Category › Page. Drill-downs (farm → farm detail) also get a Back button,
    // since the rail can't say which farm you came from.
    var f = curFile();
    var crumbs = '';
    if(here){
      var parent = PARENT[f];
      crumbs = (here.cat.direct ? '' : '<span class="cat">'+esc(here.cat.label)+'</span>'+icon('chevron','sep'))+
        (parent ? '<a href="'+esc(here.item.href)+'">'+esc(here.item.label)+'</a>'+icon('chevron','sep')+'<span class="here">'+esc(opts.sub||document.title.split('·')[0].trim()||'Detail')+'</span>'
                : '<span class="here">'+esc(here.item.label)+'</span>');
    } else {
      crumbs = '<span class="here">'+esc((document.title||'BioBrix OS').split('·')[0].trim())+'</span>';
    }
    var showBack = opts.back && PARENT[f];
    var top =
    '<header class="bb-top">'+
      '<div class="bb-top-in">'+
        '<button class="bb-burger" type="button" onclick="BB.toggleNav()" aria-label="Open menu">'+icon('menu')+'</button>'+
        (showBack ? '<a class="bb-back" href="'+esc(opts.back)+'">'+icon('chevron')+'Back</a>' : '')+
        '<nav class="bb-crumbs" aria-label="Breadcrumb">'+crumbs+'</nav>'+
        '<span class="bb-net" id="bbNet"><span class="dot"></span><span class="t">Saved on this device</span></span>'+
        '<button class="bb-user" type="button" onclick="BB.toggleUser(event)" aria-haspopup="true" aria-label="Account">'+
          '<div class="who"><div class="nm">'+esc(u.name)+'</div><div class="rl">'+esc((u.role||'').split('·')[0].trim())+'</div></div>'+
          '<div class="bb-av">'+initials(u.name)+'</div>'+
          '<div class="bb-menu"><div class="mh"><div class="nm">'+esc(u.name)+'</div><div class="rl">'+esc(u.role)+'</div></div>'+
            '<a href="login.html">'+icon('logout')+'Switch seat / sign out</a></div>'+
        '</button>'+
      '</div>'+
      '<div class="bb-sync" id="bbSync"></div>'+
    '</header>';

    // scope band — makes it unmistakable whose view this is (advisor / depot / farmer seats)
    var sc = (window.BB.data && BB.data.scope) ? BB.data.scope() : null;
    if(sc){
      var band='';
      if(sc.rep){ var rr=BB.data.rep(sc.rep);
        var rWhat = sageReal() ? 'your accounts, your sales and the plan — nobody else’s'
                               : 'your farmers, orders, forecast and farm files only';
        band='<div class="bb-scope"><span class="dot" style="background:'+esc(rr.colour||'#68a53e')+';"></span><b>'+esc((u.name||'').split(' ')[0])+'’s view</b> · '+esc(rr.region||'')+' · '+rWhat+'</div>'; }
      else if(sc.farmer){ var ff=BB.data.farmer(sc.farmer); band='<div class="bb-scope"><span class="dot" style="background:var(--green-bright);"></span><b>'+esc(ff.farm||'My farm')+'</b> · your farm, your orders, your account — nothing else</div>'; }
      else if(sc.depot){ var dd=BB.data.depot(sc.depot);
        var dWhat = sageReal() ? 'what is going out, and jobs — no customer accounts'
                               : 'your stock, deliveries, blending and labels only';
        band='<div class="bb-scope"><span class="dot" style="background:var(--green-bright);"></span><b>'+esc(dd.name||'Depot')+' view</b> · '+dWhat+'</div>'; }
      top = top.replace('<div class="bb-sync" id="bbSync"></div>', band+'<div class="bb-sync" id="bbSync"></div>');
    }
    document.body.insertAdjacentHTML('afterbegin', '<aside id="bbNav" aria-label="Main menu">'+navInnerHtml()+'</aside><div id="bbOverlay" onclick="BB.toggleNav(false)"></div>'+top);
    document.body.insertAdjacentHTML('beforeend', bottomNav(opts.active));
    window.addEventListener('resize', function(){ if(!window.matchMedia('(max-width:900px)').matches) closeRail(); });
    // A figure that links somewhere opens its detail over the page; the page itself is one tap away.
    // Pages register richer content with BB.statDetail(key, fn) and tag the tile data-detail="key"
    // (or register by href). fn(tileEl) returns popup options; false means "just navigate".
    document.addEventListener('click', function(e){
      var a=e.target.closest && e.target.closest('a.stat.tap'); if(!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      var href=a.getAttribute('href'), key=a.getAttribute('data-detail'), fn=(key&&STAT_DETAIL[key])||STAT_DETAIL[href]||STAT_DETAIL[(href||'').split('?')[0]];
      var t=function(sel){ var x=a.querySelector(sel); return x? x.textContent.replace(/\s*›\s*$/,'').trim() : ''; };
      var base={ eyebrow:(here&&here.item.label)||'', title:t('.l'), stats:[{ l:t('.l'), v:t('.v'), s:t('.s') }], actions:[{ label:'Open the full list', href:href, primary:true }] };
      var extra=null; try{ if(fn) extra=fn(a); }catch(err){ console.warn('statDetail', err); }
      if(extra===false){ location.href=href; return; }
      var p={}; Object.keys(base).forEach(function(k){ p[k]=base[k]; }); if(extra) Object.keys(extra).forEach(function(k){ p[k]=extra[k]; });
      popup(p);
    });

    document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ closeRail(); toggleNav(false); } });
    // the offline count follows every change saved on the device, not just connection changes
    try{ if(BB.data && !BB.data._wrapped){ ['add','update','enqueue','save'].forEach(function(k){ var f=BB.data[k]; if(typeof f!=='function') return;
      BB.data[k]=function(){ var r=f.apply(this, arguments); if(!navigator.onLine) setTimeout(refreshSync,0); return r; }; }); BB.data._wrapped=true; } }catch(e){}
    refreshSync();
    setTimeout(markSamplePage, 0);
    setTimeout(loadAsk, 0);
    startUI();
  }
  // The Ask bar on every staff page: bb-intel.js (built-in rules, also the offline fallback) then bb-ask.js.
  var SHELL_V = (function(){ try{ var s=document.currentScript; return s && s.src.indexOf('?')>=0 ? s.src.split('?')[1] : ''; }catch(e){ return ''; } })();
  function loadScript(src, done){ var s=document.createElement('script'); s.src=src+(SHELL_V?'?'+SHELL_V:''); s.onload=done; s.onerror=function(){}; document.head.appendChild(s); }
  function loadAsk(){
    loadScript('bb-table.js');                                       // column filters, every seat
    var rk = window.BB.user && window.BB.user.roleKey; if(!rk || rk==='farmer') return;
    var go=function(){ if(!window.BB.ask) loadScript('bb-ask.js'); };
    if(window.BB.intel) go(); else loadScript('bb-intel.js', go);
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
    'client-portal.html':'the farmer view'
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
  // A real ledger, not the demo's sample one: only then is anything on the page "partly real",
  // so only then do sample banners and chips have something to tell apart.
  function sageReal(){ try{ var s=BB.data.sage&&BB.data.sage(); return !!(s&&s.live&&!s.demo); }catch(e){ return false; } }
  function isSample(rec){ return !(rec && (rec.src==='sage' || rec.sageId)); }
  function sampleNote(what){
    return '<div class="bb-sample"><span class="t">Sample</span><div>The figures in <b>'+esc(what)+'</b> are demonstration data, not BioBrix\'s own. '+
      (sageReal()? 'Your customers, invoices and payments are live from your accounting system — this section is not connected to it yet.' : 'Nothing here comes from your systems yet.')+'</div></div>';
  }
  // Pages where the top of the screen is now real (fed by the accounting system) and only the
  // sections below it are demonstration data. The note goes above the first of those sections.
  var PARTLY_LIVE = {
    'operations.html':{ after:'.grid', what:'the sections below — orders, stock, blending and deliveries' },
    'index.html':{ after:'#insights', what:'the farm health scores and the stock and sample alerts above' }
  };
  function markSamplePage(){
    if(!sageReal()) return;                                  // in demo mode (sample ledger or none) the whole thing is a demo
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
    var net = document.getElementById('bbNet');
    // "Up to date" is a claim about the accounts too: if the last read of the accounting system is
    // more than a day old, say how old instead.
    var stale=null; try{ var sg=BB.data.sage&&BB.data.sage(), last=sg&&sg.meta&&sg.meta.last&&Date.parse(sg.meta.last);
      if(last && Date.now()-last > 26*3600000){ var h=Math.round((Date.now()-last)/3600000); stale = h<48? h+' hours ago' : Math.round(h/24)+' days ago'; } }catch(e){}
    if(net){ net.className='bb-net'+(!navigator.onLine?' off':q.length?' sync':stale?' stale':''); var t=net.querySelector('.t');
      if(t) t.textContent=!navigator.onLine?'Offline · '+q.length+' queued':q.length?'Syncing '+q.length+'…':stale?'Accounts read '+stale:'Up to date';
      if(stale && navigator.onLine && !q.length) net.setAttribute('data-tip','The last read of your accounting system was '+stale+'. Figures from it may be behind.'); else net.removeAttribute('data-tip'); }
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
  window.addEventListener('bb:sage', refreshSync);
  window.addEventListener('offline', refreshSync);

  // ---- toast ----------------------------------------------------
  // toast(msg) · toast(msg, { undo:fn }) — with an undo it stays longer and carries an Undo button.
  // Only one undo toast is live at a time: a new one replaces it, so Undo always means the last thing.
  function toast(msg, o){
    o=o||{};
    if(o.undo){ var prev=document.querySelector('.toast.undo'); if(prev) prev.remove(); }
    var t=document.createElement('div'); t.className='toast'+(o.undo?' undo':''); t.setAttribute('role','status');
    var sp=document.createElement('span'); sp.textContent=msg; t.appendChild(sp);
    var gone=false, hide=function(){ if(gone) return; gone=true; t.classList.remove('show'); setTimeout(function(){t.remove();},300); };
    if(o.undo){ var b=document.createElement('button'); b.type='button'; b.textContent='Undo';
      b.onclick=function(){ hide(); try{ o.undo(); }catch(e){ console.warn('undo', e); } toast(o.undone||'Undone'); }; t.appendChild(b); }
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add('show'); });
    setTimeout(hide, o.undo?7000:2400);
  }
  // For pages that reload after a change: the toast, and its Undo, survive the one reload.
  function toastAcrossReload(msg, table, id, undone){
    var r=BB.data.by(table, id); if(!r) return;
    try{ sessionStorage.setItem('bb_undo_next', JSON.stringify({ at:Date.now(), msg:msg, table:table, snap:JSON.parse(JSON.stringify(r)), undone:undone||'Undone' })); }catch(e){}
  }
  function pendingUndo(){
    var x=null; try{ x=JSON.parse(sessionStorage.getItem('bb_undo_next')); sessionStorage.removeItem('bb_undo_next'); }catch(e){}
    if(!x || Date.now()-x.at > 15000) return;
    setTimeout(function(){ toast(x.msg, { undo:function(){ BB.data.restore(x.table, x.snap); setTimeout(function(){ location.reload(); }, 600); }, undone:x.undone }); }, 300);
  }
  // Snapshot a record before changing it; the returned function puts it back.
  function snapshot(table, id){ var r=BB.data.by(table, id); if(!r) return function(){}; var s=JSON.parse(JSON.stringify(r));
    return function(){ BB.data.restore(table, s); }; }

  // ---- formatting ----------------------------------------------
  function money(v){ if(v==null||v==='')return 'R0'; return 'R'+Number(v).toLocaleString('en-ZA',{maximumFractionDigits:0}); }
  function money2(v){ return new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',minimumFractionDigits:0,maximumFractionDigits:0}).format(v||0); }
  function num(v){ return Number(v||0).toLocaleString('en-ZA'); }
  function date(d){ if(!d)return '—'; try{return new Date(d).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'});}catch(e){return d;} }
  function shortDate(d){ if(!d)return '—'; try{return new Date(d).toLocaleDateString('en-ZA',{day:'numeric',month:'short'});}catch(e){return d;} }
  function monthName(i){ return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]; }

  // A date that should have happened and hasn't: an ETA in the past on something not yet there.
  function lateDays(x){ if(!x || !x.eta || /^(Delivered|Received|Cancelled)$/.test(x.status||'')) return 0;
    var g=Math.round((Date.parse(new Date().toISOString().slice(0,10))-Date.parse(x.eta))/86400000); return g>0? g : 0; }
  function etaHtml(x, short){ if(!x || !x.eta) return '—'; var n=lateDays(x);
    return '<span style="white-space:nowrap;">'+esc(short? shortDate(x.eta) : date(x.eta))+'</span>'+(n? ' <span class="badge b-bad" data-tip="ETA was '+esc(date(x.eta))+' and it has not arrived">late '+n+'d</span>' : ''); }
  // A farm's badge: "Active" never sits beside an overdue account — that account is on hold.
  function farmBadge(f){ if(!f) return ''; var st=f.status||'';
    if(st==='Active' && f.id && BB.data.isOverdue && BB.data.isOverdue(f.id)) return '<span class="badge b-bad" data-tip="Account overdue — deliveries are held until it is paid">On hold</span>';
    return statusBadge(st||'—'); }
  function statusBadge(s){
    var m={ 'Confirmed':'b-confirmed','Delivered':'b-delivered','Paid':'b-ok','Active':'b-ok','In stock':'b-ok','Healthy':'b-ok','Approved':'b-ok',
      'Pending':'b-pending','Forecast':'b-forecast','Awaiting stock':'b-await','Low stock':'b-warn','In progress':'b-warn','Monitoring':'b-warn','Reorder':'b-warn',
      'Draft':'b-grey','Planned':'b-grey','New':'b-grey',
      'Out of stock':'b-bad','Overdue':'b-bad','Urgent':'b-bad','Critical':'b-bad','At risk':'b-bad',
      'Ordered':'b-blue','Requested':'b-warn','In transit':'b-transit','Blending':'b-blue','Quoted':'b-blue','Proof received':'b-blue','Sent':'b-ok','Shipped':'b-ok','In flight':'b-blue','Awaiting you':'b-warn','Open':'b-grey','Done':'b-ok','Design':'b-grey','Live':'b-ok' };
    return '<span class="badge '+(m[s]||'b-grey')+'">'+esc(s)+'</span>';
  }

  // ---- Charts (BB.chart) ------------------------------------------
  // Small, dependency-free SVG charts so the portal keeps working with no signal. Every chart
  // takes an element (or selector) and draws at that element's real width, redrawing on resize.
  //   BB.chart.bar(el,  { labels, series:[{name,values,color}], stacked, height, fmt, axisFmt, table })
  //   BB.chart.line(el, { labels, series:[{name,values,color,dash,area}], height, fmt, axisFmt, table })
  //   BB.chart.hbar(el, { rows:[{label,sub,value,color,href}], fmt, max })
  //   BB.chart.donut(el,{ rows:[{label,value,color}], fmt, centre, centreLabel, size })
  //   BB.chart.spark(values, { color, width, height, area }) → svg string
  // Colour is never the only carrier: series also differ in dash, and every chart can show its table.
  var PAL = ['#3f6b28','#c77d17','#2f6f9e','#7d4f9a','#8fbf5a','#a3533f','#6b7a5e'];
  var tipEl = null;
  function tip(){ if(!tipEl){ tipEl=document.createElement('div'); tipEl.className='bbc-tip'; tipEl.setAttribute('role','status'); document.body.appendChild(tipEl); } return tipEl; }
  function showTip(e, html){ var t=tip(); t.innerHTML=html; t.classList.add('show');
    var x=e.clientX+14, y=e.clientY+14, w=t.offsetWidth, h=t.offsetHeight;
    if(x+w>window.innerWidth-8) x=e.clientX-w-14; if(y+h>window.innerHeight-8) y=e.clientY-h-14;
    t.style.left=x+'px'; t.style.top=y+'px'; }
  function hideTip(){ if(tipEl) tipEl.classList.remove('show'); tipFor=null; }
  // One themed bubble for the whole site. Chart parts carry rich content in data-tiph; anything else
  // with a native title gets the same bubble (its title moves to data-tip so the OS tooltip never shows).
  var tipFor=null;
  document.addEventListener('mouseover', function(e){
    var el=e.target.closest && e.target.closest('[data-tiph],[title],[data-tip]'); if(!el || el.closest('.bbc-tip')) return;
    if(el.hasAttribute('title')){ var t=el.getAttribute('title'); el.removeAttribute('title'); if(!t) return; el.setAttribute('data-tip', t); if(!el.hasAttribute('aria-label') && !String(el.textContent||'').trim()) el.setAttribute('aria-label', t); }
    if(el.tagName==='svg' || el.tagName==='TR' || el.closest('#bbNav .nav-item')) return;   // a whole row's 'Open …' hint would chase the pointer
    tipFor=el;
    showTip(e, el.hasAttribute('data-tiph') ? el.getAttribute('data-tiph') : esc(el.getAttribute('data-tip')));
  }, true);
  document.addEventListener('mousemove', function(e){ if(!tipFor) return; if(!document.contains(tipFor) || !(tipFor===e.target || tipFor.contains(e.target))){ hideTip(); return; }
    showTip(e, tipFor.hasAttribute('data-tiph') ? tipFor.getAttribute('data-tiph') : esc(tipFor.getAttribute('data-tip'))); }, true);
  document.addEventListener('mouseout', function(e){ if(tipFor && (e.target===tipFor || tipFor.contains(e.target)) && !(e.relatedTarget && tipFor.contains(e.relatedTarget))) hideTip(); }, true);
  document.addEventListener('mousedown', hideTip, true);
  // Convert every native title the moment it's drawn (an ancestor's title would otherwise show
  // the OS tooltip once the inner element's own title had been moved).
  function untitle(root){ if(!root || !root.querySelectorAll) return; var list=[].slice.call(root.querySelectorAll('[title]')); if(root.hasAttribute && root.hasAttribute('title')) list.push(root);
    list.forEach(function(el){ var t=el.getAttribute('title'); el.removeAttribute('title'); if(!t) return; if(el.tagName!=='TR') el.setAttribute('data-tip', t); if(!el.hasAttribute('aria-label') && !String(el.textContent||'').trim()) el.setAttribute('aria-label', t); }); }
  new MutationObserver(function(ms){ ms.forEach(function(m){ if(m.type==='attributes') untitle(m.target); else m.addedNodes.forEach(function(n){ if(n.nodeType===1) untitle(n); }); }); })
    .observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['title'] });
  if(document.body) untitle(document.body);
  // SVG <title> children (e.g. a map library's) move to the same bubble
  new MutationObserver(function(){ document.querySelectorAll('svg title').forEach(function(t){ var p=t.parentNode; if(p && p.setAttribute && !p.hasAttribute('data-tip')) p.setAttribute('data-tip', t.textContent); t.remove(); }); }).observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener('scroll', hideTip, true);
  function $el(el){ return typeof el==='string' ? document.querySelector(el) : el; }
  function niceMax(v){ if(v<=0) return 1; var p=Math.pow(10,Math.floor(Math.log10(v))), n=v/p; return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p; }
  function compact(v){ var a=Math.abs(v); if(a>=1e6) return (v/1e6).toFixed(a>=1e7?0:1).replace(/\.0$/,'')+'m'; if(a>=1e3) return (v/1e3).toFixed(a>=1e4?0:1).replace(/\.0$/,'')+'k'; return String(Math.round(v)); }
  function moneyCompact(v){ return 'R'+compact(v); }
  function legendHtml(series){ if(series.length<2) return ''; return '<div class="legend bbc-legend">'+series.map(function(s,i){ return '<span><i style="background:'+(s.color||PAL[i%PAL.length])+'"></i>'+esc(s.name)+'</span>'; }).join('')+'</div>'; }
  function tableHtml(labels, series, fmt){
    return '<details class="bbc-table"><summary>Show as table</summary><div class="scroll"><table class="bb"><thead><tr><th></th>'+
      series.map(function(s){ return '<th class="num">'+esc(s.name||'Value')+'</th>'; }).join('')+'</tr></thead><tbody>'+
      labels.map(function(l,i){ return '<tr><td>'+esc(l)+'</td>'+series.map(function(s){ return '<td class="num">'+fmt(s.values[i]||0)+'</td>'; }).join('')+'</tr>'; }).join('')+
      '</tbody></table></div></details>';
  }
  function watch(el, draw){
    draw();
    if(window.ResizeObserver){ var last=el.clientWidth; new ResizeObserver(function(){ if(Math.abs(el.clientWidth-last)>4){ last=el.clientWidth; draw(); } }).observe(el); }
  }
  function frame(el, o, plot){
    // shared axis frame for bar + line: returns geometry + svg prefix
    var W=Math.max(240, el.clientWidth||600), H=o.height||220, padL=o.padL||46, padR=12, padT=10, padB=26;
    var series=o.series, n=o.labels.length;
    var max = o.max || niceMax(Math.max.apply(null, plot.maxes.concat([0])));
    // Counts (orders, farms, visits) must tick in whole numbers: with 4 gridlines that means a max
    // divisible by 4, or a max of 3 reads "0, 1, 1, 3".
    if(!o.max && plot.maxes.every(function(v){ return Math.round(v)===v; }) && max<40) max = Math.max(4, Math.ceil(max/4)*4);
    var axisFmt = o.axisFmt || (o.money ? moneyCompact : compact);
    var iw=W-padL-padR, ih=H-padT-padB, g='';
    for(var t=0;t<=4;t++){ var y=padT+ih-ih*t/4; g+='<line class="'+(t?'grid-l':'base-l')+'" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+y+'" y2="'+y+'"/><text class="ax" x="'+(padL-8)+'" y="'+(y+4)+'" text-anchor="end">'+axisFmt(max*t/4)+'</text>'; }
    var step = iw/n, every = Math.max(1, Math.ceil(n/Math.floor(iw/58)));
    o.labels.forEach(function(l,i){ if(i%every) return; g+='<text class="ax" x="'+(padL+step*i+step/2)+'" y="'+(H-8)+'" text-anchor="middle">'+esc(l)+'</text>'; });
    return { W:W, H:H, padL:padL, padT:padT, iw:iw, ih:ih, step:step, max:max, n:n, g:g, y:function(v){ return padT+ih-ih*Math.min(v,max)/max; } };
  }

  // ---- Themed controls ------------------------------------------------------------------------
  // The OS draws <select> lists, date pickers, number spinners, checkboxes and confirm() boxes in
  // its own colours. Every one is swapped here for a BioBrix-themed control, automatically, on
  // every page and for anything a page draws later. The real control stays underneath (hidden),
  // so page code that reads .value or listens for 'change' keeps working unchanged.
  var UI_MO=null;
  var protoSel=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value');
  var protoIdx=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'selectedIndex');
  var protoIn=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
  var openSel=null;
  function closeSel(){ if(!openSel) return; var o=openSel; openSel=null; o.menu.remove(); o.btn.setAttribute('aria-expanded','false'); o.wrap.classList.remove('open'); }
  function enhanceSelect(sel){
    if(sel.dataset.bbui||sel.multiple||sel.size>1||sel.closest('[data-native]')) return;
    sel.dataset.bbui='1';
    var wrap=document.createElement('span'); wrap.className='bb-sel'+(sel.className?' '+sel.className.split(/\s+/).map(function(c){ return 'from-'+c; }).join(' '):'');
    var cs=getComputedStyle(sel);
    if(sel.style.width) wrap.style.width=sel.style.width; else if(cs.display==='block'||sel.closest('.fld')) wrap.style.display='block';
    if(sel.style.minWidth) wrap.style.minWidth=sel.style.minWidth;
    if(sel.style.maxWidth) wrap.style.maxWidth=sel.style.maxWidth;
    if(sel.style.flex) wrap.style.flex=sel.style.flex;
    var btn=document.createElement('button'); btn.type='button'; btn.className='bb-sel-btn'; btn.setAttribute('aria-haspopup','listbox'); btn.setAttribute('aria-expanded','false');
    var lab=sel.id&&document.querySelector('label[for="'+sel.id+'"]'); btn.setAttribute('aria-label', sel.getAttribute('aria-label')||(lab&&lab.textContent.trim())||sel.name||'Choose');
    btn.innerHTML='<span class="t"></span>'+icon('chevron','cv');
    sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(sel); wrap.appendChild(btn);
    sel.classList.add('bb-native'); sel.tabIndex=-1; sel.setAttribute('aria-hidden','true');
    function label(){ var o=sel.options[sel.selectedIndex]; btn.querySelector('.t').textContent=o? o.text : ''; btn.classList.toggle('ph', !o || o.value===''); btn.disabled=sel.disabled; }
    // programmatic changes (sel.value = …) don't fire events: keep the face in step anyway
    try{
      Object.defineProperty(sel,'value',{ configurable:true, get:function(){ return protoSel.get.call(this); }, set:function(v){ protoSel.set.call(this,v); label(); } });
      Object.defineProperty(sel,'selectedIndex',{ configurable:true, get:function(){ return protoIdx.get.call(this); }, set:function(v){ protoIdx.set.call(this,v); label(); } });
    }catch(e){}
    sel.addEventListener('change', label);
    new MutationObserver(label).observe(sel,{ childList:true, subtree:true, attributes:true, attributeFilter:['disabled','selected'] });
    label();
    function open(){
      if(openSel && openSel.sel===sel){ closeSel(); return; } closeSel(); if(sel.disabled) return;
      var menu=document.createElement('div'); menu.className='bb-sel-menu'; menu.setAttribute('role','listbox');
      var opts=[].slice.call(sel.options), html='', grp=null;
      opts.forEach(function(o,i){ var g=o.parentNode.tagName==='OPTGROUP'?o.parentNode.label:null;
        if(g!==grp){ grp=g; if(g) html+='<div class="og">'+esc(g)+'</div>'; }
        html+='<div class="op'+(i===sel.selectedIndex?' on':'')+(o.disabled?' dis':'')+(o.value===''?' ph':'')+'" role="option" data-i="'+i+'" aria-selected="'+(i===sel.selectedIndex)+'">'+esc(o.text)+'</div>'; });
      if(opts.length>8) html='<div class="sq"><input type="text" placeholder="Search…" aria-label="Search options"></div><div class="ops">'+html+'</div>'; else html='<div class="ops">'+html+'</div>';
      menu.innerHTML=html; document.body.appendChild(menu);
      openSel={ sel:sel, btn:btn, wrap:wrap, menu:menu }; wrap.classList.add('open'); btn.setAttribute('aria-expanded','true');
      place(); var cur=menu.querySelector('.op.on')||menu.querySelector('.op'); if(cur) cur.scrollIntoView({block:'nearest'});
      var q=menu.querySelector('.sq input'); if(q){ q.focus(); q.addEventListener('input', function(){ var v=q.value.toLowerCase(); menu.querySelectorAll('.op').forEach(function(x){ x.style.display=x.textContent.toLowerCase().indexOf(v)>=0?'':'none'; }); menu.querySelectorAll('.og').forEach(function(x){ x.style.display=v?'none':''; }); }); }
      menu.addEventListener('mousedown', function(e){ e.preventDefault(); if(e.target.closest('.sq')) { var inp=menu.querySelector('.sq input'); inp && inp.focus(); } });
      menu.addEventListener('click', function(e){ var x=e.target.closest('.op'); if(!x||x.classList.contains('dis')) return; choose(+x.getAttribute('data-i')); });
      menu.addEventListener('keydown', key);
    }
    function place(){ if(!openSel||openSel.sel!==sel) return; var r=btn.getBoundingClientRect(), m=openSel.menu, h=m.offsetHeight, below=window.innerHeight-r.bottom;
      m.style.minWidth=r.width+'px'; m.style.left=Math.max(8,Math.min(r.left, window.innerWidth-m.offsetWidth-8))+'px';
      m.style.top=(below<h+12 && r.top>h+12 ? r.top-h-4 : r.bottom+4)+'px'; }
    function choose(i){ var changed=i!==sel.selectedIndex; protoIdx.set.call(sel,i); label(); closeSel(); btn.focus();
      if(changed){ sel.dispatchEvent(new Event('input',{bubbles:true})); sel.dispatchEvent(new Event('change',{bubbles:true})); } }
    function key(e){
      if(!openSel||openSel.sel!==sel) return;
      var vis=[].slice.call(openSel.menu.querySelectorAll('.op')).filter(function(x){ return x.style.display!=='none' && !x.classList.contains('dis'); });
      var at=vis.indexOf(openSel.menu.querySelector('.op.kb')||openSel.menu.querySelector('.op.on'));
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); at=Math.max(0,Math.min(vis.length-1, at+(e.key==='ArrowDown'?1:-1))); vis.forEach(function(x){ x.classList.remove('kb'); }); if(vis[at]){ vis[at].classList.add('kb'); vis[at].scrollIntoView({block:'nearest'}); } }
      else if(e.key==='Enter'){ e.preventDefault(); if(vis[at]) choose(+vis[at].getAttribute('data-i')); }
      else if(e.key==='Escape'||e.key==='Tab'){ closeSel(); btn.focus(); }
    }
    btn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); open(); });
    btn.addEventListener('keydown', function(e){
      if(openSel && openSel.sel===sel){ key(e); return; }
      if(e.key==='ArrowDown'||e.key==='ArrowUp'||e.key===' '||e.key==='Enter'){ e.preventDefault(); open(); }
    });
    sel._bbPlace=place;
  }
  document.addEventListener('mousedown', function(e){ if(openSel && !e.target.closest('.bb-sel-menu') && !openSel.wrap.contains(e.target)) closeSel(); }, true);
  window.addEventListener('resize', closeSel);
  window.addEventListener('scroll', function(e){ if(openSel && !(e.target.closest && e.target.closest('.bb-sel-menu'))) openSel.sel._bbPlace && openSel.sel._bbPlace(); }, true);

  // dates: a themed month calendar; the field keeps its YYYY-MM-DD value (pages read it as before)
  var MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var cal=null;
  function closeCal(){ if(cal){ cal.el.remove(); cal=null; } }
  function iso(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function enhanceDate(inp){
    if(inp.dataset.bbui) return; inp.dataset.bbui='1';
    var min=inp.min, max=inp.max;
    inp.type='text'; inp.readOnly=true; inp.classList.add('bb-date'); if(!inp.placeholder) inp.placeholder='Pick a date';
    inp.setAttribute('inputmode','none');
    var wrap=document.createElement('span'); wrap.className='bb-datew'; if(inp.style.width) wrap.style.width=inp.style.width;
    if(getComputedStyle(inp).display==='block'||inp.closest('.fld')) wrap.style.display='block';
    inp.parentNode.insertBefore(wrap, inp); wrap.appendChild(inp);
    wrap.insertAdjacentHTML('beforeend', '<span class="dv" aria-hidden="true"></span>'+icon('calendar','calic'));
    var dv=wrap.querySelector('.dv');
    function face(){ var v=protoIn.get.call(inp); if(/^\d{4}-\d{2}-\d{2}$/.test(v)){ var x=new Date(v+'T00:00:00'); dv.textContent=x.getDate()+' '+MON[x.getMonth()].slice(0,3)+' '+x.getFullYear(); wrap.classList.add('has'); } else { dv.textContent=''; wrap.classList.remove('has'); } }
    try{ Object.defineProperty(inp,'value',{ configurable:true, get:function(){ return protoIn.get.call(this); }, set:function(v){ protoIn.set.call(this,v); face(); } }); }catch(e){}
    inp.addEventListener('input', face); inp.addEventListener('change', face); face();
    dv.addEventListener('click', function(){ inp.click(); });
    function show(){
      if(cal && cal.inp===inp){ closeCal(); return; } closeCal();
      var v=protoIn.get.call(inp), base=/^\d{4}-\d{2}-\d{2}$/.test(v)? new Date(v+'T00:00:00') : new Date();
      var el=document.createElement('div'); el.className='bb-cal'; document.body.appendChild(el);
      cal={ el:el, inp:inp, y:base.getFullYear(), m:base.getMonth() };
      draw(); place();
      el.addEventListener('mousedown', function(e){ e.preventDefault(); });
      el.addEventListener('click', function(e){
        var b=e.target.closest('[data-d],[data-nav],[data-today],[data-clear]'); if(!b) return;
        if(b.hasAttribute('data-nav')){ cal.m+=+b.getAttribute('data-nav'); if(cal.m<0){ cal.m=11; cal.y--; } if(cal.m>11){ cal.m=0; cal.y++; } draw(); return; }
        var val = b.hasAttribute('data-clear') ? '' : b.hasAttribute('data-today') ? iso(new Date()) : b.getAttribute('data-d');
        protoIn.set.call(inp, val); closeCal(); inp.dispatchEvent(new Event('input',{bubbles:true})); inp.dispatchEvent(new Event('change',{bubbles:true}));
      });
    }
    function draw(){
      var y=cal.y, m=cal.m, first=new Date(y,m,1), start=(first.getDay()+6)%7, days=new Date(y,m+1,0).getDate(), sel=protoIn.get.call(inp), today=iso(new Date());
      var h='<div class="ch"><button type="button" data-nav="-1" aria-label="Previous month">'+icon('chevron','pv')+'</button><b>'+MON[m]+' '+y+'</b><button type="button" data-nav="1" aria-label="Next month">'+icon('chevron')+'</button></div><div class="cg">'+
        ['Mo','Tu','We','Th','Fr','Sa','Su'].map(function(x){ return '<span class="dw">'+x+'</span>'; }).join('');
      for(var i=0;i<start;i++) h+='<span></span>';
      for(var dd=1; dd<=days; dd++){ var v=iso(new Date(y,m,dd)), off=(min&&v<min)||(max&&v>max);
        h+='<button type="button"'+(off?' disabled':' data-d="'+v+'"')+' class="'+(v===sel?'on ':'')+(v===today?'td':'')+'">'+dd+'</button>'; }
      h+='</div><div class="cf"><button type="button" data-clear>Clear</button><button type="button" data-today>Today</button></div>';
      cal.el.innerHTML=h;
    }
    function place(){ var r=wrap.getBoundingClientRect(), el=cal.el, h=el.offsetHeight;
      el.style.left=Math.max(8,Math.min(r.left, window.innerWidth-el.offsetWidth-8))+'px';
      el.style.top=(window.innerHeight-r.bottom<h+12 && r.top>h+12 ? r.top-h-4 : r.bottom+4)+'px'; }
    inp.addEventListener('click', show);
    wrap.querySelector('.calic').addEventListener('click', show);
    inp.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '||e.key==='ArrowDown'){ e.preventDefault(); show(); } else if(e.key==='Escape') closeCal(); else if(e.key==='Backspace'||e.key==='Delete'){ protoIn.set.call(inp,''); inp.dispatchEvent(new Event('input',{bubbles:true})); inp.dispatchEvent(new Event('change',{bubbles:true})); } });
  }
  document.addEventListener('mousedown', function(e){ if(cal && !e.target.closest('.bb-cal') && !(e.target.closest('.bb-datew') && e.target.closest('.bb-datew').contains(cal.inp))) closeCal(); }, true);
  window.addEventListener('resize', closeCal);

  // numbers: themed up/down steppers in place of the OS spinner
  function enhanceNumber(inp){
    if(inp.dataset.bbui||inp.readOnly) return; inp.dataset.bbui='1';
    var wrap=document.createElement('span'); wrap.className='bb-numw';
    var cs=getComputedStyle(inp); if(inp.style.width) wrap.style.width=inp.style.width; else if(cs.display==='block'||inp.closest('.fld')) wrap.style.display='block';
    if(inp.style.maxWidth) wrap.style.maxWidth=inp.style.maxWidth;
    inp.parentNode.insertBefore(wrap, inp); wrap.appendChild(inp);
    wrap.insertAdjacentHTML('beforeend','<span class="st"><button type="button" tabindex="-1" data-s="1" aria-label="Up">'+icon('chevron')+'</button><button type="button" tabindex="-1" data-s="-1" aria-label="Down">'+icon('chevron')+'</button></span>');
    wrap.querySelector('.st').addEventListener('mousedown', function(e){ e.preventDefault(); });
    wrap.querySelector('.st').addEventListener('click', function(e){ var b=e.target.closest('[data-s]'); if(!b||inp.disabled) return;
      try{ b.getAttribute('data-s')==='1'? inp.stepUp() : inp.stepDown(); }catch(err){ protoIn.set.call(inp, (parseFloat(protoIn.get.call(inp))||0)+(+b.getAttribute('data-s'))); }
      inp.dispatchEvent(new Event('input',{bubbles:true})); inp.dispatchEvent(new Event('change',{bubbles:true})); });
  }

  function enhanceAll(root){
    root=root||document;
    if(!root.querySelectorAll) return;
    root.querySelectorAll('select:not([data-bbui])').forEach(enhanceSelect);
    root.querySelectorAll('input[type="date"]:not([data-bbui])').forEach(enhanceDate);
    root.querySelectorAll('input[type="number"]:not([data-bbui])').forEach(enhanceNumber);
  }
  function startUI(){
    if(UI_MO) return; enhanceAll(document);
    UI_MO=new MutationObserver(function(muts){ muts.forEach(function(m){ m.addedNodes.forEach(function(n){ if(n.nodeType===1){ if(n.matches&&n.matches('select,input')) enhanceAll(n.parentNode); else enhanceAll(n); } }); }); });
    UI_MO.observe(document.body,{ childList:true, subtree:true });
  }

  // confirm(), themed: BB.confirm(message, {ok, cancel, danger}) → Promise<boolean>
  function confirmBox(msg, o){
    o=o||{};
    return new Promise(function(res){
      var done=false, fin=function(v){ if(done) return; done=true; closePopup(); res(v); };
      popup({ title:o.title||'Are you sure?', html:'<p style="font-size:.92rem;color:var(--ink);line-height:1.55;">'+esc(msg)+'</p>',
        actions:[{ label:o.cancel||'Cancel', onClick:function(){ fin(false); } }, { label:o.ok||'Yes', primary:true, onClick:function(){ fin(true); } }] });
      var obs=setInterval(function(){ if(!popOpen){ clearInterval(obs); fin(false); } }, 200);
    });
  }

  // ---- Popups ------------------------------------------------------------------------------
  // BB.popup({ eyebrow, title, sub, color, stats:[{l,v,s,cls,html}], html, table:{columns,rows,num:[i]}, note,
  //            actions:[{label,href,primary,onClick}], wide, onOpen(bodyEl) })
  // Details open over the page; the page behind stays where it was. Esc / backdrop / × close.
  var popOpen = null;
  function closePopup(){ if(!popOpen) return; var p=popOpen; popOpen=null; document.documentElement.classList.remove('bbp-lock'); p.classList.remove('show'); setTimeout(function(){ p.remove(); }, 150); document.removeEventListener('keydown', popKey); }
  function popKey(e){ if(e.key==='Escape') closePopup(); }
  function popup(o){
    var swap=!!popOpen, keepScroll=0;
    if(swap){ var ob=popOpen.querySelector('.bbp-b'); keepScroll=ob? ob.scrollTop : 0; popOpen.remove(); popOpen=null; document.removeEventListener('keydown', popKey); }
    else closePopup();
    o=o||{};
    // o.table, or o.tables:[{title, columns, rows:[{cells, href, onClick}], num:[i], foot:[cells]}]
    var rowFns=[];
    var cell=function(c,i,nc){ return '<td'+(nc.indexOf(i)>=0?' class="num"':'')+'>'+(c&&c.html!=null?c.html:esc(c==null||c===''?'—':c))+'</td>'; };
    var oneTable=function(t){ var nc=t.num||[];
      return (t.title?'<div class="bbp-tt">'+esc(t.title)+'</div>':'')+'<div class="scroll"><table class="bb" data-nofilter="1"><thead><tr>'+t.columns.map(function(c,i){ return '<th'+(nc.indexOf(i)>=0?' class="num"':'')+'>'+esc(c)+'</th>'; }).join('')+'</tr></thead><tbody>'+
        (t.rows.length? t.rows.map(function(r){ var cells=r.cells||r, k=-1; if(typeof r.onClick==='function'){ rowFns.push(r.onClick); k=rowFns.length-1; }
          return '<tr'+(k>=0?' class="click" data-row="'+k+'"':r.href?' class="click" data-href="'+esc(r.href)+'"':'')+'>'+cells.map(function(c,i){ return cell(c,i,nc); }).join('')+'</tr>'; }).join('')
          : '<tr><td colspan="'+t.columns.length+'"><div class="empty">Nothing to show.</div></td></tr>')+'</tbody>'+
        (t.foot? '<tfoot><tr>'+t.foot.map(function(c,i){ return c===''? '<td'+(nc.indexOf(i)>=0?' class="num"':'')+'></td>' : cell(c,i,nc); }).join('')+'</tr></tfoot>' : '')+'</table></div>'; };
    var tbl=(o.tables||(o.table&&o.table.rows?[o.table]:[])).map(oneTable).join('');
    // figures; one with onClick becomes a button (e.g. the order's status)
    var stats = (o.stats&&o.stats.length) ? '<div class="bbp-stats">'+o.stats.map(function(x,i){ var act=typeof x.onClick==='function';
      return '<div class="stat'+(x.cls?' '+x.cls:'')+(act?' act" role="button" tabindex="0" data-stat="'+i+'"'+(x.tip?' data-tip="'+esc(x.tip)+'"':'') : '"')+'><div class="l">'+esc(x.l)+'</div><div class="v">'+(x.html||esc(x.v))+(act?icon('chevron','cv'):'')+'</div>'+(x.s?'<div class="s">'+esc(x.s)+'</div>':'')+'</div>'; }).join('')+'</div>' : '';
    // meta: [{icon, text|html, tip, color, initials, href, muted}] — the record's details, one per line
    var meta = (o.meta&&o.meta.length) ? '<ul class="bbp-meta">'+o.meta.filter(Boolean).map(function(m){
      var lead = m.initials ? '<span class="av" style="background:'+esc(m.color||'#3f6b28')+'">'+esc(m.initials)+'</span>' : icon(m.icon||'dot');
      var val = m.html!=null ? m.html : esc(m.text==null?'—':m.text);
      if(m.href) val='<a href="'+esc(m.href)+'">'+val+'</a>';
      return '<li'+(m.muted?' class="muted"':'')+(m.tip?' data-tip="'+esc(m.tip)+'"':'')+'>'+lead+'<span class="mv">'+val+'</span></li>'; }).join('')+'</ul>' : '';
    var bodyHtml = o.layout==='split'
      ? '<div class="bbp-split"><div class="side">'+meta+stats+'</div><div class="main">'+(o.html||'')+tbl+(o.note?'<div class="bbp-note">'+esc(o.note)+'</div>':'')+'</div></div>'
      : meta+stats+(o.html||'')+tbl+(o.note?'<div class="bbp-note">'+esc(o.note)+'</div>':'');
    var acts=(o.actions||[]).filter(Boolean);
    var el=document.createElement('div'); el.className='bbp-back';
    el.innerHTML='<div class="bbp'+(o.wide?' wide':'')+'" role="dialog" aria-modal="true" aria-label="'+esc(o.title||'Details')+'">'+
      '<div class="bbp-h">'+(o.color?'<span class="sw" style="background:'+esc(o.color)+'"></span>':'')+'<div class="t">'+(o.eyebrow?'<div class="eb">'+esc(o.eyebrow)+'</div>':'')+'<h3>'+esc(o.title||'')+'</h3>'+(o.sub?'<div class="sub">'+esc(o.sub)+'</div>':'')+(o.tags?'<div class="tags">'+o.tags+'</div>':'')+'</div>'+
        '<button type="button" class="bbp-x" aria-label="Close">×</button></div>'+
      '<div class="bbp-b">'+bodyHtml+'</div>'+
      '<div class="bbp-f">'+acts.map(function(a,i){ return (a.href && !a.scrollTo && !a.onClick) ? '<a class="btn '+(a.primary?'':'ghost')+'" href="'+esc(a.href)+'">'+esc(a.label)+icon('chevron')+'</a>'
        : '<button type="button" class="btn '+(a.primary?'':'ghost')+'" data-act="'+i+'">'+esc(a.label)+'</button>'; }).join('')+'</div></div>';
    var sbw=window.innerWidth-document.documentElement.clientWidth;
    if(!document.documentElement.classList.contains('bbp-lock')) document.documentElement.style.setProperty('--sbw', Math.max(0,sbw)+'px');   // already locked: keep the first measurement
    document.documentElement.classList.add('bbp-lock');
    document.body.appendChild(el); popOpen=el;
    if(swap){ el.style.transition='none'; el.querySelector('.bbp').style.transition='none'; el.classList.add('show'); var nb=el.querySelector('.bbp-b'); if(nb && o.keepScroll!==false) nb.scrollTop=keepScroll; requestAnimationFrame(function(){ el.style.transition=''; el.querySelector('.bbp').style.transition=''; }); }
    else requestAnimationFrame(function(){ el.classList.add('show'); });
    el.addEventListener('click', function(e){
      if(e.target===el || e.target.closest('.bbp-x')){ closePopup(); return; }
      var st=e.target.closest('[data-stat]'); if(st){ var x=o.stats[+st.getAttribute('data-stat')]; if(x&&x.onClick) x.onClick(st, e); return; }
      var b=e.target.closest('[data-act]'); if(b){ var a=acts[+b.getAttribute('data-act')]; if(!a) return;
        if(a.scrollTo){ closePopup(); var t=document.querySelector(a.scrollTo); if(t) setTimeout(function(){ t.scrollIntoView({behavior:'smooth',block:'start'}); },160); }
        if(a.onClick) a.onClick(e);
        if(a.close) closePopup();
        return; }
      if(e.target.closest('a[href^="tel:"],a[href^="https://wa.me"],a[target]')) return;
      var rr=e.target.closest('tr[data-row]'); if(rr){ var fn=rowFns[+rr.getAttribute('data-row')]; if(fn){ closePopup(); setTimeout(fn,160); } return; }
      var tr=e.target.closest('tr[data-href]'); if(tr) location.href=tr.getAttribute('data-href');
    });
    document.addEventListener('keydown', popKey);
    var box=el.querySelector('.bbp'); if(box){ box.setAttribute('tabindex','-1'); box.style.outline='none'; box.focus({preventScroll:true}); }   // focus the dialog, not the × (no ring on open)
    if(typeof o.onOpen==='function') try{ o.onOpen(el.querySelector('.bbp-b')); }catch(e){ console.warn('popup', e); }
    return el;
  }
  // A page's detail (if any) is merged over the chart's own default popup. Return false to handle it yourself.
  function openDetail(o, ctx, base){
    var extra=null; try{ if(typeof o.detail==='function') extra=o.detail(ctx); }catch(e){ console.warn('detail', e); }
    if(extra===false) return;
    var p={}; Object.keys(base).forEach(function(k){ p[k]=base[k]; }); if(extra) Object.keys(extra).forEach(function(k){ p[k]=extra[k]; });
    popup(p);
  }
  function chartTitle(el, o){ if(o.title) return o.title; var c=el&&el.closest&&el.closest('.card'), h=c&&c.querySelector('.card-h h3'); return h? h.textContent.trim() : ''; }
  // BB.pick(anchor, {title, items:[{label, value, html, on}], onPick(value)}) — a small themed menu
  var pickEl=null;
  function closePick(){ if(pickEl){ pickEl.remove(); pickEl=null; document.removeEventListener('mousedown', pickAway, true); } }
  function pickAway(e){ if(pickEl && !pickEl.contains(e.target)) closePick(); }
  function pick(anchor, o){
    closePick(); o=o||{};
    var el=document.createElement('div'); el.className='bb-pick'; el.setAttribute('role','menu');
    el.innerHTML=(o.title?'<div class="hd">'+esc(o.title)+'</div>':'')+(o.items||[]).map(function(it,i){ return '<div class="op" role="menuitem" tabindex="-1" data-i="'+i+'">'+(it.html||esc(it.label))+(it.on?icon('check'):'')+'</div>'; }).join('');
    document.body.appendChild(el); pickEl=el;
    var r=anchor.getBoundingClientRect(), h=el.offsetHeight;
    el.style.left=Math.max(8,Math.min(r.left, window.innerWidth-el.offsetWidth-8))+'px';
    el.style.top=(window.innerHeight-r.bottom<h+12 && r.top>h+12 ? r.top-h-4 : r.bottom+4)+'px';
    el.addEventListener('click', function(e){ var x=e.target.closest('.op'); if(!x) return; var it=o.items[+x.getAttribute('data-i')]; closePick(); if(it && o.onPick) o.onPick(it.value!=null?it.value:it.label); });
    setTimeout(function(){ document.addEventListener('mousedown', pickAway, true); }, 0);
    document.addEventListener('keydown', function k(e){ if(e.key==='Escape'){ closePick(); document.removeEventListener('keydown', k); } });
  }
  function pct(a,b){ return b? Math.round(a/b*100)+'%' : '—'; }
  function colDetail(o, i, fmt){
    var blank=function(v){ return v==null || (typeof v==='number' && isNaN(v)); };
    var f2=function(v){ return blank(v)? '—' : fmt(v); };
    var tot=o.series.reduce(function(t,s){ return t+(s.values[i]||0); },0);
    var all=o.series.reduce(function(t,s){ return t+s.values.reduce(function(a,v){ return a+(v||0); },0); },0);
    var prev=i>0? o.series.reduce(function(t,s){ return t+(s.values[i-1]||0); },0) : null;
    var stats=o.series.map(function(s){ return { l:s.name||'Value', v:f2(s.values[i]), s:(o.series.length>1&&tot&&!o._line&&!blank(s.values[i])? pct(s.values[i]||0,tot)+' of '+o.labels[i] : null) }; });
    if(o.series.length>1 && !o._line) stats.push({ l:'Total', v:fmt(tot) });
    // a share of the whole means something for bars of one kind of thing; not for lines or mixed series
    if(!o._line && o.share!==false) stats.push({ l:'Share of the chart', v:pct(tot,all), s:'across all '+o.labels.length });
    if(prev!=null && (o.series.length===1 || o.stacked) && o.series.every(function(s){ return !blank(s.values[i]) && !blank(s.values[i-1]); })) stats.push({ l:'vs '+o.labels[i-1], html:(prev? (delta(tot,prev)||'—') : '—'), s:(tot-prev>=0? fmt(tot-prev)+' more' : fmt(prev-tot)+' less') });
    return { ctx:{ kind:'column', index:i, label:o.labels[i], values:o.series.map(function(s){ return s.values[i]||0; }), total:tot },
      base:{ eyebrow:chartTitle(o._el,o), title:o.labels[i], stats:stats, color:o.series.length===1?o.series[0].color:null } };
  }

  function hoverCols(el, o, geo, fmt){
    var h='';
    for(var i=0;i<geo.n;i++) h+='<rect class="hov" role="button" aria-label="'+esc(o.labels[i])+' details" data-i="'+i+'" x="'+(geo.padL+geo.step*i)+'" y="'+geo.padT+'" width="'+geo.step+'" height="'+geo.ih+'"/>';
    return h;
  }
  function bindHover(el, o, fmt){
    el.querySelectorAll('.hov').forEach(function(r){
      var colTip=function(e){ var i=+r.getAttribute('data-i');
        showTip(e, '<b>'+esc(o.labels[i])+'</b>'+o.series.map(function(s,k){ return '<div><i style="background:'+(s.color||PAL[k%PAL.length])+'"></i>'+esc(s.name||'')+(s.name?': ':'')+fmt(s.values[i]||0)+'</div>'; }).join('')+
          (o.stacked&&o.series.length>1?'<div style="opacity:.75;margin-top:2px">Total: '+fmt(o.series.reduce(function(a,s){ return a+(s.values[i]||0); },0))+'</div>':'')); };
      r.addEventListener('mouseenter', colTip); r.addEventListener('mousemove', colTip);
      r.addEventListener('mouseleave', hideTip);
      r.addEventListener('click', function(){ hideTip(); o._el=el; var i=+r.getAttribute('data-i'), d=colDetail(o,i,fmt); openDetail(o, d.ctx, d.base); });
    });
  }
  function summary(o, fmt){ return esc((o.title||'Chart')+': '+o.series.map(function(s){ return (s.name||'')+' '+o.labels.map(function(l,i){ return l+' '+fmt(s.values[i]||0); }).join(', '); }).join('; ')); }

  function bar(el, o){
    el=$el(el); if(!el) return; o.series=o.series.map(function(s,i){ s.color=s.color||PAL[i%PAL.length]; return s; });
    var fmt=o.fmt||(o.money?money:num);
    el.classList.add('bbc');
    watch(el, function(){
      var maxes = o.stacked ? o.labels.map(function(_,i){ return o.series.reduce(function(a,s){ return a+(s.values[i]||0); },0); })
                            : [].concat.apply([], o.series.map(function(s){ return s.values; }));
      var geo=frame(el,o,{maxes:maxes}), b='';
      var groupW=geo.step*0.62, k=o.series.length, bw=o.stacked?groupW:groupW/k;
      for(var i=0;i<geo.n;i++){
        var x0=geo.padL+geo.step*i+(geo.step-groupW)/2, acc=0;
        o.series.forEach(function(s,j){
          var v=s.values[i]||0; if(v<=0) return;
          var y1=geo.y(acc+v), y0=geo.y(acc), x=o.stacked?x0:x0+bw*j, h=Math.max(1,y0-y1), r=Math.min(3,bw/2);
          b+='<path d="M'+x+','+y0+' V'+(y1+r)+' Q'+x+','+y1+' '+(x+r)+','+y1+' H'+(x+bw-r)+' Q'+(x+bw)+','+y1+' '+(x+bw)+','+(y1+r)+' V'+y0+' Z" fill="'+s.color+'"'+(s.opacity?' fill-opacity="'+s.opacity+'"':'')+'/>';
          if(o.stacked) acc+=v;
        });
      }
      el.innerHTML='<svg viewBox="0 0 '+geo.W+' '+geo.H+'" height="'+geo.H+'" role="img" aria-label="'+summary(o,fmt)+'">'+geo.g+b+hoverCols(el,o,geo,fmt)+'</svg>'+legendHtml(o.series)+(o.table?tableHtml(o.labels,o.series,fmt):'');
      bindHover(el,o,fmt);
    });
  }
  function line(el, o){
    el=$el(el); if(!el) return; o._line=true; o.series=o.series.map(function(s,i){ s.color=s.color||PAL[i%PAL.length]; return s; });
    var fmt=o.fmt||(o.money?money:num);
    el.classList.add('bbc');
    watch(el, function(){
      var geo=frame(el,o,{maxes:[].concat.apply([], o.series.map(function(s){ return s.values; }))}), p='';
      o.series.forEach(function(s,j){
        var pts=s.values.map(function(v,i){ return v==null?null:[geo.padL+geo.step*i+geo.step/2, geo.y(v||0)]; });
        var seg=pts.filter(Boolean); if(!seg.length) return;
        var d=seg.map(function(q,i){ return (i?'L':'M')+q[0].toFixed(1)+','+q[1].toFixed(1); }).join(' ');
        if(s.area || (o.area && j===0)){ var gid='g'+Math.random().toString(36).slice(2,8);
          p+='<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+s.color+'" stop-opacity=".22"/><stop offset="1" stop-color="'+s.color+'" stop-opacity="0"/></linearGradient></defs>'+
             '<path d="'+d+' L'+seg[seg.length-1][0]+','+(geo.padT+geo.ih)+' L'+seg[0][0]+','+(geo.padT+geo.ih)+' Z" fill="url(#'+gid+')"/>'; }
        p+='<path d="'+d+'" fill="none" stroke="'+s.color+'" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"'+(s.dash?' stroke-dasharray="5 4"':'')+'/>';
        if(seg.length<=24) seg.forEach(function(q){ p+='<circle cx="'+q[0]+'" cy="'+q[1]+'" r="2.8" fill="#fff" stroke="'+s.color+'" stroke-width="1.8"/>'; });
      });
      el.innerHTML='<svg viewBox="0 0 '+geo.W+' '+geo.H+'" height="'+geo.H+'" role="img" aria-label="'+summary(o,fmt)+'">'+geo.g+p+hoverCols(el,o,geo,fmt)+'</svg>'+legendHtml(o.series)+(o.table?tableHtml(o.labels,o.series,fmt):'');
      bindHover(el,o,fmt);
    });
  }
  function hbar(el, o){
    el=$el(el); if(!el) return;
    var fmt=o.fmt||(o.money?money:num);
    var max=o.max||Math.max.apply(null, o.rows.map(function(r){ return r.total!=null?r.total:(r.parts?r.parts.reduce(function(a,p){return a+p.value;},0):r.value); }).concat([1]));
    el.innerHTML='<div class="hbars">'+o.rows.map(function(r,i){
      var parts = r.parts || [{ value:r.value, color:r.color||PAL[0] }];
      var tot = r.total!=null ? r.total : parts.reduce(function(a,p){ return a+p.value; },0);
      var inner='<div class="top"><span class="n">'+esc(r.label)+(r.sub?'<small>'+esc(r.sub)+'</small>':'')+'</span><span class="val">'+(r.display||fmt(tot))+'</span></div>'+
        '<div class="trk">'+parts.map(function(p){ return '<i style="width:'+(max?Math.max(0,p.value/max*100):0)+'%;background:'+(p.color||PAL[0])+'" data-tiph="'+esc('<b>'+esc(r.label)+'</b><div><i style="background:'+(p.color||PAL[0])+'"></i>'+esc((p.name?p.name+': ':'')+fmt(p.value))+'</div>')+'"></i>'; }).join('')+'</div>';
      return '<div class="hbar" role="button" tabindex="0" data-i="'+i+'">'+inner+'</div>';
    }).join('')+'</div>'+(o.legend?'<div class="legend bbc-legend">'+o.legend.map(function(l){ return '<span><i style="background:'+l.color+'"></i>'+esc(l.name)+'</span>'; }).join('')+'</div>':'');
    var all=o.rows.reduce(function(t,r){ return t+((r.total!=null?r.total:(r.parts?r.parts.reduce(function(a,p){return a+p.value;},0):r.value))||0); },0);
    var open=function(i){
      var r=o.rows[i], parts=r.parts||null, tot=(r.total!=null?r.total:(parts?parts.reduce(function(a,p){return a+p.value;},0):r.value))||0;
      var stats=[{ l:o.valueLabel||'Value', v:r.display||fmt(tot), s:r.sub||null }];
      if(parts && parts.length>1) parts.forEach(function(p){ stats.push({ l:p.name||'Part', v:fmt(p.value), s:pct(p.value,tot)+' of the total' }); });
      if(o.rows.length>1 && o.max!==100) stats.push({ l:'Share of the list', v:pct(tot,all) });
      openDetail(o, { kind:'row', index:i, row:r, value:tot }, { eyebrow:chartTitle(el,o), title:r.label, color:(parts&&parts.length===1?parts[0].color:r.color)||null, stats:stats,
        actions: r.href? [{ label:o.openLabel||'Open', href:r.href, primary:true }] : [] });
    };
    el.querySelectorAll('.hbar').forEach(function(h){
      h.addEventListener('click', function(){ open(+h.getAttribute('data-i')); });
      h.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(+h.getAttribute('data-i')); } });
    });
  }

  function donut(el, o){
    el=$el(el); if(!el) return;
    var fmt=o.fmt||(o.money?money:num), S=o.size||148, R=S/2, r=R-16, C=2*Math.PI*r;
    var rows=o.rows.filter(function(x){ return x.value>0; }).map(function(x,i){ x.color=x.color||PAL[i%PAL.length]; return x; });
    var tot=rows.reduce(function(a,x){ return a+x.value; },0), off=0, arcs='';
    rows.forEach(function(x){ var len=tot?x.value/tot*C:0;
      arcs+='<circle class="arc" data-i="'+rows.indexOf(x)+'" cx="'+R+'" cy="'+R+'" r="'+r+'" fill="none" stroke="'+x.color+'" stroke-width="18" stroke-dasharray="'+Math.max(0,len-1.5)+' '+(C-len+1.5)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 '+R+' '+R+')" data-tiph="'+esc('<b>'+esc(x.label)+'</b><div><i style="background:'+x.color+'"></i>'+fmt(x.value)+' · '+pct(x.value,tot)+'</div>')+'"></circle>';
      off+=len; });
    el.innerHTML='<div class="donut-wrap"><svg width="'+S+'" height="'+S+'" viewBox="0 0 '+S+' '+S+'" role="img" aria-label="'+esc(rows.map(function(x){ return x.label+' '+fmt(x.value); }).join(', '))+'">'+
      '<circle cx="'+R+'" cy="'+R+'" r="'+r+'" fill="none" stroke="var(--line-soft)" stroke-width="18"/>'+arcs+
      '<text x="'+R+'" y="'+(R+2)+'" text-anchor="middle" style="font:600 '+(S>130?17:14)+'px var(--display);fill:var(--green-darkest)">'+esc(o.centre!=null?o.centre:(o.money?moneyCompact(tot):compact(tot)))+'</text>'+
      '<text x="'+R+'" y="'+(R+18)+'" text-anchor="middle" class="ax">'+esc(o.centreLabel||'total')+'</text></svg>'+
      '<div class="donut-legend">'+rows.map(function(x,i){ return '<div class="r" role="button" tabindex="0" data-i="'+i+'"><i style="background:'+x.color+'"></i><span>'+esc(x.label)+'</span><b>'+fmt(x.value)+'</b><em>'+(tot?Math.round(x.value/tot*100):0)+'%</em></div>'; }).join('')+'</div></div>';
    el.classList.add('bbc');
    var open=function(i){ var x=rows[i]; if(!x) return;
      openDetail(o, { kind:'slice', index:i, row:x, value:x.value, total:tot }, { eyebrow:chartTitle(el,o), title:x.label, color:x.color,
        stats:[{ l:o.valueLabel||'Value', v:fmt(x.value) }, { l:'Share', v:pct(x.value,tot), s:'of '+fmt(tot) }],
        actions: x.href? [{ label:o.openLabel||'Open', href:x.href, primary:true }] : [] });
    };
    el.querySelectorAll('.arc,.donut-legend .r').forEach(function(a){
      a.addEventListener('click', function(){ open(+a.getAttribute('data-i')); });
      a.addEventListener('keydown', function(e){ if(e.key==='Enter'){ open(+a.getAttribute('data-i')); } });
    });
  }

  function spark(values, o){
    o=o||{}; var W=o.width||120, H=o.height||28, c=o.color||'#68a53e';
    var v=values.map(function(x){ return +x||0; }); if(v.length<2) return '';
    var mx=Math.max.apply(null,v), mn=Math.min.apply(null,v), rg=(mx-mn)||1;
    var pts=v.map(function(x,i){ return [(i/(v.length-1)*(W-4)+2).toFixed(1), (H-3-(x-mn)/rg*(H-6)).toFixed(1)]; });
    var d=pts.map(function(p,i){ return (i?'L':'M')+p[0]+','+p[1]; }).join(' ');
    return '<svg class="spark" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" width="100%" height="'+H+'" aria-hidden="true">'+
      (o.area!==false?'<path d="'+d+' L'+pts[pts.length-1][0]+','+H+' L'+pts[0][0]+','+H+' Z" fill="'+c+'" fill-opacity=".12"/>':'')+
      '<path d="'+d+'" fill="none" stroke="'+c+'" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>';
  }
  function delta(cur, prev){
    if(!prev) return '';
    var p=Math.round((cur-prev)/Math.abs(prev)*100);
    return '<span class="delta '+(p>0?'up':p<0?'down':'flat')+'">'+(p>0?'▲ ':p<0?'▼ ':'')+Math.abs(p)+'%</span>';
  }

  // ---- expose ---------------------------------------------------
  window.BB = window.BB || {};
  Object.assign(window.BB, {
    esc:esc, toast:toast, snapshot:snapshot, toastAcrossReload:toastAcrossReload, pendingUndo:pendingUndo, lateDays:lateDays, etaHtml:etaHtml, farmBadge:farmBadge, money:money, money2:money2, num:num, date:date, shortDate:shortDate,
    monthName:monthName, statusBadge:statusBadge, initials:initials,
    renderHeader:renderHeader, refreshSync:refreshSync, icon:icon,
    toggleRail:toggleRail, closeRail:closeRail, filterNav:filterNav, navSearchActive:navSearchActive, navSearchKey:navSearchKey,
    toggleNav:toggleNav, toggleUser:toggleUser, PAL:PAL, delta:delta, railPages:railPages,
    popup:popup, closePopup:closePopup, pick:pick, confirm:confirmBox, enhance:enhanceAll, statDetail:function(k,fn){ STAT_DETAIL[k]=fn; },
    chart:{ bar:bar, line:line, hbar:hbar, donut:donut, spark:spark, compact:compact, moneyCompact:moneyCompact },
    sageLive:sageLive, sageReal:sageReal, isSample:isSample, sampleNote:sampleNote, sageAge:sageAge, staleNote:staleNote,
    sampleChip:function(rec){ return isSample(rec) && sageReal() ? '<span class="chip-sample">Sample</span>' : ''; },
    // a made-up ledger (demo mode) says so, so sample figures are never read as the real books
    liveChip:function(){ if(!sageLive()) return ''; var sg=BB.data&&BB.data.sage&&BB.data.sage();
      return sg&&sg.demo ? '<span class="chip-live" data-tip="Made-up figures in the shape of your accounting system">Sample ledger</span>' : '<span class="chip-live">From your accounts</span>'; },
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
