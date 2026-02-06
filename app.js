// Minimal PPL tracker (localStorage). No backend. Conservative suggestions.
// Data model: weeks[weekStartISO][sessionName] = array of row objects.

const STORAGE_KEY = "training-tracker-v1";

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
function currentKey() {
  return `${weekStartEl.value}|${sessionSelect.value}`;
}

function isoMonday(d = new Date()){
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dt.getUTCDay(); // 0 Sun
  const diff = (day === 0 ? -6 : 1 - day);
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0,10);
}

function addDays(iso, days){
  const d = new Date(iso+"T00:00:00Z");
  d.setUTCDate(d.getUTCDate()+days);
  return d.toISOString().slice(0,10);
}

function loadState(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { weeks:{}, completedWeeks:[] }; }
  catch { return { weeks:{}, completedWeeks:[] }; }
}
function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function roundToInc(value, inc){
  if (!inc || inc <= 0) return value;
  return Math.round(value / inc) * inc;
}

// Conservative step: Feeling + prevRPE
function stepScore(feeling, prevRpe){
  let s = 0;
  if (feeling === "Pain") s -= 2;
  else if (feeling === "Sore") s -= 1;
  else if (feeling === "Great") s += 1;

  if (prevRpe != null && prevRpe !== ""){
    const r = Number(prevRpe);
    if (r >= 9) s -= 1;
    else if (r <= 7) s += 1;
  }
  return s;
}

function mentorCue(row){
  if (row.enjoyed === "Yes") return "Keep. Good fit.";
  if (row.enjoyed === "No") return "Swap next week — consistency wins.";
  if (row.feeling === "Pain") return "Back off or substitute today.";
  if (row.exercise === "Muscle-ups" || row.exercise === "90° Holds") return "Quality work: stop before slowdown.";
  if (row.feeling === "Great") return "Green light: follow suggestion.";
  return "Stay smooth, leave 1–2 reps.";
}

function suggest(row, prev){
  // Returns { suggestedText, suggestedWeight, suggestedReps }
  if (!prev) return { suggestedText: "New entry: start conservative.", suggestedWeight: "", suggestedReps: "" };

  const s = stepScore(row.feeling, prev.rpe);
  const min = row.min, max = row.max;

  // reps/time always nudged; weight only if weighted/machine
  let sugReps = prev.reps;
  if (s > 0) sugReps = Math.min(max, Number(prev.reps) + 1);
  if (s < 0) sugReps = Math.max(min, Number(prev.reps) - 1);

  let sugWeight = "";
  if (row.type === "weighted" || row.type === "machine"){
    const inc = row.inc || 2.5;
    const w = Number(prev.weight || 0);
    const newW = roundToInc(Math.max(0, w + s * inc), inc);
    sugWeight = isFinite(newW) ? newW : "";
  }

  let txt = "";
  if (row.feeling === "Pain") txt = "Back off today.";
  else if (row.type === "bodyweight" || row.type === "time") txt = "Chase clean reps/time.";
  else txt = "Conservative overload.";

  return { suggestedText: txt, suggestedWeight: sugWeight, suggestedReps: sugReps };
}

function getPrevEntry(state, weekStart, session, exercise){
  const prevWeek = addDays(weekStart, -7);
  const rows = state.weeks?.[prevWeek]?.[session] || [];
  return rows.find(r => r.exercise === exercise) || null;
}

// UI
const weekStartEl = document.getElementById("weekStart");
const sessionSelect = document.getElementById("sessionSelect");
const loadBtn = document.getElementById("loadTemplate");
const rowsEl = document.getElementById("rows");
const saveBtn = document.getElementById("saveBtn");
const completeWeekBtn = document.getElementById("completeWeekBtn");
const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");
const resetBtn = document.getElementById("resetBtn");

function fillSessions(){
  sessionSelect.innerHTML = "";
  Object.keys(PROGRAM).forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    sessionSelect.appendChild(opt);
  });
}

function makeSelect(options, value, className="cellInput cellMid"){
  const sel = document.createElement("select");
  sel.className = className;
  options.forEach(o=>{
    const opt = document.createElement("option");
    opt.value = o; opt.textContent = o === "" ? "—" : o;
    sel.appendChild(opt);
  });
  sel.value = value ?? "";
  return sel;
}

function makeInput(value, className="cellInput cellSmall", type="text"){
  const inp = document.createElement("input");
  inp.type = type;
  inp.className = className;
  inp.value = value ?? "";
  return inp;
}

