// People + categories for the app. NO personal goal data lives here — the real
// goals are stored privately in Firebase (Firestore), not in this public repo.
// SEED_GOALS is intentionally empty; the app loads goals from the cloud.

window.SEED_YEAR = 2025;
window.SEED_VERSION = 3;

window.SEED_PEOPLE = [
  { id: "matthew", name: "Matthew", emoji: "🧔‍♂️" },
  { id: "violette", name: "Violette", emoji: "🌻" },
];

window.SEED_CATEGORIES = [
  { id: "personal", name: "Personal Dev / Fun", color: "#16a34a" },
  { id: "financial", name: "Financial Freedom", color: "#7c3aed" },
  { id: "career", name: "Career Development", color: "#dc2626" },
  { id: "achievements", name: "Achievements", color: "#dc2626" },
  { id: "fitness", name: "Fitness", color: "#2563eb" },
];

// Empty by design — data comes from Firestore. (Local/offline fallback also
// starts empty here.)
window.SEED_GOALS = [];
