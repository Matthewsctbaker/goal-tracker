# Goal Tracker

A personal goal-tracking web app for **Matthew** and **Violette**, with a board/timeline
view, progress counters, and per-year plans.

- **Hosting:** GitHub Pages (auto-deploys on push to `main`).
- **Storage:** Firebase Firestore — goals sync in real time across devices.
- **Auth:** Google sign-in, locked to a single account via Firestore security rules.

No build step and no personal data live in this repo. The app is plain React
(vendored in `lib/`) with the JSX pre-compiled to `app.js`. Your actual goals are
stored privately in Firestore, never in the source.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Entry point — loads React, Firebase, and the app |
| `app.jsx` | App source (JSX) |
| `app.js` | Pre-compiled app (what the page actually loads) |
| `seed.js` | People + categories only (no goal data) |
| `firebase-config.js` | Public Firebase web config |
| `styles.css` | Styling |
| `lib/` | Vendored React + ReactDOM |

## Run locally

```bash
python3 -m http.server 8777
```

Then open http://localhost:8777 — `localhost` is an authorised Firebase domain, so
Google sign-in works in local dev too.

## Editing

Edit `app.jsx`, then re-generate `app.js` (the compiled file the page loads). Any
JS environment with Babel works; the maintainer uses an offline Babel transform.

## Security rules

Firestore is locked to one Google account. See the project's Firestore rules — only
the allowed, verified email may read or write `trackers/main`.
