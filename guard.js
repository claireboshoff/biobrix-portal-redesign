/* ============================================================
   BioBrix OS — session guard. Loads BEFORE bb-shell.js.
   Two modes, chosen in bb-config.js:
     live — email + password against the fh-biobrix Worker; HMAC session token
            (14 days) kept in localStorage; every page checks it; the Worker
            re-checks it on every data call, so a removed user is out at once.
     demo — the original self-contained demo gate (shared code, tap-a-seat).
   The role model is the same in both, so pages need no change.
   ============================================================ */
(function () {
  "use strict";
  // An installed copy of this app can be held on an OLD service worker that still serves the
  // previous sign-in code from its cache — which locks people out after an auth change. Force a
  // check on every load, and reload once (never twice) when a new worker takes control.
  try{
    if('serviceWorker' in navigator){
      navigator.serviceWorker.getRegistrations().then(function(rs){ rs.forEach(function(r){ try{ r.update(); }catch(e){} }); });
      navigator.serviceWorker.addEventListener('controllerchange', function(){
        try{ if(sessionStorage.getItem('bb_swreload')) return; sessionStorage.setItem('bb_swreload','1'); }catch(e){}
        location.reload();
      });
    }
  }catch(e){}
  // If this page came out of a cache and is older than what is published, reload it once, with a
  // cache-busting parameter. Without this a stale copy can sit on a device for as long as the CDN
  // cache lives, and everything we ship looks like it never happened.
  var BUILD = 'redesign1';
  try{
    if(typeof fetch==='function' && navigator.onLine){
      fetch('version.txt?_=' + Date.now(), {cache:'no-store'}).then(function(r){ return r.ok? r.json():null; }).then(function(j){
        if(!j || !j.commit) return;
        var latest = String(j.build || j.commit || '');
        if(!latest || latest === BUILD) return;
        try{ if(sessionStorage.getItem('bb_stale_'+latest)) return; sessionStorage.setItem('bb_stale_'+latest,'1'); }catch(e){}
        var u = location.pathname + (location.search ? location.search + '&' : '?') + '_=' + Date.now() + location.hash;
        location.replace(u);
      }).catch(function(){});
    }
  }catch(e){}

  var CFG = window.BB_CONFIG || {};
  var LIVE = CFG.AUTH === 'live';
  var API  = CFG.API || '';
  var UKEY = 'bb_user_v1';
  var TKEY = 'bb_token_v1';

  // Demo personas — let Rudie explore every seat. (Not real credentials.)
  var USERS = [
    { id:'u_rudie', email:'rudie@biobrix.co.za',  name:'Rudie Willemse',    role:'Director · Technical & Strategy', roleKey:'director',   rep:'rep_rudie', region:'Tzaneen · George' },
    { id:'u_juba',  email:'juba@biobrix.co.za',   name:'Juba de Wet',       role:'Sales Lead · Crop Advisor',       roleKey:'advisor',    rep:'rep_juba',  region:'Limpopo' },
    { id:'u_johan', email:'johan@biobrix.co.za',  name:'Johan Coetzee',     role:'Director · Business Development', roleKey:'director',   rep:'rep_johan', region:'Ballito' },
    { id:'u_nadine',email:'nadine@biobrix.co.za', name:'Nadine du Plessis', role:'Director · Financial Management', roleKey:'finance',    rep:null, region:'Tzaneen' },
    { id:'u_koos',  email:'koos@biobrix.co.za',   name:'Koos Smit',         role:'Director · Financial Advisory',   roleKey:'director',   rep:null, region:'Tzaneen' },
    { id:'u_wikus', email:'wikus@biobrix.co.za',  name:'Wikus Steyn',       role:'Accounts',                        roleKey:'finance',    rep:null, region:'Tzaneen' },
    { id:'u_ops',   email:'renzie@biobrix.co.za', name:'Renzie Botha',      role:'Logistics & Orders',              roleKey:'operations', rep:null, region:'Somerset West' },
    { id:'u_wh',    email:'depot@biobrix.co.za',  name:'Wentzel Kruger',    role:'Warehouse · demo seat',           roleKey:'warehouse',  rep:null, region:'George Depot', depot:'dep_george' },
    { id:'u_farmer',email:'gideon@rietvlei.co.za',name:'Gideon Joubert',    role:'Farmer · Rietvlei Boerdery',      roleKey:'farmer',     rep:null, region:'Tzaneen', farmer:'f_joubert' }
  ];
  var DEMO_PIN = 'biobrix'; // demo access code

  // What each role can see (drives nav + home). Directors see all.
  var ACCESS = {
    director:  ['home','sales','ops','tech','voice','forecast','plan','salesreport','commission','territory','orders','stock','depots','suppliers','deliveries','bioservices','farms','biowatch','bioconsult','bioanalyze','products','files','client','team','labels','intelligence','finance','dispatch','jobs'],
    advisor:   ['home','tech','sales','voice','forecast','plan','salesreport','bioservices','farms','biowatch','bioconsult','bioanalyze','products','files','orders','client','team','intelligence','jobs'],
    operations:['home','sales','ops','orders','forecast','territory','stock','depots','suppliers','deliveries','files','team','labels','intelligence','dispatch','jobs'],
    finance:   ['home','sales','ops','orders','forecast','plan','salesreport','commission','finance','deliveries','stock','files','team','intelligence','jobs'],
    warehouse: ['home','stock','depots','deliveries','team','labels','dispatch','jobs'],
    farmer:    ['home','client']
  };

  // Sections that still run on demonstration data. Once BioBrix's own figures are flowing, their
  // people should meet their business — not our sample farms. FreedomHub seats keep everything so
  // the full product can still be shown and worked on.
  var DEMO_SECTIONS = ['forecast','territory','orders','stock','depots','suppliers','deliveries',
    'bioservices','biowatch','bioconsult','bioanalyze','products','files','team','labels','voice','client'];
  function isFreedomHubSeat(u){ return !!(u && /@freedomhub\.io$/i.test(u.email||'')); }
  // Is this BUSINESS running on its own figures? That is a fact about BioBrix, not about the seat
  // looking at it — a depot may not read the ledger, and must still stop being shown sample farms.
  // The API says so on sign-in; the cached ledger is only a fallback for sessions signed in earlier.
  var LIVEKEY = 'bb_tenant_live_v1';
  function setTenantLive(v){ try{ if(v) localStorage.setItem(LIVEKEY,'1'); }catch(e){} }
  function sageIsLive(){
    try{ if(localStorage.getItem(LIVEKEY)==='1') return true; }catch(e){}
    try{ var c=JSON.parse(localStorage.getItem('bb_sage_v1')); return !!(c && c.live); }catch(e){ return false; }
  }
  function visibleSections(u, list){
    if(!list) return list;
    if(isFreedomHubSeat(u) || !sageIsLive()) return list;
    return list.filter(function(k){ return DEMO_SECTIONS.indexOf(k) < 0; });
  }

  function getUser(){ try{ return JSON.parse(localStorage.getItem(UKEY)); }catch(e){ return null; } }
  function setUser(u){ try{ localStorage.setItem(UKEY, JSON.stringify(u)); }catch(e){} }

  // Demo convenience: ?seat=director|advisor|operations|warehouse auto-signs-in
  // that role (enables live embedding in the device showcase + deep-links).
  if(!LIVE) try{
    var seat=new URLSearchParams(location.search).get('seat');
    if(seat){ var su=USERS.find(function(x){return x.roleKey===seat.toLowerCase()||x.id===seat||x.email.toLowerCase()===seat.toLowerCase();}); if(su) setUser(su); }
  }catch(e){}

  function getToken(){ try{ return localStorage.getItem(TKEY)||''; }catch(e){ return ''; } }
  function setToken(t){ try{ if(t) localStorage.setItem(TKEY,t); else localStorage.removeItem(TKEY); }catch(e){} }
  // The token carries its own expiry (exp, unix seconds) — an expired one is dropped on the client too.
  function tokenValid(t){
    if(!t) return false;
    try{ var b=JSON.parse(atob(t.split('.')[0].replace(/-/g,'+').replace(/_/g,'/'))); return !!(b.exp && b.exp*1000 > Date.now()); }catch(e){ return false; }
  }
  function clearSession(){ try{ localStorage.removeItem(UKEY); localStorage.removeItem(TKEY); }catch(e){} }

  var onLogin = /login\.html$/.test(location.pathname) || location.pathname==='/login.html';
  // Opening the login page ALWAYS signs the current seat out — it is the "switch seat" door.
  if(onLogin){ clearSession(); }
  var user = getUser();
  if(LIVE && user && !tokenValid(getToken())){ clearSession(); user=null; }

  // gate
  if(!user && !onLogin){
    location.replace('login.html?return='+encodeURIComponent(location.pathname.split('/').pop()+location.search));
    return;
  }

  // page-level access enforcement — a seat can't reach a page outside its role
  var PAGE_KEY = {
    'voice-order.html':'voice','forecast.html':'forecast','territory.html':'territory','orders.html':'orders',
    'operations.html':'ops','stock.html':'stock','depots.html':'depots','suppliers.html':'suppliers','deliveries.html':'deliveries',
    'bioservices.html':'bioservices','farms.html':'farms','farm-detail.html':'farms','bioanalyze-soil.html':'bioanalyze',
    'bioanalyze-leaf.html':'bioanalyze','biowatch.html':'biowatch','bioconsult.html':'bioconsult','products-library.html':'products',
    'farm-files.html':'files','client-portal.html':'client','team.html':'team','labels.html':'labels',
    'finance.html':'finance','jobs.html':'jobs','dispatch.html':'dispatch','showcase.html':'showcase',
    'forecast-plan.html':'plan','sales-report.html':'salesreport','commission.html':'commission'
  };
  if(user){
    // a host may serve "/finance" or "/finance.html" — the access rules must hold either way
    var pageFile = location.pathname.split('/').pop() || 'index.html';
    if(pageFile.indexOf('.')<0) pageFile += '.html';
    // a farmer's home IS their farm portal
    if(user.roleKey==='farmer' && (pageFile==='' || pageFile==='index.html')){ location.replace('client-portal.html'); return; }
    var pk = PAGE_KEY[pageFile];
    // The device showcase is how FreedomHub demonstrates the product — it is not part of anyone's job.
    if(pk === 'showcase'){ if(!isFreedomHubSeat(user)){ location.replace('index.html'); return; } }
    else {
      var allowed = visibleSections(user, ACCESS[user.roleKey]||[]);
      if(pk && allowed.indexOf(pk) < 0){ location.replace('index.html'); return; }
    }
  }

  window.BB = window.BB || {};
  window.BB.user = user;
  window.BB.users = USERS;
  // Live: POST /login → { token, user }. Returns a Promise. Demo: synchronous, as before.
  function liveLogin(email, password){
    return fetch(API+'/login',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:email, password:password}) })
      .then(function(r){ return r.json().then(function(j){ j._status=r.status; return j; }); })
      .then(function(j){
        if(!j.ok){ return { ok:false, err:j.error||'Sign-in failed.' }; }
        setToken(j.token); setUser(j.user); window.BB.user=j.user; setTenantLive(j.live); return { ok:true, user:j.user };
      })
      .catch(function(){ return { ok:false, err:'No signal — sign-in needs a connection the first time.' }; });
  }
  function demoLogin(email, pin){
    var u = USERS.find(function(x){return x.email.toLowerCase()===String(email||'').toLowerCase();});
    if(!u) return { ok:false, err:'No account for that email.' };
    if(String(pin||'').trim().toLowerCase()!==DEMO_PIN) return { ok:false, err:'Incorrect access code.' };
    setUser(u); window.BB.user=u; return { ok:true, user:u };
  }
  // Authenticated fetch against the Worker. 401 = session gone → back to sign-in.
  function api(path, opts){
    opts=opts||{}; var h=Object.assign({}, opts.headers||{}); var t=getToken(); if(t) h['Authorization']='Bearer '+t;
    if(opts.body && typeof opts.body!=='string'){ opts.body=JSON.stringify(opts.body); h['Content-Type']='application/json'; }
    return fetch(API+path, Object.assign({}, opts, {headers:h})).then(function(r){
      if(r.status===401){ clearSession(); location.replace('login.html?return='+encodeURIComponent(location.pathname.split('/').pop()+location.search)); throw new Error('unauthenticated'); }
      return r.json();
    });
  }
  // A session that began before the flag existed learns it on the next page load.
  if(LIVE && user){
    try{
      if(localStorage.getItem(LIVEKEY)!=='1'){
        api('/me').then(function(j){ if(j && j.live){ setTenantLive(true); } }).catch(function(){});
      }
    }catch(e){}
  }

  window.BB.auth = {
    live:LIVE, api:API, token:getToken, fetch:api, tenantLive:sageIsLive, setTenantLive:setTenantLive,
    login:function(email, pw){ return LIVE ? liveLogin(email, pw) : demoLogin(email, pw); },
    persona:function(id){ if(LIVE) return null; var u=USERS.find(function(x){return x.id===id;}); if(u){ setUser(u); window.BB.user=u; } return u; },
    logout:function(){ clearSession(); location.replace('login.html'); },
    can:function(section){ var r=(window.BB.user&&window.BB.user.roleKey)||'director';
      return visibleSections(window.BB.user, ACCESS[r]||[]).indexOf(section)>=0; },
    isFreedomHub:function(){ return isFreedomHubSeat(window.BB.user); },
    // may this person open this page? asked by destination, never by what a menu calls it
    canPage:function(href){
      var f = String(href||'').split('/').pop().split('?')[0];
      if(f.indexOf('.')<0) f += '.html';
      if(f==='index.html'||f==='login.html'||f==='welcome.html') return true;
      var key = PAGE_KEY[f];
      if(!key) return true;
      if(key === 'showcase') return isFreedomHubSeat(window.BB.user);
      var r=(window.BB.user&&window.BB.user.roleKey)||'director';
      return visibleSections(window.BB.user, ACCESS[r]||[]).indexOf(key)>=0;
    },
    users: LIVE ? [] : USERS, pinHint: LIVE ? '' : DEMO_PIN
  };
})();