function render(){
  const state = loadState();
  const weekStart = weekStartEl.value;
  const session = sessionSelect.value;

  const base = PROGRAM[session].map(p => ({
    order: p.order,
    exercise: p.exercise,
    type: p.type,
    sets: p.sets,
    reps: p.reps,
    rpe: p.rpe,
    weight: "",
    feeling: "",
    enjoyed: "",
    notes: "",
    min: p.min, max: p.max, inc: p.inc
  }));

  const key = `${weekStart}|${session}`;

  // ✅ Use in-progress rows if we're already editing this same week/session
  let rows = (window.__currentKey === key && Array.isArray(window.__currentRows) && window.__currentRows.length)
    ? window.__currentRows
    : ((state.weeks?.[weekStart]?.[session] && state.weeks[weekStart][session].length)
        ? state.weeks[weekStart][session]
        : base);

  window.__currentKey = key;
  window.__currentRows = rows;

  rowsEl.innerHTML = "";

  rows.forEach((row, idx) => {
    const prev = getPrevEntry(state, weekStart, session, row.exercise);
    const sug = suggest(row, prev);
    const cue = mentorCue(row);

    const tr = document.createElement("tr");

    const needsWeight = (row.type === "weighted" || row.type === "machine");
    const missingImportant = (needsWeight && row.weight === "") || row.reps === "" || row.rpe === "";

    if (row.feeling === "Pain") tr.classList.add("row-pain");
    else if (missingImportant) tr.classList.add("row-soft");

    // #
    let td = document.createElement("td");
    td.textContent = row.order ?? (idx+1);
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
    setsInp.addEventListener("input", ()=>{ row.sets = setsInp.value; });
    td.appendChild(setsInp);
    tr.appendChild(td);

    // Reps/Time
    td = document.createElement("td");
    const repsInp = makeInput(row.reps, "cellInput cellSmall", "number");
    repsInp.addEventListener("input", ()=>{ row.reps = repsInp.value; });
    td.appendChild(repsInp);
    tr.appendChild(td);

    // RPE
    td = document.createElement("td");
    const rpeInp = makeInput(row.rpe, "cellInput cellSmall", "number");
    rpeInp.step = "0.5";
    rpeInp.min = "1"; rpeInp.max = "10";
    rpeInp.addEventListener("input", ()=>{ row.rpe = rpeInp.value; });
    td.appendChild(rpeInp);
    tr.appendChild(td);

    // Weight
    td = document.createElement("td");
    const wInp = makeInput(row.weight, "cellInput cellSmall", "number");
    wInp.step = "0.5";
    wInp.addEventListener("input", ()=>{ row.weight = wInp.value; });
    td.appendChild(wInp);
    tr.appendChild(td);

    // Feeling
    td = document.createElement("td");
    const feelSel = makeSelect(FEELINGS, row.feeling, "cellInput cellMid");
    feelSel.addEventListener("change", ()=>{ row.feeling = feelSel.value; render(); });
    td.appendChild(feelSel);
    tr.appendChild(td);

    // Enjoyed
    td = document.createElement("td");
    const enjSel = makeSelect(ENJOYED, row.enjoyed, "cellInput cellSmall");
    enjSel.addEventListener("change", ()=>{ row.enjoyed = enjSel.value; render(); });
    td.appendChild(enjSel);
    tr.appendChild(td);

    // Suggested
    td = document.createElement("td");
    const parts = [];
    if (sug.suggestedWeight !== "" && sug.suggestedWeight != null) parts.push(`Wt: ${sug.suggestedWeight}`);
    if (sug.suggestedReps !== "" && sug.suggestedReps != null) parts.push(`Reps: ${sug.suggestedReps}`);
    td.textContent = parts.length ? parts.join(" • ") : "—";
    tr.appendChild(td);

    // Mentor cue
    td = document.createElement("td");
    td.textContent = cue;
    tr.appendChild(td);

    // Notes
    td = document.createElement("td");
    const nInp = makeInput(row.notes, "cellInput cellWide", "text");
    nInp.addEventListener("input", ()=>{ row.notes = nInp.value; });
    td.appendChild(nInp);
    tr.appendChild(td);

    rowsEl.appendChild(tr);
  });
}


  const existing = state.weeks?.[weekStart]?.[session];
  const rows = existing && existing.length ? existing : base;

  rowsEl.innerHTML = "";

  rows.forEach((row, idx) => {
    const prev = getPrevEntry(state, weekStart, session, row.exercise);
    const sug = suggest(row, prev);
    const cue = mentorCue(row);

    const tr = document.createElement("tr");

    // soft flags
    const needsWeight = (row.type === "weighted" || row.type === "machine");
    const missingImportant = (needsWeight && row.weight === "") || row.reps === "" || row.rpe === "";
    if (row.feeling === "Pain") tr.classList.add("row-pain");
    else if (missingImportant) tr.classList.add("row-soft");

    // #
    let td = document.createElement("td");
    td.textContent = row.order ?? (idx+1);
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
    setsInp.addEventListener("input", ()=>{ row.sets = setsInp.value; });
    td.appendChild(setsInp);
    tr.appendChild(td);

    // Reps/Time
    td = document.createElement("td");
    const repsInp = makeInput(row.reps, "cellInput cellSmall", "number");
    repsInp.addEventListener("input", ()=>{ row.reps = repsInp.value; });
    td.appendChild(repsInp);
    tr.appendChild(td);

    // RPE
    td = document.createElement("td");
    const rpeInp = makeInput(row.rpe, "cellInput cellSmall", "number");
    rpeInp.step = "0.5";
    rpeInp.min = "1"; rpeInp.max = "10";
    rpeInp.addEventListener("input", ()=>{ row.rpe = rpeInp.value; });
    td.appendChild(rpeInp);
    tr.appendChild(td);

    // Weight
    td = document.createElement("td");
    const wInp = makeInput(row.weight, "cellInput cellSmall", "number");
    wInp.step = "0.5";
    wInp.addEventListener("input", ()=>{ row.weight = wInp.value; });
    td.appendChild(wInp);
    tr.appendChild(td);

    // Feeling
    td = document.createElement("td");
    const feelSel = makeSelect(FEELINGS, row.feeling, "cellInput cellMid");
    feelSel.addEventListener("change", ()=>{ row.feeling = feelSel.value; render(); });
    td.appendChild(feelSel);
    tr.appendChild(td);

    // Enjoyed
    td = document.createElement("td");
    const enjSel = makeSelect(ENJOYED, row.enjoyed, "cellInput cellSmall");
    enjSel.addEventListener("change", ()=>{ row.enjoyed = enjSel.value; render(); });
    td.appendChild(enjSel);
    tr.appendChild(td);

    // Suggested
    td = document.createElement("td");
    const parts = [];
    if (sug.suggestedWeight !== "" && sug.suggestedWeight != null) parts.push(`Wt: ${sug.suggestedWeight}`);
    if (sug.suggestedReps !== "" && sug.suggestedReps != null) parts.push(`Reps: ${sug.suggestedReps}`);
    td.textContent = parts.length ? parts.join(" • ") : "—";
    tr.appendChild(td);

    // Mentor cue
    td = document.createElement("td");
    td.textContent = cue;
    tr.appendChild(td);

    // Notes
    td = document.createElement("td");
    const nInp = makeInput(row.notes, "cellInput cellWide", "text");
    nInp.addEventListener("input", ()=>{ row.notes = nInp.value; });
    td.appendChild(nInp);
    tr.appendChild(td);

    rowsEl.appendChild(tr);
  });

  // Store "current working set" in memory so Save works without re-deriving
  window.__currentRows = rows;
}

