/* BioBrix OS — build config. Loaded before guard.js on every page.
   AUTH: 'live'  = real accounts (email + password, HMAC session from the fh-biobrix Worker,
                   14-day expiry, deactivated users cut off server-side). No demo seats, no ?seat=.
         'demo'  = the original self-contained demo gate (shared access code, tap-a-seat).
   API:  the fh-biobrix Worker. Sage figures are only ever served from behind a session. */
window.BB_CONFIG = {
  // Local preview runs the self-contained demo (no Worker needed); production stays on real accounts.
  AUTH: (location.hostname==='localhost'||location.hostname==='127.0.0.1') ? 'demo' : 'live',
  API: (location.hostname==='localhost'||location.hostname==='127.0.0.1') ? 'http://localhost:8787' : 'https://fh-biobrix.claire-boshoff.workers.dev',
  // The Ask bar's brain (ask-worker/). Until it is deployed with a key, questions fall back to the built-in rules.
  ASK_API: (location.hostname==='localhost'||location.hostname==='127.0.0.1') ? 'http://localhost:8788' : 'https://fh-biobrix-ask.claire-boshoff.workers.dev'
};
