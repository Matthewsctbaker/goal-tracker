const {
  useState,
  useEffect,
  useMemo,
  useRef
} = React;
const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUSES = [{
  id: "done",
  label: "Done",
  icon: "✓"
}, {
  id: "active",
  label: "Active",
  icon: "◐"
}, {
  id: "planned",
  label: "Planned",
  icon: "○"
}, {
  id: "missed",
  label: "Missed",
  icon: "✕"
}];
const STORE_KEY = "goals-app-v1";

// ---------- Firebase (optional — active only when configured) ----------
const CFG = typeof window !== "undefined" && window.FIREBASE_CONFIG || null;
const USE_FB = !!(CFG && typeof firebase !== "undefined");
let fbAuth = null,
  fbDb = null;
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
      return {
        goals: Array.isArray(s.goals) ? s.goals : window.SEED_GOALS.slice(),
        whoami: s.whoami || {}
      };
    }
  } catch (e) {/* ignore */}
  return {
    goals: window.SEED_GOALS.slice(),
    whoami: {}
  };
}
function saveLocalDoc(data) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      goals: data.goals,
      whoami: data.whoami,
      seedVersion: window.SEED_VERSION
    }));
  } catch (e) {/* ignore */}
}

// ---------- store: Firestore when signed in, else localStorage ----------
function useCloudDoc(user) {
  const [data, setData] = useState(() => USE_FB ? {
    goals: [],
    whoami: {}
  } : loadLocalDoc());
  const [sync, setSync] = useState(USE_FB ? "loading" : "local"); // loading|synced|saving|offline|local
  const skipWrite = useRef(false);
  const ready = useRef(false);

  // subscribe to the cloud document
  useEffect(() => {
    if (!USE_FB || !user) return;
    ready.current = false;
    setSync("loading");
    const unsub = goalsDoc().onSnapshot(snap => {
      if (snap.exists) {
        const d = snap.data();
        skipWrite.current = true;
        setData({
          goals: d.goals || [],
          whoami: d.whoami || {}
        });
        ready.current = true;
        setSync("synced");
      } else {
        goalsDoc().set({
          goals: loadLocalDoc().goals,
          whoami: {},
          updatedAt: Date.now()
        });
      }
    }, () => setSync("offline"));
    return unsub;
  }, [user]);

  // write local changes back to the cloud (debounced), and always cache locally
  useEffect(() => {
    saveLocalDoc(data);
    if (!USE_FB || !user) return;
    if (skipWrite.current) {
      skipWrite.current = false;
      return;
    }
    if (!ready.current) return;
    setSync("saving");
    const t = setTimeout(() => {
      goalsDoc().set({
        goals: data.goals,
        whoami: data.whoami,
        updatedAt: Date.now()
      }).then(() => setSync("synced")).catch(() => setSync("offline"));
    }, 400);
    return () => clearTimeout(t);
  }, [data, user]);
  return [data, setData, sync];
}
const horizonOf = g => g.horizon || "12m";
function App({
  user,
  onSignOut
}) {
  const cats = window.SEED_CATEGORIES;
  const people = window.SEED_PEOPLE;
  const [data, setData, sync] = useCloudDoc(user);
  const goals = data.goals;
  function setGoals(updater) {
    setData(d => ({
      ...d,
      goals: typeof updater === "function" ? updater(d.goals) : updater
    }));
  }
  const [person, setPerson] = useState("matthew");
  const [section, setSection] = useState("12m"); // 12m | 5y | whoami (Matthew only)
  const [catFilter, setCatFilter] = useState("all");
  const [view, setView] = useState("board");
  const [editing, setEditing] = useState(null);

  // Sub-tabs are Matthew-only; force the goals view for anyone else.
  useEffect(() => {
    if (person !== "matthew" && section !== "12m") setSection("12m");
  }, [person]);
  const goalSection = section === "5y" ? "5y" : "12m";
  const years = useMemo(() => {
    const s = new Set(goals.filter(x => horizonOf(x) === goalSection).map(x => x.year || window.SEED_YEAR));
    if (!s.size) s.add(window.SEED_YEAR);
    return Array.from(s).sort((a, b) => a - b);
  }, [goals, goalSection]);
  const [year, setYear] = useState(() => Math.max.apply(null, years));
  useEffect(() => {
    if (!years.includes(year)) setYear(Math.max.apply(null, years));
  }, [years]); // keep selected year valid as data / section loads

  const mine = useMemo(() => goals.filter(x => x.person === person && horizonOf(x) === goalSection && (x.year || window.SEED_YEAR) === year), [goals, person, year, goalSection]);
  const presentCats = useMemo(() => cats.filter(c => mine.some(x => x.category === c.id)), [cats, mine]);
  useEffect(() => {
    setCatFilter("all");
  }, [person, year]);
  const visible = useMemo(() => catFilter === "all" ? mine : mine.filter(x => x.category === catFilter), [mine, catFilter]);
  const counts = useMemo(() => {
    const c = {
      done: 0,
      missed: 0,
      planned: 0,
      active: 0,
      total: mine.length
    };
    mine.forEach(x => {
      c[x.status] = (c[x.status] || 0) + 1;
    });
    return c;
  }, [mine]);
  const pctDone = counts.total ? Math.round(counts.done / counts.total * 100) : 0;
  function setStatus(id, status) {
    setGoals(gs => gs.map(x => {
      if (x.id !== id) return x;
      let progress = x.progress || 0;
      if (x.target > 0) {
        if (status === "done") progress = x.target;else if (status === "planned") progress = 0;
      }
      return {
        ...x,
        status,
        progress
      };
    }));
  }
  function setProgress(id, next) {
    setGoals(gs => gs.map(x => {
      if (x.id !== id) return x;
      const target = x.target || 0;
      const progress = Math.max(0, Math.min(target, next));
      let status = x.status;
      if (target > 0) {
        if (progress >= target) status = "done";else if (progress > 0) status = "active";else if (status === "done" || status === "active") status = "planned";
      }
      return {
        ...x,
        progress,
        status
      };
    }));
  }
  function removeGoal(id) {
    setGoals(gs => gs.filter(x => x.id !== id));
  }
  function saveGoal(data) {
    const target = data.target || 0;
    const clean = {
      ...data,
      target,
      progress: target > 0 ? Math.max(0, Math.min(target, data.progress || 0)) : 0
    };
    if (clean.id) setGoals(gs => gs.map(x => x.id === clean.id ? {
      ...x,
      ...clean
    } : x));else setGoals(gs => [...gs, {
      ...clean,
      id: "g-" + Date.now() + "-" + Math.floor(Math.random() * 1e4)
    }]);
    setEditing(null);
  }
  const catById = id => cats.find(c => c.id === id);
  const personCount = pid => goals.filter(x => x.person === pid && horizonOf(x) === "12m" && (x.year || window.SEED_YEAR) === year).length;
  const whoamiText = data.whoami && data.whoami[person] || "";
  const setWhoami = text => setData(d => ({
    ...d,
    whoami: {
      ...(d.whoami || {}),
      [person]: text
    }
  }));
  const SUBTABS = [{
    id: "12m",
    label: "Twelve Month Goals"
  }, {
    id: "5y",
    label: "Five Year Goals"
  }, {
    id: "whoami",
    label: "Who am I?"
  }];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("header", {
    className: "app-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "head-row"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "app-title"
  }, "\uD83C\uDFAF ", /*#__PURE__*/React.createElement("span", {
    className: "accent"
  }, "Goal Tracker")), /*#__PURE__*/React.createElement("div", {
    className: "people"
  }, people.map(p => /*#__PURE__*/React.createElement("button", {
    key: p.id,
    className: "person-tab" + (person === p.id ? " active" : ""),
    "data-p": p.id,
    onClick: () => setPerson(p.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "emoji"
  }, p.emoji), p.name, /*#__PURE__*/React.createElement("span", {
    className: "count"
  }, personCount(p.id))))), /*#__PURE__*/React.createElement("span", {
    className: "spacer"
  }), section !== "whoami" && /*#__PURE__*/React.createElement("div", {
    className: "seg year-seg"
  }, years.map(y => /*#__PURE__*/React.createElement("button", {
    key: y,
    className: year === y ? "active" : "",
    onClick: () => setYear(y)
  }, y)))), /*#__PURE__*/React.createElement("div", {
    className: "sub-row"
  }, /*#__PURE__*/React.createElement("p", {
    className: "app-sub"
  }, "Track your goals and Violette's \u2014 from your Year Plans."), /*#__PURE__*/React.createElement(SyncBadge, {
    sync: sync,
    user: user,
    onSignOut: onSignOut
  }))), person === "matthew" && /*#__PURE__*/React.createElement("div", {
    className: "subtabs"
  }, SUBTABS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    className: "subtab" + (section === t.id ? " active" : ""),
    onClick: () => setSection(t.id)
  }, t.label))), section === "whoami" ? /*#__PURE__*/React.createElement(WhoAmI, {
    value: whoamiText,
    onChange: setWhoami,
    name: people.find(p => p.id === person).name
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "summary"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "Completion"), /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, pctDone, "%"), /*#__PURE__*/React.createElement("div", {
    className: "bar"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: pctDone + "%",
      background: "var(--done)"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "Done"), /*#__PURE__*/React.createElement("div", {
    className: "v",
    style: {
      color: "var(--done)"
    }
  }, counts.done)), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "Missed"), /*#__PURE__*/React.createElement("div", {
    className: "v",
    style: {
      color: "var(--missed)"
    }
  }, counts.missed)), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "Open"), /*#__PURE__*/React.createElement("div", {
    className: "v",
    style: {
      color: "var(--active)"
    }
  }, counts.active + counts.planned))), /*#__PURE__*/React.createElement("div", {
    className: "toolbar"
  }, /*#__PURE__*/React.createElement("button", {
    className: "chip" + (catFilter === "all" ? " active" : ""),
    onClick: () => setCatFilter("all")
  }, "All"), presentCats.map(c => /*#__PURE__*/React.createElement("button", {
    key: c.id,
    className: "chip" + (catFilter === c.id ? " active" : ""),
    onClick: () => setCatFilter(c.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot",
    style: {
      background: c.color
    }
  }), c.name)), /*#__PURE__*/React.createElement("span", {
    className: "spacer"
  }), /*#__PURE__*/React.createElement("div", {
    className: "seg"
  }, /*#__PURE__*/React.createElement("button", {
    className: view === "board" ? "active" : "",
    onClick: () => setView("board")
  }, "Board"), /*#__PURE__*/React.createElement("button", {
    className: view === "timeline" ? "active" : "",
    onClick: () => setView("timeline")
  }, "Timeline")), /*#__PURE__*/React.createElement("button", {
    className: "btn-add",
    onClick: () => setEditing({
      person,
      category: catFilter === "all" ? "personal" : catFilter,
      month: 1,
      status: "planned",
      title: "",
      note: "",
      year,
      target: 0,
      progress: 0,
      horizon: goalSection
    })
  }, "+ Add goal")), sync === "loading" ? /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, /*#__PURE__*/React.createElement("div", {
    className: "big"
  }, "\u2601\uFE0F"), /*#__PURE__*/React.createElement("div", null, "Loading your goals\u2026")) : visible.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, /*#__PURE__*/React.createElement("div", {
    className: "big"
  }, "\uD83C\uDF31"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "No goals yet")), /*#__PURE__*/React.createElement("div", null, "Add your first ", section === "5y" ? "five-year" : "", " goal to get started.")) : view === "board" ? /*#__PURE__*/React.createElement(BoardView, {
    cats: cats,
    catFilter: catFilter,
    visible: visible,
    setStatus: setStatus,
    setProgress: setProgress,
    onEdit: setEditing,
    onDelete: removeGoal
  }) : /*#__PURE__*/React.createElement(TimelineView, {
    cats: cats,
    visible: visible,
    catById: catById
  })), editing && /*#__PURE__*/React.createElement(GoalModal, {
    goal: editing,
    cats: cats,
    people: people,
    onSave: saveGoal,
    onCancel: () => setEditing(null)
  }), /*#__PURE__*/React.createElement("p", {
    className: "footnote"
  }, USE_FB ? "Synced to your private cloud — open it on any device signed in as you." : "Saved in this browser.", " Tap the status buttons to update a goal, or use the \u2212 / + steppers on goals that track a count."));
}
function SyncBadge({
  sync,
  user,
  onSignOut
}) {
  const map = {
    synced: {
      t: "Synced",
      c: "var(--done)"
    },
    saving: {
      t: "Saving…",
      c: "var(--active)"
    },
    loading: {
      t: "Loading…",
      c: "var(--muted)"
    },
    offline: {
      t: "Offline",
      c: "var(--missed)"
    },
    local: {
      t: "Local only",
      c: "var(--muted)"
    }
  };
  const s = map[sync] || map.local;
  return /*#__PURE__*/React.createElement("div", {
    className: "sync"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sync-dot",
    style: {
      background: s.c
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "sync-t"
  }, s.t), user && !user.local ? /*#__PURE__*/React.createElement("button", {
    className: "signout",
    title: user.email,
    onClick: onSignOut
  }, "Sign out") : null);
}
function BoardView({
  cats,
  catFilter,
  visible,
  setStatus,
  setProgress,
  onEdit,
  onDelete
}) {
  const shown = catFilter === "all" ? cats : cats.filter(c => c.id === catFilter);
  return /*#__PURE__*/React.createElement("div", null, shown.map(c => {
    const items = visible.filter(x => x.category === c.id).sort((a, b) => a.month - b.month);
    if (items.length === 0) return null;
    const done = items.filter(x => x.status === "done").length;
    return /*#__PURE__*/React.createElement("section", {
      className: "cat-group",
      key: c.id
    }, /*#__PURE__*/React.createElement("div", {
      className: "cat-head"
    }, /*#__PURE__*/React.createElement("span", {
      className: "swatch",
      style: {
        background: c.color
      }
    }), /*#__PURE__*/React.createElement("h2", null, c.name), /*#__PURE__*/React.createElement("span", {
      className: "frac"
    }, done, "/", items.length)), /*#__PURE__*/React.createElement("div", {
      className: "goal-grid"
    }, items.map(goal => /*#__PURE__*/React.createElement(GoalCard, {
      key: goal.id,
      goal: goal,
      color: c.color,
      setStatus: setStatus,
      setProgress: setProgress,
      onEdit: onEdit,
      onDelete: onDelete
    }))));
  }));
}
function GoalCard({
  goal,
  color,
  setStatus,
  setProgress,
  onEdit,
  onDelete
}) {
  const target = goal.target || 0;
  const progress = goal.progress || 0;
  const pct = target > 0 ? Math.round(progress / target * 100) : 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "goal " + goal.status,
    style: {
      borderLeftColor: color
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "title"
  }, goal.title), /*#__PURE__*/React.createElement("div", {
    className: "actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "Edit",
    onClick: () => onEdit(goal)
  }, "\u270E"), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "Delete",
    onClick: () => {
      if (confirm("Delete this goal?")) onDelete(goal.id);
    }
  }, "\uD83D\uDDD1"))), goal.note ? /*#__PURE__*/React.createElement("div", {
    className: "note"
  }, goal.note) : null, target > 0 && /*#__PURE__*/React.createElement("div", {
    className: "counter"
  }, /*#__PURE__*/React.createElement("button", {
    className: "step",
    title: "\u22121",
    onClick: () => setProgress(goal.id, progress - 1)
  }, "\u2212"), /*#__PURE__*/React.createElement("div", {
    className: "count-mid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "count-num"
  }, progress, " / ", target), /*#__PURE__*/React.createElement("div", {
    className: "count-bar"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: pct + "%",
      background: color
    }
  }))), /*#__PURE__*/React.createElement("button", {
    className: "step",
    title: "+1",
    onClick: () => setProgress(goal.id, progress + 1)
  }, "+")), /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "month"
  }, MONTHS[goal.month]), /*#__PURE__*/React.createElement("span", {
    className: "badge " + goal.status
  }, goal.status)), /*#__PURE__*/React.createElement("div", {
    className: "status-pick"
  }, STATUSES.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.id,
    "data-s": s.id,
    title: s.label,
    className: goal.status === s.id ? "on" : "",
    onClick: () => setStatus(goal.id, s.id)
  }, s.icon))));
}
function TimelineView({
  cats,
  visible
}) {
  const rows = cats.filter(c => visible.some(x => x.category === c.id));
  const months = MONTHS.slice(1);
  if (rows.length === 0) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "tl-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tl-grid",
    style: {
      gridTemplateColumns: "150px repeat(12, minmax(100px, 1fr))"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tl-corner"
  }), months.map(m => /*#__PURE__*/React.createElement("div", {
    key: m,
    className: "tl-col-head"
  }, m)), rows.map(c => /*#__PURE__*/React.createElement(React.Fragment, {
    key: c.id
  }, /*#__PURE__*/React.createElement("div", {
    className: "tl-row-head",
    style: {
      borderLeftColor: c.color
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "swatch",
    style: {
      background: c.color
    }
  }), /*#__PURE__*/React.createElement("span", null, c.name)), months.map((m, i) => {
    const month = i + 1;
    const items = visible.filter(x => x.category === c.id && x.month === month);
    return /*#__PURE__*/React.createElement("div", {
      className: "tl-cell",
      key: month
    }, items.map(x => /*#__PURE__*/React.createElement("span", {
      key: x.id,
      className: "tl-chip " + x.status,
      style: {
        borderLeftColor: c.color
      },
      title: c.name + " · " + x.status
    }, x.title)));
  })))));
}
function GoalModal({
  goal,
  cats,
  people,
  onSave,
  onCancel
}) {
  const [form, setForm] = useState({
    ...goal
  });
  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const isNew = !goal.id;
  return /*#__PURE__*/React.createElement("div", {
    className: "overlay",
    onClick: onCancel
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("h3", null, isNew ? "Add goal" : "Edit goal"), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Goal"), /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    value: form.title,
    placeholder: "e.g. 3 x Bubba Bushwalks",
    onChange: e => set("title", e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Person"), /*#__PURE__*/React.createElement("select", {
    value: form.person,
    onChange: e => set("person", e.target.value)
  }, people.map(p => /*#__PURE__*/React.createElement("option", {
    key: p.id,
    value: p.id
  }, p.emoji, " ", p.name)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "field",
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("label", null, "Category"), /*#__PURE__*/React.createElement("select", {
    value: form.category,
    onChange: e => set("category", e.target.value)
  }, cats.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.name)))), /*#__PURE__*/React.createElement("div", {
    className: "field",
    style: {
      width: 90
    }
  }, /*#__PURE__*/React.createElement("label", null, "Month"), /*#__PURE__*/React.createElement("select", {
    value: form.month,
    onChange: e => set("month", Number(e.target.value))
  }, MONTHS.slice(1).map((m, i) => /*#__PURE__*/React.createElement("option", {
    key: m,
    value: i + 1
  }, m)))), /*#__PURE__*/React.createElement("div", {
    className: "field",
    style: {
      width: 84
    }
  }, /*#__PURE__*/React.createElement("label", null, "Year"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: form.year,
    onChange: e => set("year", Number(e.target.value))
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "field",
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("label", null, "Status"), /*#__PURE__*/React.createElement("select", {
    value: form.status,
    onChange: e => set("status", e.target.value)
  }, STATUSES.map(s => /*#__PURE__*/React.createElement("option", {
    key: s.id,
    value: s.id
  }, s.label)))), /*#__PURE__*/React.createElement("div", {
    className: "field",
    style: {
      width: 130
    }
  }, /*#__PURE__*/React.createElement("label", null, "Target count"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    value: form.target || 0,
    onChange: e => set("target", Math.max(0, Number(e.target.value)))
  }))), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Note (optional)"), /*#__PURE__*/React.createElement("textarea", {
    value: form.note,
    onChange: e => set("note", e.target.value),
    placeholder: "Any detail or target\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    className: "modal-actions"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onCancel
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    className: "primary",
    disabled: !form.title.trim(),
    onClick: () => onSave({
      ...form,
      title: form.title.trim()
    })
  }, isNew ? "Add" : "Save"))));
}
function WhoAmI({
  value,
  onChange,
  name
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "whoami"
  }, /*#__PURE__*/React.createElement("div", {
    className: "whoami-head"
  }, /*#__PURE__*/React.createElement("h2", null, "Who am I?"), /*#__PURE__*/React.createElement("p", null, name, "'s values, identity, and the person behind the goals. Saved automatically as you type.")), /*#__PURE__*/React.createElement("textarea", {
    className: "whoami-text",
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: "Write freely here…\n\n• My core values\n• What I stand for\n• My strengths & the person I'm becoming\n• What matters most to me\n• My purpose / mission"
  }));
}

