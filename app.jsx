const { useState, useEffect, useMemo, useRef } = React;

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUSES = [
  { id: "done", label: "Done", icon: "✓" },
  { id: "active", label: "Active", icon: "◐" },
  { id: "planned", label: "Planned", icon: "○" },
  { id: "missed", label: "Missed", icon: "✕" },
];
const STORE_KEY = "goals-app-v1";

// ---------- Firebase (optional — active only when configured) ----------
const CFG = (typeof window !== "undefined" && window.FIREBASE_CONFIG) || null;
const USE_FB = !!(CFG && typeof firebase !== "undefined");
let fbAuth = null, fbDb = null;
if (USE_FB) {
  firebase.initializeApp(CFG);
  fbAuth = firebase.auth();
  fbDb = firebase.firestore();
}
const goalsDoc = () => fbDb.collection("trackers").doc("main");

// ---------- local cache ----------
// The synced document is { goals: [...], whoami: { <person>: "text" } }.
function loadLocalDoc() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { goals: Array.isArray(s.goals) ? s.goals : window.SEED_GOALS.slice(),
               whoami: s.whoami || {} };
    }
  } catch (e) { /* ignore */ }
  return { goals: window.SEED_GOALS.slice(), whoami: {} };
}
function saveLocalDoc(data) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ goals: data.goals, whoami: data.whoami, seedVersion: window.SEED_VERSION })); }
  catch (e) { /* ignore */ }
}

// ---------- store: Firestore when signed in, else localStorage ----------
function useCloudDoc(user) {
  const [data, setData] = useState(() => (USE_FB ? { goals: [], whoami: {} } : loadLocalDoc()));
  const [sync, setSync] = useState(USE_FB ? "loading" : "local"); // loading|synced|saving|offline|local
  const skipWrite = useRef(false);
  const ready = useRef(false);

  // subscribe to the cloud document
  useEffect(() => {
    if (!USE_FB || !user) return;
    ready.current = false;
    setSync("loading");
    const unsub = goalsDoc().onSnapshot(
      (snap) => {
        if (snap.exists) {
          const d = snap.data();
          skipWrite.current = true;
          setData({ goals: d.goals || [], whoami: d.whoami || {} });
          ready.current = true;
          setSync("synced");
        } else {
          goalsDoc().set({ goals: loadLocalDoc().goals, whoami: {}, updatedAt: Date.now() });
        }
      },
      () => setSync("offline")
    );
    return unsub;
  }, [user]);

  // write local changes back to the cloud (debounced), and always cache locally
  useEffect(() => {
    saveLocalDoc(data);
    if (!USE_FB || !user) return;
    if (skipWrite.current) { skipWrite.current = false; return; }
    if (!ready.current) return;
    setSync("saving");
    const t = setTimeout(() => {
      goalsDoc().set({ goals: data.goals, whoami: data.whoami, updatedAt: Date.now() })
        .then(() => setSync("synced"))
        .catch(() => setSync("offline"));
    }, 400);
    return () => clearTimeout(t);
  }, [data, user]);

  return [data, setData, sync];
}

const horizonOf = (g) => g.horizon || "12m";

