/* BioBrix OS — build config. Loaded before guard.js on every page.
   AUTH: 'live'  = real accounts (email + password, HMAC session from the fh-biobrix Worker,
                   14-day expiry, deactivated users cut off server-side). No demo seats, no ?seat=.
         'demo'  = the original self-contained demo gate (shared access code, tap-a-seat).
   API:  the fh-biobrix Worker. Sage figures are only ever served from behind a session. */
(function(){
  var local = location.hostname==='localhost' || location.hostname==='127.0.0.1';
  // The redesign preview on GitHub Pages runs the demo, like a local copy: every seat, sample data.
  var preview = /^\/biobrix-portal-redesign\//.test(location.pathname);
  // The preview shares claireboshoff.github.io with other BioBrix builds, and so shares their
  // browser storage. Give it its own: its demo seats and sample data must never land in, or be
  // hidden by, a real sign-in or Sage cache kept by another build on the same address.
  if(preview && !window.__bbStorageSplit){
    window.__bbStorageSplit = true;
    var P = 'bbprev:', S = Storage.prototype, get = S.getItem, set = S.setItem, del = S.removeItem;
    S.getItem = function(k){ return get.call(this, P+k); };
    S.setItem = function(k, v){ return set.call(this, P+k, v); };
    S.removeItem = function(k){ return del.call(this, P+k); };
  }
  window.BB_CONFIG = {
    PREVIEW: preview,
    // Local and preview copies run the self-contained demo (no Worker needed); production stays on real accounts.
    AUTH: (local || preview) ? 'demo' : 'live',
    API: local ? 'http://localhost:8787' : 'https://fh-biobrix.claire-boshoff.workers.dev',
    // The Ask bar's brain (ask-worker/). Until it is deployed with a key, questions fall back to the built-in rules.
    ASK_API: local ? 'http://localhost:8788' : 'https://fh-biobrix-ask.claire-boshoff.workers.dev'
  };
})();
