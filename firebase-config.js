// Firebase web config. Safe to commit — these are public client-side identifiers,
// not secrets. Access is protected by Firestore security rules (locked to a single
// Google account), not by hiding these values.
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBH_iCYI0PwEcy38iMkYoB0Aq5j2XED3wM",
  authDomain: "goal-tracker-2026-5a2ca.firebaseapp.com",
  projectId: "goal-tracker-2026-5a2ca",
  storageBucket: "goal-tracker-2026-5a2ca.firebasestorage.app",
  messagingSenderId: "664387932371",
  appId: "1:664387932371:web:ac467102f806e0c1128426",
};

// The only Google account allowed to sign in (UI hint; the real enforcement is in
// Firestore security rules).
window.ALLOWED_EMAIL = "matthew.sct.baker@gmail.com";