function App({ user, onSignOut }) {
  const cats = window.SEED_CATEGORIES;
  const people = window.SEED_PEOPLE;

  const [data, setData, sync] = useCloudDoc(user);
  const goals = data.goals;
  function setGoals(updater) {
    setData((d) => ({ ...d, goals: typeof updater === "function" ? updater(d.goals) : updater }));
  }

  const [person, setPerson] = useState("matthew");
  const [section, setSection] = useState("12m"); // 12m | 5y | whoami (Matthew only)
  const [catFilter, setCatFilter] = useState("all");
  const [view, setView] = useState("board");
  const [editing, setEditing] = useState(null);

  // Sub-tabs are Matthew-only; force the goals view for anyone else.
  useEffect(() => { if (person !== "matthew" && section !== "12m") setSection("12m"); }, [person]);
  const goalSection = section === "5y" ? "5y" : "12m";

  const years = useMemo(() => {
    const s = new Set(goals.filter((x) => horizonOf(x) === goalSection).map((x) => x.year || window.SEED_YEAR));
    if (!s.size) s.add(window.SEED_YEAR);
    return Array.from(s).sort((a, b) => a - b);
  }, [goals, goalSection]);
  const [year, setYear] = useState(() => Math.max.apply(null, years));
  useEffect(() => {
    if (!years.includes(year)) setYear(Math.max.apply(null, years));
  }, [years]); // keep selected year valid as data / section loads

  const mine = useMemo(
    () => goals.filter((x) => x.person === person && horizonOf(x) === goalSection && (x.year || window.SEED_YEAR) === year),
    [goals, person, year, goalSection]
  );
  const presentCats = useMemo(
    () => cats.filter((c) => mine.some((x) => x.category === c.id)),
    [cats, mine]
  );
  useEffect(() => { setCatFilter("all"); }, [person, year]);

  const visible = useMemo(
    () => (catFilter === "all" ? mine : mine.filter((x) => x.category === catFilter)),
    [mine, catFilter]
  );

  const counts = useMemo(() => {
    const c = { done: 0, missed: 0, planned: 0, active: 0, total: mine.length };
    mine.forEach((x) => { c[x.status] = (c[x.status] || 0) + 1; });
    return c;
  }, [mine]);
  const pctDone = counts.total ? Math.round((counts.done / counts.total) * 100) : 0;

  function setStatus(id, status) {
    setGoals((gs) => gs.map((x) => {
      if (x.id !== id) return x;
      let progress = x.progress || 0;
      if (x.target > 0) { if (status === "done") progress = x.target; else if (status === "planned") progress = 0; }
      return { ...x, status, progress };
    }));
  }
  function setProgress(id, next) {
    setGoals((gs) => gs.map((x) => {
      if (x.id !== id) return x;
      const target = x.target || 0;
      const progress = Math.max(0, Math.min(target, next));
      let status = x.status;
      if (target > 0) {
        if (progress >= target) status = "done";
        else if (progress > 0) status = "active";
        else if (status === "done" || status === "active") status = "planned";
      }
      return { ...x, progress, status };
    }));
  }
  function removeGoal(id) { setGoals((gs) => gs.filter((x) => x.id !== id)); }
  function saveGoal(data) {
    const target = data.target || 0;
    const clean = { ...data, target, progress: target > 0 ? Math.max(0, Math.min(target, data.progress || 0)) : 0 };
    if (clean.id) setGoals((gs) => gs.map((x) => (x.id === clean.id ? { ...x, ...clean } : x)));
    else setGoals((gs) => [...gs, { ...clean, id: "g-" + Date.now() + "-" + Math.floor(Math.random() * 1e4) }]);
    setEditing(null);
  }

  const catById = (id) => cats.find((c) => c.id === id);
  const personCount = (pid) =>
    goals.filter((x) => x.person === pid && horizonOf(x) === "12m" && (x.year || window.SEED_YEAR) === year).length;

  const whoamiText = (data.whoami && data.whoami[person]) || "";
  const setWhoami = (text) => setData((d) => ({ ...d, whoami: { ...(d.whoami || {}), [person]: text } }));

  const SUBTABS = [
    { id: "12m", label: "Twelve Month Goals" },
    { id: "5y", label: "Five Year Goals" },
    { id: "whoami", label: "Who am I?" },
    { id: "os", label: "Operating System" },
  ];

  return (
    <div>
      <header className="app-head">
        <div className="head-row">
          <h1 className="app-title">🎯 <span className="accent">Goal Tracker</span></h1>
          <div className="people">
            {people.map((p) => (
              <button key={p.id} className={"person-tab" + (person === p.id ? " active" : "")}
                data-p={p.id} onClick={() => setPerson(p.id)}>
                <span className="emoji">{p.emoji}</span>{p.name}
                <span className="count">{personCount(p.id)}</span>
              </button>
            ))}
          </div>
          <span className="spacer" />
          {(section === "12m" || section === "5y") && (
            <div className="seg year-seg">
              {years.map((y) => (
                <button key={y} className={year === y ? "active" : ""} onClick={() => setYear(y)}>{y}</button>
              ))}
            </div>
          )}
        </div>
        <div className="sub-row">
          <p className="app-sub">Track your goals and Violette's — from your Year Plans.</p>
          <SyncBadge sync={sync} user={user} onSignOut={onSignOut} />
        </div>
      </header>

      {person === "matthew" && (
        <div className="subtabs">
          {SUBTABS.map((t) => (
            <button key={t.id} className={"subtab" + (section === t.id ? " active" : "")}
              onClick={() => setSection(t.id)}>{t.label}</button>
          ))}
        </div>
      )}

      {section === "whoami" ? (
        <WhoAmI value={whoamiText} onChange={setWhoami} name={people.find((p) => p.id === person).name} />
      ) : section === "os" ? (
        <OperatingSystem content={window.OS_CONTENT} />
      ) : (
      <React.Fragment>
      <div className="summary">
        <div className="stat">
          <div className="k">Completion</div>
          <div className="v">{pctDone}%</div>
          <div className="bar"><i style={{ width: pctDone + "%", background: "var(--done)" }} /></div>
        </div>
        <div className="stat"><div className="k">Done</div><div className="v" style={{ color: "var(--done)" }}>{counts.done}</div></div>
        <div className="stat"><div className="k">Missed</div><div className="v" style={{ color: "var(--missed)" }}>{counts.missed}</div></div>
        <div className="stat"><div className="k">Open</div><div className="v" style={{ color: "var(--active)" }}>{counts.active + counts.planned}</div></div>
      </div>

      <div className="toolbar">
        <button className={"chip" + (catFilter === "all" ? " active" : "")} onClick={() => setCatFilter("all")}>All</button>
        {presentCats.map((c) => (
          <button key={c.id} className={"chip" + (catFilter === c.id ? " active" : "")} onClick={() => setCatFilter(c.id)}>
            <span className="dot" style={{ background: c.color }} />{c.name}
          </button>
        ))}
        <span className="spacer" />
        <div className="seg">
          <button className={view === "board" ? "active" : ""} onClick={() => setView("board")}>Board</button>
          <button className={view === "timeline" ? "active" : ""} onClick={() => setView("timeline")}>Timeline</button>
        </div>
        <button className="btn-add" onClick={() => setEditing({ person, category: catFilter === "all" ? "personal" : catFilter, month: 1, status: "planned", title: "", note: "", year, target: 0, progress: 0, horizon: goalSection })}>+ Add goal</button>
      </div>

      {sync === "loading" ? (
        <div className="empty"><div className="big">☁️</div><div>Loading your goals…</div></div>
      ) : visible.length === 0 ? (
        <div className="empty">
          <div className="big">🌱</div>
          <div><strong>No goals yet</strong></div>
          <div>Add your first {section === "5y" ? "five-year" : ""} goal to get started.</div>
        </div>
      ) : view === "board" ? (
        <BoardView cats={cats} catFilter={catFilter} visible={visible}
          setStatus={setStatus} setProgress={setProgress} onEdit={setEditing} onDelete={removeGoal} />
      ) : (
        <TimelineView cats={cats} visible={visible} catById={catById} />
      )}
      </React.Fragment>
      )}

      {editing && (
        <GoalModal goal={editing} cats={cats} people={people}
          onSave={saveGoal} onCancel={() => setEditing(null)} />
      )}

      <p className="footnote">
        {USE_FB ? "Synced to your private cloud — open it on any device signed in as you." :
          "Saved in this browser."} Tap the status buttons to update a goal, or use the − / + steppers
        on goals that track a count.
      </p>
    </div>
  );
}

