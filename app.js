/* Training Tracker (Minimal PPL) — RP-style per-set weights + per-set RPE
   - localStorage
   - per-set weights: row.weights = ["40","42.5","42.5"]
   - per-set rpe:     row.rpes    = ["7","8","8"]
   - Suggestions use last week's TOP SET weight + TOP SET RPE + today's Feeling
   - Preserves in-progress edits on re-render
*/

const STORAGE_KEY = "training-tracker-v3-per-set-weights-rpe";

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
  const day = dt.getDay();
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

// Find top-set index by max weight (first max if tie)
function topSetIndex(row) {
  if (!row || !Array.isArray(row.weights)) return null;
  const nums = row.weights.map(toNum);
  const valid = nums.map((v, i) => ({ v, i })).filter(o => o.v != null);
  if (!valid.length) return null;
  let best = valid[0];
  for (const o of valid) if (o.v > best.v) best = o;
  return best.i;
}
function topSetWeight(row) {
  const i = topSetIndex(row);
  if (i == null) return null;
  return toNum(row.weights[i]);
}
function topSetRpe(row) {
  const i = topSetIndex(row);
  if (i == null) return null;
  if (!Array.isArray(row.rpes)) return null;
  return toNum(row.rpes[i]);
}

// Backward compatibility + ensure arrays match set count
function normalizeRow(row) {
  if (!row) return row;

  const setsCount = Math.max(1, Number(row.sets) || 1);

  // weights
  if (!Array.isArray(row.weights)) row.weights = [];
  if (row.weight !== undefined && row.weight !== "" && row.weights.length === 0) {
    const w = Number(row.weight);
    row.weights = Array.from({ length: setsCount }, () => (isFinite(w) ? String(w) : ""));
    delete row.weight;
  } else if (row.weight !== undefined) {
    delete row.weight;
  }
  if (row.weights.length < setsCount) row.weights = row.weights.concat(Array.from({ length: setsCount - row.weights.length }, () => ""));
  if (row.weights.length > setsCount) row.weights = row.weights.slice(0, setsCount);

  // rpes
  if (!Array.isArray(row.rpes)) row.rpes = [];
  if (row.rpe !== undefined && row.rpe !== "" && row.rpes.length === 0) {
    const r = Number(row.rpe);
    row.rpes = Array.from({ length: setsCount }, () => (isFinite(r) ? String(r) : ""));
    delete row.rpe;
  } else if (row.rpe !== undefined) {
    delete row.rpe;
  }
  if (row.rpes.length < setsCount) row.rpes = row.rpes.concat(Array.from({ length: setsCount - row.rpes.length }, () => ""));
  if (row.rpes.length > setsCount) row.rpes = row.rpes.slice(0, setsCount);

  return row;
}

