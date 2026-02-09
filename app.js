/* Training Tracker (Minimal PPL) — RP-style per-set weights
   - GitHub Pages friendly
   - localStorage memory
   - per-set weights: row.weights = ["40","42.5","42.5"]
   - conservative suggestions using last week's Top Set + Feeling + previous RPE
   - preserves in-progress edits on re-render
*/

const STORAGE_KEY = "training-tracker-v2-per-set-weights";

const PROGRAM = {
  "Push A": [
    { order: 1, exercise: "Pike Push-ups", type: "bodyweight", sets: 5, reps: 5, rpe: 7.5, min: 3, max: 6, inc: 0 },
    { order: 2, exercise: "Weighted Dips", type: "weighted", sets: 3, reps: 6, rpe: 7.0, min: 4, max: 8, inc: 2.5 },
    { order: 3, exercise: "90° Holds", type: "time", sets: 4, reps: 15, rpe: 7.5, min: 10, max: 20, inc: 0 },
    { order: 4, exercise: "Chest Press (Machine/DB)", type: "machine", sets: 4, reps: 10, rpe: 7.5, min: 8, max: 12, inc: 2.5 },
    { order: 5, exercise: "Lateral Raise", type: "machine", sets: 6, reps: 18, rpe: 7.5, min: 12, max: 25, inc: 1 },
    { order: 6, exercise: "Triceps Pushdown", type: "machine", sets: 4, reps: 15, rpe: 7.5, min: 10, max: 20, inc: 2.5 },
  ],
  "Pull A": [
    { order: 1, exercise: "Muscle-ups", type: "bodyweight", sets: 3, reps: 3, rpe: 6.5, min: 2, max: 4, inc: 0 },
    { order: 2, exercise: "Pull-ups", type: "bodyweight", sets: 4, reps: 8, rpe: 7.5, min: 6, max: 10, inc: 0 },
    { order: 3, exercise: "Seated Row", type: "machine", sets: 4, reps: 10, rpe: 7.5, min: 8, max: 12, inc: 2.5 },
    { order: 4, exercise: "Rear Delt Archer Pulls", type: "machine", sets: 4, reps: 16, rpe: 7.5, min: 12, max: 20, inc: 1 },
    { order: 5, exercise: "Leg Raises", type: "bodyweight", sets: 4, reps: 10, rpe: 7.0, min: 8, max: 15, inc: 0 },
  ],
  "Legs": [
    { order: 1, exercise: "Leg Press", type: "machine", sets: 3, reps: 8, rpe: 7.5, min: 6, max: 10, inc: 5 },
    { order: 2, exercise: "Leg Extension", type: "machine", sets: 4, reps: 12, rpe: 7.5, min: 10, max: 15, inc: 2.5 },
    { order: 3, exercise: "Romanian Deadlift (BB/DB)", type: "weighted", sets: 4, reps: 8, rpe: 7.5, min: 6, max: 10, inc: 2.5 },
    { order: 4, exercise: "Hamstring Curl", type: "machine", sets: 4, reps: 12, rpe: 7.5, min: 10, max: 15, inc: 2.5 },
    { order: 5, exercise: "Calf Raise (Standing/Seated)", type: "machine", sets: 5, reps: 12, rpe: 7.5, min: 8, max: 15, inc: 5 },
    { order: 6, exercise: "Hip Accessory (optional)", type: "machine", sets: 2, reps: 12, rpe: 6.5, min: 10, max: 15, inc: 2.5 },
    { order: 7, exercise: "Machine/Cable Crunch", type: "machine", sets: 4, reps: 12, rpe: 7.0, min: 10, max: 15, inc: 2.5 },
  ],
  "Push B": [
    { order: 1, exercise: "Pike Push-ups", type: "bodyweight", sets: 4, reps: 8, rpe: 6.5, min: 6, max: 10, inc: 0 },
    { order: 2, exercise: "Bodyweight Dips", type: "bodyweight", sets: 4, reps: 12, rpe: 7.0, min: 10, max: 15, inc: 0 },
    { order: 3, exercise: "Lateral Raise", type: "machine", sets: 6, reps: 20, rpe: 7.5, min: 15, max: 30, inc: 1 },
    { order: 4, exercise: "Machine Crunch", type: "machine", sets: 4, reps: 12, rpe: 7.0, min: 10, max: 15, inc: 2.5 },
  ],
  "Pull B": [
    { order: 1, exercise: "Weighted Pull-ups", type: "weighted", sets: 3, reps: 5, rpe: 7.5, min: 3, max: 6, inc: 2.5 },
    { order: 2, exercise: "Seated Row", type: "machine", sets: 4, reps: 8, rpe: 7.5, min: 6, max: 10, inc: 2.5 },
    { order: 3, exercise: "Rear Delt Fly", type: "machine", sets: 5, reps: 18, rpe: 7.5, min: 12, max: 25, inc: 1 },
    { order: 4, exercise: "Leg Raises", type: "bodyweight", sets: 4, reps: 10, rpe: 7.0, min: 8, max: 15, inc: 0 },
  ],
};