// ---------- Auth gate (Google sign-in when Firebase is configured) ----------
function AuthGate() {
  const [ready, setReady] = useState(!USE_FB);
  const [user, setUser] = useState(USE_FB ? null : {
    local: true
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!USE_FB) return;
    return fbAuth.onAuthStateChanged(u => {
      setUser(u);
      setReady(true);
    });
  }, []);
  const signIn = () => {
    setBusy(true);
    setErr("");
    const provider = new firebase.auth.GoogleAuthProvider();
    fbAuth.signInWithPopup(provider).catch(e => setErr(e.message || "Sign-in failed.")).finally(() => setBusy(false));
  };
  const signOut = () => fbAuth.signOut();
  if (!ready) return /*#__PURE__*/React.createElement("div", {
    className: "splash"
  }, /*#__PURE__*/React.createElement("div", {
    className: "big"
  }, "\uD83C\uDFAF"), /*#__PURE__*/React.createElement("div", null, "Loading\u2026"));
  if (USE_FB && !user) {
    return /*#__PURE__*/React.createElement("div", {
      className: "gate"
    }, /*#__PURE__*/React.createElement("div", {
      className: "gate-box"
    }, /*#__PURE__*/React.createElement("div", {
      className: "gate-emoji"
    }, "\uD83C\uDFAF"), /*#__PURE__*/React.createElement("h1", null, "Goal Tracker"), /*#__PURE__*/React.createElement("p", null, "Sign in to view your goals."), /*#__PURE__*/React.createElement("button", {
      className: "gate-btn google",
      onClick: signIn,
      disabled: busy
    }, busy ? "Signing in…" : "Sign in with Google"), err ? /*#__PURE__*/React.createElement("div", {
      className: "gate-err"
    }, err) : null));
  }
  if (USE_FB && window.ALLOWED_EMAIL && user.email !== window.ALLOWED_EMAIL) {
    return /*#__PURE__*/React.createElement("div", {
      className: "gate"
    }, /*#__PURE__*/React.createElement("div", {
      className: "gate-box"
    }, /*#__PURE__*/React.createElement("div", {
      className: "gate-emoji"
    }, "\uD83D\uDEAB"), /*#__PURE__*/React.createElement("h1", null, "Not authorised"), /*#__PURE__*/React.createElement("p", null, user.email, " doesn\u2019t have access to this tracker."), /*#__PURE__*/React.createElement("button", {
      className: "gate-btn",
      onClick: signOut
    }, "Sign out")));
  }
  return /*#__PURE__*/React.createElement(App, {
    user: user,
    onSignOut: signOut
  });
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(AuthGate, null));