function stepScore(feeling, prevTopRpe) {
  let s = 0;
  if (feeling === "Pain") s -= 2;
  else if (feeling === "Sore") s -= 1;
  else if (feeling === "Great") s += 1;

  // Use last week's TOP SET RPE
  if (prevTopRpe != null) {
    const r = Number(prevTopRpe);
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
  if (!prev) return { topWeight: "", reps: "" };

  prev = normalizeRow(prev);

  const prevTopR = topSetRpe(prev);      // top set RPE
  const prevTopW = topSetWeight(prev);   // top set weight
  const s = stepScore(row.feeling, prevTopR);

  // Reps/Time suggestion
  const min = Number(row.min), max = Number(row.max);
  let sugReps = prev.reps;
  const prevRepsNum = Number(prev.reps);
  if (isFinite(prevRepsNum) && isFinite(min) && isFinite(max)) {
    if (s > 0) sugReps = Math.min(max, prevRepsNum + 1);
    else if (s < 0) sugReps = Math.max(min, prevRepsNum - 1);
    else sugReps = prevRepsNum;
  }

  // Top set weight suggestion for weighted/machine
  let sugTop = "";
  if ((row.type === "weighted" || row.type === "machine") && prevTopW != null) {
    const inc = Number(row.inc) || 2.5;
    sugTop = roundToInc(Math.max(0, prevTopW + s * inc), inc);
  }

  return { topWeight: sugTop, reps: sugReps };
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
  return (PROGRAM[session] || []).map(p => {
    const setsCount = Math.max(1, Number(p.sets) || 1);
    return {
      order: p.order,
      exercise: p.exercise,
      type: p.type,
      sets: p.sets,
      reps: p.reps,
      weights: Array.from({ length: setsCount }, () => ""),
      rpes: Array.from({ length: setsCount }, () => String(p.rpe ?? "")),
      feeling: "",
      enjoyed: "",
      notes: "",
      min: p.min,
      max: p.max,
      inc: p.inc
    };
  });
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

  rows = rows.map(r => normalizeRow(r));
  window.__currentKey = k;
  window.__currentRows = rows;

  rowsEl.innerHTML = "";

  rows.forEach((row) => {
    const prev = getPrevEntry(state, weekStart, session, row.exercise);
    const sug = suggest(row, prev);
    const cue = mentorCue(row);

    const tr = document.createElement("tr");

    const setsCount = Math.max(1, Number(row.sets) || 1);

    const needsWeight = (row.type === "weighted" || row.type === "machine");
    const hasAnyWeight = topSetWeight(row) != null;

    const allRpeFilled = Array.isArray(row.rpes) && row.rpes.length === setsCount && row.rpes.every(v => v !== "" && v != null);

    const missingImportant =
      (needsWeight && !hasAnyWeight) ||
      (row.reps === "" || row.reps == null) ||
      (!allRpeFilled);

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

    // RPE per set
    td = document.createElement("td");
    const rpeBox = document.createElement("div");
    rpeBox.className = "setRpes";

    // ensure length
    row.rpes = Array.isArray(row.rpes) ? row.rpes : [];
    if (row.rpes.length < setsCount) row.rpes = row.rpes.concat(Array.from({ length: setsCount - row.rpes.length }, () => ""));
    if (row.rpes.length > setsCount) row.rpes = row.rpes.slice(0, setsCount);

    for (let si = 0; si < setsCount; si++) {
      const r = row.rpes[si] ?? "";
      const rInp = makeInput(r, "cellInput cellSmall", "number");
      rInp.step = "0.5";
      rInp.min = "1";
      rInp.max = "10";
      rInp.placeholder = `R${si + 1}`;
      rInp.addEventListener("input", () => {
        row.rpes[si] = rInp.value;
      });
      rpeBox.appendChild(rInp);
    }

    td.appendChild(rpeBox);
    tr.appendChild(td);

    // Weights per set
    td = document.createElement("td");
    const wBox = document.createElement("div");
    wBox.className = "setWeights";

    row.weights = Array.isArray(row.weights) ? row.weights : [];
    if (row.weights.length < setsCount) row.weights = row.weights.concat(Array.from({ length: setsCount - row.weights.length }, () => ""));
    if (row.weights.length > setsCount) row.weights = row.weights.slice(0, setsCount);

    for (let si = 0; si < setsCount; si++) {
      const w = row.weights[si] ?? "";
      const wInp = makeInput(w, "cellInput cellSmall", "number");
      wInp.step = "0.5";
      wInp.placeholder = `S${si + 1}`;
      wInp.addEventListener("input", () => {
        row.weights[si] = wInp.value;
      });
      wBox.appendChild(wInp);
    }

    td.appendChild(wBox);
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

function showFatal(err) {
  document.body.innerHTML = `
    <main style="max-width:900px;margin:30px auto;padding:0 16px;font-family:Georgia,serif;">
      <h1 style="color:#9b2c2c;">Tracker crashed</h1>
      <pre style="white-space:pre-wrap;background:#fff;border:1px solid #e6ebf1;padding:14px;border-radius:12px;">${String(err.stack || err)}</pre>
      <p style="color:#617083;">Check: <code>&lt;script src="./app.js" defer&gt;&lt;/script&gt;</code></p>
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