const FEELINGS = ["", "Sore", "OK", "Great", "Pain"];
const ENJOYED = ["", "Yes", "Meh", "No"];

// ---------------- State ----------------
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { weeks: {}, completedWeeks: [] };
  } catch {
    return { weeks: {}, completedWeeks: [] };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function isoMonday(d = new Date()) {
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = dt.getDay(); // 0 Sun
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const da = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function addDays(iso, days) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function roundToInc(value, inc) {
  const n = Number(value);
  const step = Number(inc);
  if (!isFinite(n) || !isFinite(step) || step <= 0) return n;
  return Math.round(n / step) * step;
}

function toNum(x) {
  const n = Number(x);
  return isFinite(n) ? n : null;
}

function topSetWeight(row) {
  if (!row || !Array.isArray(row.weights)) return null;
  const nums = row.weights.map(toNum).filter(v => v != null);
  if (!nums.length) return null;
  return Math.max(...nums);
}

// Backward compatibility: if older data had `weight`, convert to weights[]
function normalizeRow(row) {
  if (!row) return row;

  // Ensure weights exists
  if (!Array.isArray(row.weights)) row.weights = [];

  // Upgrade from single-weight schema if present
  if (row.weight !== undefined && row.weight !== "" && row.weights.length === 0) {
    const s = Math.max(1, Number(row.sets) || 1);
    const w = Number(row.weight);
    row.weights = Array.from({ length: s }, () => (isFinite(w) ? String(w) : ""));
    delete row.weight;
  } else if (row.weight !== undefined) {
    delete row.weight;
  }

  // Ensure array length matches sets (best-effort)
  const setsCount = Math.max(1, Number(row.sets) || 1);
  if (row.weights.length < setsCount) {
    row.weights = row.weights.concat(Array.from({ length: setsCount - row.weights.length }, () => ""));
  }
  if (row.weights.length > setsCount) {
    row.weights = row.weights.slice(0, setsCount);
  }

  return row;
}

function stepScore(feeling, prevRpe) {
  let s = 0;
  if (feeling === "Pain") s -= 2;
  else if (feeling === "Sore") s -= 1;
  else if (feeling === "Great") s += 1;

  if (prevRpe !== "" && prevRpe != null) {
    const r = Number(prevRpe);
    if (isFinite(r)) {
      if (r >= 9) s -= 1;
      else if (r <= 7) s += 1;
    }
  }
  return s;
}

function mentorCue(row) {
  if (row.enjoyed === "Yes") return "Keep. Good fit.";
  if (row.enjoyed === "No") return "Swap next week — consistency wins.";
  if (row.feeling === "Pain") return "Back off or substitute today.";
  if (row.exercise === "Muscle-ups" || row.exercise === "90° Holds") return "Quality work: stop before slowdown.";
  if (row.feeling === "Great") return "Green light: follow suggestion.";
  return "Stay smooth, leave 1–2 reps.";
}

function getPrevEntry(state, weekStart, session, exercise) {
  const prevWeek = addDays(weekStart, -7);
  const rows = state.weeks?.[prevWeek]?.[session] || [];
  return rows.find(r => r.exercise === exercise) || null;
}

function suggest(row, prev) {
  if (!prev) {
    return { display: "New: start conservative.", topWeight: "", reps: "" };
  }

  // Normalize prev too (in case old schema)
  prev = normalizeRow(prev);

  const s = stepScore(row.feeling, prev.rpe);
  const min = Number(row.min), max = Number(row.max);

  // Reps/Time suggestion
  let sugReps = prev.reps;
  const prevRepsNum = Number(prev.reps);
  if (isFinite(prevRepsNum) && isFinite(min) && isFinite(max)) {
    if (s > 0) sugReps = Math.min(max, prevRepsNum + 1);
    else if (s < 0) sugReps = Math.max(min, prevRepsNum - 1);
    else sugReps = prevRepsNum;
  }

  // Top set suggestion (weighted/machine)
  let sugTop = "";
  if (row.type === "weighted" || row.type === "machine") {
    const inc = Number(row.inc) || 2.5;
    const prevTop = topSetWeight(prev);
    if (prevTop != null) {
      sugTop = roundToInc(Math.max(0, prevTop + s * inc), inc);
    }
  }

  let display = "Conservative overload.";
  if (row.feeling === "Pain") display = "Back off today.";
  else if (row.type === "bodyweight" || row.type === "time") display = "Chase clean reps/time.";

  return { display, topWeight: sugTop, reps: sugReps };
}

// ---------------- UI helpers ----------------
function $(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}. Check index.html IDs.`);
  return el;
}

function makeSelect(options, value, className) {
  const sel = document.createElement("select");
  sel.className = className;
  options.forEach(optVal => {
    const opt = document.createElement("option");
    opt.value = optVal;
    opt.textContent = optVal === "" ? "—" : optVal;
    sel.appendChild(opt);
  });
  sel.value = value ?? "";
  return sel;
}

function makeInput(value, className, type = "text") {
  const inp = document.createElement("input");
  inp.type = type;
  inp.className = className;
  inp.value = value ?? "";
  return inp;
}

function programBase(session) {
  return (PROGRAM[session] || []).map(p => ({
    order: p.order,
    exercise: p.exercise,
    type: p.type,
    sets: p.sets,
    reps: p.reps,
    rpe: p.rpe,
    weights: Array.from({ length: Math.max(1, Number(p.sets) || 1) }, () => ""),
    feeling: "",
    enjoyed: "",
    notes: "",
    min: p.min,
    max: p.max,
    inc: p.inc
  }));
}

function keyFor(weekStart, session) {
  return `${weekStart}|${session}`;
}

// ---------------- Main render ----------------
let weekStartEl, sessionSelect, rowsEl;
let loadBtn, saveBtn, completeWeekBtn, exportBtn, importInput, resetBtn;

function fillSessions() {
  sessionSelect.innerHTML = "";
  Object.keys(PROGRAM).forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    sessionSelect.appendChild(opt);
  });
}

function render() {
  const state = loadState();
  const weekStart = weekStartEl.value;
  const session = sessionSelect.value;

  const k = keyFor(weekStart, session);

  let rows =
    (window.__currentKey === k && Array.isArray(window.__currentRows) && window.__currentRows.length)
      ? window.__currentRows
      : (state.weeks?.[weekStart]?.[session]?.length ? state.weeks[weekStart][session] : programBase(session));

  // Normalize rows (ensures weights[] exists and matches sets)
  rows = rows.map(r => normalizeRow(r));

  window.__currentKey = k;
  window.__currentRows = rows;

  rowsEl.innerHTML = "";

  rows.forEach((row) => {
    const prev = getPrevEntry(state, weekStart, session, row.exercise);
    const sug = suggest(row, prev);
    const cue = mentorCue(row);

    const tr = document.createElement("tr");

    const needsWeight = (row.type === "weighted" || row.type === "machine");
    const hasAnyWeight = topSetWeight(row) != null;

    const missingImportant =
      (needsWeight && !hasAnyWeight) ||
      (row.reps === "" || row.reps == null) ||
      (row.rpe === "" || row.rpe == null);

    if (row.feeling === "Pain") tr.classList.add("row-pain");
    else if (missingImportant) tr.classList.add("row-soft");

    // #
    let td = document.createElement("td");
    td.textContent = row.order;
    tr.appendChild(td);

    // Exercise
    td = document.createElement("td");
    td.textContent = row.exercise;
    tr.appendChild(td);

    // Type
    td = document.createElement("td");
    td.textContent = row.type;
    tr.appendChild(td);

    // Sets
    td = document.createElement("td");
    const setsInp = makeInput(row.sets, "cellInput cellSmall", "number");
    setsInp.min = "1";
    setsInp.addEventListener("input", () => {
      row.sets = setsInp.value;
      // normalize weights array length and re-render without losing state
      normalizeRow(row);
      render();
    });
    td.appendChild(setsInp);
    tr.appendChild(td);

    // Reps/Time
    td = document.createElement("td");
    const repsInp = makeInput(row.reps, "cellInput cellSmall", "number");
    repsInp.addEventListener("input", () => { row.reps = repsInp.value; });
    td.appendChild(repsInp);
    tr.appendChild(td);

    // RPE
    td = document.createElement("td");
    const rpeInp = makeInput(row.rpe, "cellInput cellSmall", "number");
    rpeInp.step = "0.5";
    rpeInp.min = "1";
    rpeInp.max = "10";
    rpeInp.addEventListener("input", () => { row.rpe = rpeInp.value; });
    td.appendChild(rpeInp);
    tr.appendChild(td);

    // Per-set weights cell
    td = document.createElement("td");
    const box = document.createElement("div");
    box.className = "setWeights";

    const setsCount = Math.max(1, Number(row.sets) || 1);
    row.weights = Array.isArray(row.weights) ? row.weights : [];
    if (row.weights.length < setsCount) {
      row.weights = row.weights.concat(Array.from({ length: setsCount - row.weights.length }, () => ""));
    }
    if (row.weights.length > setsCount) {
      row.weights = row.weights.slice(0, setsCount);
    }

    for (let si = 0; si < setsCount; si++) {
      const w = row.weights[si] ?? "";
      const wInp = makeInput(w, "cellInput cellSmall", "number");
      wInp.step = "0.5";
      wInp.placeholder = `S${si + 1}`;
      wInp.addEventListener("input", () => {
        row.weights[si] = wInp.value;
      });
      box.appendChild(wInp);
    }

    td.appendChild(box);
    tr.appendChild(td);

    // Feeling
    td = document.createElement("td");
    const feelSel = makeSelect(FEELINGS, row.feeling, "cellInput cellMid");
    feelSel.addEventListener("change", () => { row.feeling = feelSel.value; render(); });
    td.appendChild(feelSel);
    tr.appendChild(td);

    // Enjoyed
    td = document.createElement("td");
    const enjSel = makeSelect(ENJOYED, row.enjoyed, "cellInput cellSmall");
    enjSel.addEventListener("change", () => { row.enjoyed = enjSel.value; render(); });
    td.appendChild(enjSel);
    tr.appendChild(td);

    // Suggested
    td = document.createElement("td");
    const parts = [];
    if ((row.type === "weighted" || row.type === "machine") && sug.topWeight !== "" && sug.topWeight != null) {
      parts.push(`Top Wt: ${sug.topWeight}`);
    }
    if (sug.reps !== "" && sug.reps != null && isFinite(Number(sug.reps))) {
      parts.push(`Reps: ${sug.reps}`);
    }
    td.textContent = parts.length ? parts.join(" • ") : "—";
    tr.appendChild(td);

    // Mentor cue
    td = document.createElement("td");
    td.textContent = cue;
    tr.appendChild(td);

    // Notes
    td = document.createElement("td");
    const nInp = makeInput(row.notes, "cellInput cellWide", "text");
    nInp.addEventListener("input", () => { row.notes = nInp.value; });
    td.appendChild(nInp);
    tr.appendChild(td);

    rowsEl.appendChild(tr);
  });
}

function save() {
  const state = loadState();
  const weekStart = weekStartEl.value;
  const session = sessionSelect.value;

  state.weeks[weekStart] = state.weeks[weekStart] || {};
  // Normalize before saving
  const rows = (window.__currentRows || []).map(r => normalizeRow(r));
  state.weeks[weekStart][session] = rows;
  saveState(state);
}

function markWeekComplete() {
  const state = loadState();
  const weekStart = weekStartEl.value;
  if (!state.completedWeeks.includes(weekStart)) state.completedWeeks.push(weekStart);
  saveState(state);
  alert("Week marked complete.");
}

function exportJSON() {
  const state = loadState();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "training-tracker-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result);
      if (!obj.weeks) throw new Error("Invalid file (missing weeks).");
      // normalize imported
      for (const wk of Object.keys(obj.weeks)) {
        for (const sess of Object.keys(obj.weeks[wk] || {})) {
          obj.weeks[wk][sess] = (obj.weeks[wk][sess] || []).map(r => normalizeRow(r));
        }
      }
      saveState(obj);
      alert("Imported.");
      window.__currentKey = "";
      window.__currentRows = [];
      render();
    } catch (e) {
      alert("Import failed: " + e.message);
    }
  };
  reader.readAsText(file);
}

function resetData() {
  if (!confirm("Reset local data? This deletes localStorage for this tracker.")) return;
  localStorage.removeItem(STORAGE_KEY);
  window.__currentKey = "";
  window.__currentRows = [];
  render();
}

// If anything crashes, show it on the page instead of blank.
function showFatal(err) {
  document.body.innerHTML = `
    <main style="max-width:900px;margin:30px auto;padding:0 16px;font-family:Georgia,serif;">
      <h1 style="color:#9b2c2c;">Tracker crashed</h1>
      <p style="color:#617083;">Usually a JavaScript error or missing file reference.</p>
      <pre style="white-space:pre-wrap;background:#fff;border:1px solid #e6ebf1;padding:14px;border-radius:12px;">${String(err.stack || err)}</pre>
      <p style="color:#617083;">Checks:</p>
      <ul style="color:#617083;">
        <li>File names exactly: <code>index.html</code>, <code>styles.css</code>, <code>app.js</code></li>
        <li><code>index.html</code> includes: <code>&lt;script src="./app.js" defer&gt;&lt;/script&gt;</code></li>
        <li>Hard refresh (Ctrl+Shift+R)</li>
      </ul>
    </main>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    weekStartEl = $("weekStart");
    sessionSelect = $("sessionSelect");
    rowsEl = $("rows");

    loadBtn = document.getElementById("loadTemplate");
    saveBtn = document.getElementById("saveBtn");
    completeWeekBtn = document.getElementById("completeWeekBtn");
    exportBtn = document.getElementById("exportBtn");
    importInput = document.getElementById("importInput");
    resetBtn = document.getElementById("resetBtn");

    fillSessions();

    weekStartEl.value = isoMonday();
    sessionSelect.value = "Push A";

    if (loadBtn) loadBtn.addEventListener("click", render);
    if (saveBtn) saveBtn.addEventListener("click", () => { save(); alert("Saved."); });
    if (completeWeekBtn) completeWeekBtn.addEventListener("click", () => { save(); markWeekComplete(); });
    if (exportBtn) exportBtn.addEventListener("click", exportJSON);
    if (importInput) importInput.addEventListener("change", (e) => { if (e.target.files?.[0]) importJSON(e.target.files[0]); });
    if (resetBtn) resetBtn.addEventListener("click", resetData);

    sessionSelect.addEventListener("change", render);
    weekStartEl.addEventListener("change", render);

    render();
  } catch (err) {
    showFatal(err);
  }
});