function SyncBadge({ sync, user, onSignOut }) {
  const map = {
    synced: { t: "Synced", c: "var(--done)" },
    saving: { t: "Saving…", c: "var(--active)" },
    loading: { t: "Loading…", c: "var(--muted)" },
    offline: { t: "Offline", c: "var(--missed)" },
    local: { t: "Local only", c: "var(--muted)" },
  };
  const s = map[sync] || map.local;
  return (
    <div className="sync">
      <span className="sync-dot" style={{ background: s.c }} />
      <span className="sync-t">{s.t}</span>
      {user && !user.local ? (
        <button className="signout" title={user.email} onClick={onSignOut}>Sign out</button>
      ) : null}
    </div>
  );
}

function BoardView({ cats, catFilter, visible, setStatus, setProgress, onEdit, onDelete }) {
  const shown = catFilter === "all" ? cats : cats.filter((c) => c.id === catFilter);
  return (
    <div>
      {shown.map((c) => {
        const items = visible.filter((x) => x.category === c.id).sort((a, b) => a.month - b.month);
        if (items.length === 0) return null;
        const done = items.filter((x) => x.status === "done").length;
        return (
          <section className="cat-group" key={c.id}>
            <div className="cat-head">
              <span className="swatch" style={{ background: c.color }} />
              <h2>{c.name}</h2>
              <span className="frac">{done}/{items.length}</span>
            </div>
            <div className="goal-grid">
              {items.map((goal) => (
                <GoalCard key={goal.id} goal={goal} color={c.color}
                  setStatus={setStatus} setProgress={setProgress} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function GoalCard({ goal, color, setStatus, setProgress, onEdit, onDelete }) {
  const target = goal.target || 0;
  const progress = goal.progress || 0;
  const pct = target > 0 ? Math.round((progress / target) * 100) : 0;
  return (
    <div className={"goal " + goal.status} style={{ borderLeftColor: color }}>
      <div className="top">
        <div className="title">{goal.title}</div>
        <div className="actions">
          <button className="icon-btn" title="Edit" onClick={() => onEdit(goal)}>✎</button>
          <button className="icon-btn" title="Delete" onClick={() => { if (confirm("Delete this goal?")) onDelete(goal.id); }}>🗑</button>
        </div>
      </div>
      {goal.note ? <div className="note">{goal.note}</div> : null}
      {target > 0 && (
        <div className="counter">
          <button className="step" title="−1" onClick={() => setProgress(goal.id, progress - 1)}>−</button>
          <div className="count-mid">
            <div className="count-num">{progress} / {target}</div>
            <div className="count-bar"><i style={{ width: pct + "%", background: color }} /></div>
          </div>
          <button className="step" title="+1" onClick={() => setProgress(goal.id, progress + 1)}>+</button>
        </div>
      )}
      <div className="row">
        <span className="month">{MONTHS[goal.month]}</span>
        <span className={"badge " + goal.status}>{goal.status}</span>
      </div>
      <div className="status-pick">
        {STATUSES.map((s) => (
          <button key={s.id} data-s={s.id} title={s.label}
            className={goal.status === s.id ? "on" : ""}
            onClick={() => setStatus(goal.id, s.id)}>{s.icon}</button>
        ))}
      </div>
    </div>
  );
}

function TimelineView({ cats, visible }) {
  const rows = cats.filter((c) => visible.some((x) => x.category === c.id));
  const months = MONTHS.slice(1);
  if (rows.length === 0) return null;
  return (
    <div className="tl-wrap">
      <div className="tl-grid" style={{ gridTemplateColumns: "150px repeat(12, minmax(100px, 1fr))" }}>
        <div className="tl-corner" />
        {months.map((m) => <div key={m} className="tl-col-head">{m}</div>)}
        {rows.map((c) => (
          <React.Fragment key={c.id}>
            <div className="tl-row-head" style={{ borderLeftColor: c.color }}>
              <span className="swatch" style={{ background: c.color }} />
              <span>{c.name}</span>
            </div>
            {months.map((m, i) => {
              const month = i + 1;
              const items = visible.filter((x) => x.category === c.id && x.month === month);
              return (
                <div className="tl-cell" key={month}>
                  {items.map((x) => (
                    <span key={x.id} className={"tl-chip " + x.status} style={{ borderLeftColor: c.color }}
                      title={c.name + " · " + x.status}>{x.title}</span>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function GoalModal({ goal, cats, people, onSave, onCancel }) {
  const [form, setForm] = useState({ ...goal });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isNew = !goal.id;
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isNew ? "Add goal" : "Edit goal"}</h3>
        <div className="field">
          <label>Goal</label>
          <input autoFocus value={form.title} placeholder="e.g. 3 x Bubba Bushwalks"
            onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="field">
          <label>Person</label>
          <select value={form.person} onChange={(e) => set("person", e.target.value)}>
            {people.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Category</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)}>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ width: 90 }}>
            <label>Month</label>
            <select value={form.month} onChange={(e) => set("month", Number(e.target.value))}>
              {MONTHS.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="field" style={{ width: 84 }}>
            <label>Year</label>
            <input type="number" value={form.year} onChange={(e) => set("year", Number(e.target.value))} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Status</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="field" style={{ width: 130 }}>
            <label>Target count</label>
            <input type="number" min="0" value={form.target || 0}
              onChange={(e) => set("target", Math.max(0, Number(e.target.value)))} />
          </div>
        </div>
        <div className="field">
          <label>Note (optional)</label>
          <textarea value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Any detail or target…" />
        </div>
        <div className="modal-actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="primary" disabled={!form.title.trim()}
            onClick={() => onSave({ ...form, title: form.title.trim() })}>
            {isNew ? "Add" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WhoAmI({ value, onChange, name }) {
  return (
    <div className="whoami">
      <div className="whoami-head">
        <h2>Who am I?</h2>
        <p>{name}'s values, identity, and the person behind the goals. Saved automatically as you type.</p>
      </div>
      <textarea className="whoami-text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={"Write freely here…\n\n• My core values\n• What I stand for\n• My strengths & the person I'm becoming\n• What matters most to me\n• My purpose / mission"} />
    </div>
  );
}

function OperatingSystem({ content }) {
  if (!content) return <div className="empty"><div className="big">📘</div><div>Reference not loaded.</div></div>;
  return (
    <div className="os">
      <div className="os-hero">
        <h2>{content.title}</h2>
        <p>A reference for reviewing who you are, where you're headed, and how you operate. Every goal in this app should trace back to a line here.</p>
      </div>

      {content.layers.map((layer) => (
        <section className="os-layer" key={layer.title}>
          <div className="os-layer-head">
            <h3>{layer.title}</h3>
            <span className="os-cadence">{layer.cadence}</span>
          </div>
          {layer.sections.map((s) => (
            <div className="os-section" key={s.n}>
              <h4><span className="os-num">{s.n}</span>{s.title}</h4>
              <p className="os-why"><strong>Why it matters:</strong> {s.why}</p>
              <div className="os-q-label">Questions</div>
              <ul className="os-questions">
                {s.questions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
              <div className="os-record"><strong>Record:</strong> {s.record}</div>
            </div>
          ))}
        </section>
      ))}

      <section className="os-review">
        <h3>{content.review.title}</h3>
        <div className="os-table-wrap">
          <table className="os-table">
            <thead><tr><th>Cadence</th><th>Sections</th><th>Trigger question</th></tr></thead>
            <tbody>
              {content.review.rows.map((r) => (
                <tr key={r.cadence}>
                  <td className="os-cad">{r.cadence}</td>
                  <td>{r.sections}</td>
                  <td>{r.trigger}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="os-logic">
        <strong>The structural logic:</strong> {content.logic}
      </div>
    </div>
  );
}

// ---------- Auth gate (Google sign-in when Firebase is configured) ----------
function AuthGate() {
  const [ready, setReady] = useState(!USE_FB);
  const [user, setUser] = useState(USE_FB ? null : { local: true });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!USE_FB) return;
    return fbAuth.onAuthStateChanged((u) => { setUser(u); setReady(true); });
  }, []);

  const signIn = () => {
    setBusy(true); setErr("");
    const provider = new firebase.auth.GoogleAuthProvider();
    fbAuth.signInWithPopup(provider)
      .catch((e) => setErr(e.message || "Sign-in failed."))
      .finally(() => setBusy(false));
  };
  const signOut = () => fbAuth.signOut();

  if (!ready) return <div className="splash"><div className="big">🎯</div><div>Loading…</div></div>;

  if (USE_FB && !user) {
    return (
      <div className="gate">
        <div className="gate-box">
          <div className="gate-emoji">🎯</div>
          <h1>Goal Tracker</h1>
          <p>Sign in to view your goals.</p>
          <button className="gate-btn google" onClick={signIn} disabled={busy}>
            {busy ? "Signing in…" : "Sign in with Google"}
          </button>
          {err ? <div className="gate-err">{err}</div> : null}
        </div>
      </div>
    );
  }

  if (USE_FB && window.ALLOWED_EMAIL && user.email !== window.ALLOWED_EMAIL) {
    return (
      <div className="gate">
        <div className="gate-box">
          <div className="gate-emoji">🚫</div>
          <h1>Not authorised</h1>
          <p>{user.email} doesn’t have access to this tracker.</p>
          <button className="gate-btn" onClick={signOut}>Sign out</button>
        </div>
      </div>
    );
  }

  return <App user={user} onSignOut={signOut} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<AuthGate />);
