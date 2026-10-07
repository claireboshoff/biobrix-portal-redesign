/* BioBrix OS — build config. Loaded before guard.js on every page.
   AUTH: 'live'  = real accounts (email + password, HMAC session from the fh-biobrix Worker,
                   14-day expiry, deactivated users cut off server-side). No demo seats, no ?seat=.
         'demo'  = the original self-contained demo gate (shared access code, tap-a-seat).
   API:  the fh-biobrix Worker. Sage figures are only ever served from behind a session. */
window.BB_CONFIG = {
  AUTH: 'live',
  API: (location.hostname==='localhost'||location.hostname==='127.0.0.1') ? 'http://localhost:8787' : 'https://fh-biobrix.claire-boshoff.workers.dev'
};