function save(){
  const state = loadState();
  const weekStart = weekStartEl.value;
  const session = sessionSelect.value;
  state.weeks[weekStart] = state.weeks[weekStart] || {};
  state.weeks[weekStart][session] = window.__currentRows || [];
  saveState(state);
}

function markWeekComplete(){
  const state = loadState();
  const weekStart = weekStartEl.value;
  if (!state.completedWeeks.includes(weekStart)) state.completedWeeks.push(weekStart);
  saveState(state);
  alert("Week marked complete.");
}

function exportJSON(){
  const state = loadState();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "training-tracker-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const obj = JSON.parse(reader.result);
      if (!obj.weeks) throw new Error("Invalid file");
      saveState(obj);
      alert("Imported.");
      render();
    }catch(e){
      alert("Import failed: " + e.message);
    }
  };
  reader.readAsText(file);
}

function resetData(){
  if (!confirm("Reset local data? This deletes localStorage for this tracker.")) return;
  localStorage.removeItem(STORAGE_KEY);
  render();
}

// init
fillSessions();
weekStartEl.value = isoMonday();
render();

loadBtn.addEventListener("click", render);
saveBtn.addEventListener("click", ()=>{ save(); alert("Saved."); });
completeWeekBtn.addEventListener("click", ()=>{ save(); markWeekComplete(); });
exportBtn.addEventListener("click", exportJSON);
importInput.addEventListener("change", (e)=>{ if (e.target.files?.[0]) importJSON(e.target.files[0]); });
resetBtn.addEventListener("click", resetData);

sessionSelect.addEventListener("change", render);
weekStartEl.addEventListener("change", render);
