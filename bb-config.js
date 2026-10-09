/* BioBrix OS — build config. Loaded before guard.js on every page.
   AUTH: 'live'  = real accounts (email + password, HMAC session from the fh-biobrix Worker,
                   14-day expiry, deactivated users cut off server-side). No demo seats, no ?seat=.
         'demo'  = the original self-contained demo gate (shared access code, tap-a-seat).
   API:  the fh-biobrix Worker. Sage figures are only ever served from behind a session. */
(function(){
  var local = location.hostname==='localhost' || location.hostname==='127.0.0.1';
  // The redesign preview on GitHub Pages: real accounts and BioBrix's own figures, open to Rudie alone.
  var preview = /^\/biobrix-portal-redesign\//.test(location.pathname);
  // The preview shares claireboshoff.github.io with other BioBrix builds, and so shares their
  // browser storage. Give it its own, so a session or cached ledger from another build never
  // carries over into it — or out of it.
  if(preview && !window.__bbStorageSplit){
    window.__bbStorageSplit = true;
    var P = 'bbprev:', S = Storage.prototype, get = S.getItem, set = S.setItem, del = S.removeItem;
    S.getItem = function(k){ return get.call(this, P+k); };
    S.setItem = function(k, v){ return set.call(this, P+k, v); };
    S.removeItem = function(k){ return del.call(this, P+k); };
  }
  window.BB_CONFIG = {
    PREVIEW: preview,
    // A local copy runs the self-contained demo (no Worker needed); everything else signs in for real.
    AUTH: local ? 'demo' : 'live',
    // Who may sign in to this build at all (lower-case emails). Empty = every BioBrix account.
    ALLOW: preview ? ['rudie@biobrix.co.za', 'claire.boshoff@gmail.com'] : [],
    API: local ? 'http://localhost:8787' : 'https://fh-biobrix.claire-boshoff.workers.dev',
    // The Ask bar's brain (ask-worker/). Until it is deployed with a key, questions fall back to the built-in rules.
    ASK_API: local ? 'http://localhost:8788' : 'https://fh-biobrix-ask.claire-boshoff.workers.dev'
  };
})();
