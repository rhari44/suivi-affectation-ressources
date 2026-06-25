import { useState, useRef } from "react";

const COLORS: string[] = ["#378ADD","#1D9E75","#D85A30","#7F77DD","#D4537E","#639922","#BA7517","#993556","#0F6E56","#534AB7"];
const LEAVE_COLOR = "#888780";

const css = `
  * { box-sizing: border-box; }
  body { background: #F1EFE8; }
  .app { background: #F1EFE8; min-height: 100vh; padding: 1.25rem; font-family: var(--font-sans); color: var(--color-text-primary); }
  .card { background: #fff; border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); }
  .tab-bar { display: flex; gap: 4px; background: #fff; border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md); padding: 4px; }
  .tab { padding: 6px 14px; border-radius: 6px; border: none; background: transparent; cursor: pointer; font-size: 13px; color: var(--color-text-secondary); font-family: var(--font-sans); }
  .tab.active { background: #F1EFE8; color: var(--color-text-primary); font-weight: 500; }
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: var(--border-radius-md); border: 0.5px solid var(--color-border-secondary); background: #fff; cursor: pointer; font-size: 13px; font-family: var(--font-sans); color: var(--color-text-primary); white-space: nowrap; }
  .btn:hover { background: #F1EFE8; }
  .btn.primary { background: #378ADD; color: #fff; border-color: #378ADD; font-weight: 500; }
  .btn.primary:hover { background: #185FA5; border-color: #185FA5; }
  .btn.danger { color: #A32D2D; border-color: #F7C1C1; background: #FCEBEB; }
  .btn.danger:hover { background: #F7C1C1; }
  .btn.sm { padding: 5px 10px; font-size: 12px; }
  .overlay { position: fixed; inset: 0; background: rgba(44,44,42,0.45); display: flex; align-items: center; justify-content: center; z-index: 200; }
  .modal { background: #fff; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-lg); padding: 1.5rem; width: 420px; max-width: 96vw; box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
  .modal-title { margin: 0; font-weight: 500; font-size: 16px; }
  .field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
  .field label { font-size: 12px; font-weight: 500; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
  .field input, .field select { width: 100%; padding: 8px 10px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); font-size: 13px; font-family: var(--font-sans); background: #fff; color: var(--color-text-primary); }
  .field input:focus, .field select:focus { outline: none; border-color: #378ADD; box-shadow: 0 0 0 2px #B5D4F4; }
  .radio-group { display: flex; gap: 12px; }
  .radio-opt { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 13px; padding: 7px 12px; border-radius: var(--border-radius-md); border: 0.5px solid var(--color-border-tertiary); flex: 1; justify-content: center; }
  .radio-opt.selected { border-color: #378ADD; background: #E6F1FB; color: #185FA5; font-weight: 500; }
  .gantt-header { background: #fff; border-bottom: 0.5px solid var(--color-border-tertiary); position: sticky; top: 0; z-index: 2; }
  .gantt-row { display: flex; border-bottom: 0.5px solid var(--color-border-tertiary); background: #fff; }
  .gantt-row:last-child { border-bottom: none; }
  .gantt-row:hover { background: #fafaf8; }
  .resource-cell { width: 180px; flex-shrink: 0; padding: 10px 12px; border-right: 0.5px solid var(--color-border-tertiary); display: flex; align-items: flex-start; gap: 8px; }
  .avatar { width: 32px; height: 32px; border-radius: 50%; background: #E6F1FB; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 500; color: #185FA5; flex-shrink: 0; }
  .week-col { flex-shrink: 0; border-left: 0.5px solid var(--color-border-tertiary); }
  .alert-bar { background: #FCEBEB; border: 0.5px solid #F7C1C1; border-radius: var(--border-radius-md); padding: 9px 14px; margin-bottom: 12px; font-size: 13px; color: #A32D2D; display: flex; align-items: center; gap: 8px; }
  .list-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-top: 0.5px solid var(--color-border-tertiary); }
  .list-row:first-child { border-top: none; }
  .badge { font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 500; }
  .badge-danger { background: #FCEBEB; color: #A32D2D; }
  .legend { display: flex; gap: 16px; font-size: 12px; color: var(--color-text-secondary); flex-wrap: wrap; align-items: center; margin-top: 12px; }
  .legend-dot { width: 12px; height: 12px; border-radius: 2px; display: inline-block; }
`;

interface Week { start: Date; end: Date; label: string; sub: string; }
interface Resource { id: string; name: string; }
interface Project { id: string; name: string; color: string; }
interface Assignment { id: string; resourceId: string; projectId: string | null; task: string; start: string; end: string; isLeave: boolean; }
interface DateRange { start: Date; end: Date; }
interface Modal { type: string; mode: string; id?: string; }

function getWeeks(startDate: Date, numWeeks: number): Week[] {
  const weeks: Week[] = [];
  const d = new Date(startDate);
  d.setDate(d.getDate() - d.getDay() + 1);
  for (let i = 0; i < numWeeks; i++) {
    const s = new Date(d), e = new Date(d);
    e.setDate(e.getDate() + 6);
    weeks.push({ start: new Date(s), end: new Date(e), label: `S${i+1}`, sub: `${s.getDate()}/${s.getMonth()+1}` });
    d.setDate(d.getDate() + 7);
  }
  return weeks;
}

function dateToDay(date: Date): number { return Math.floor(date.getTime() / 86400000); }
function overlap(a: DateRange, b: DateRange): boolean { return a.start <= b.end && a.end >= b.start; }

function computeLoad(resource: Resource, weeks: Week[], assignments: Assignment[]): number[] {
  return weeks.map(w => assignments.filter(a =>
    a.resourceId === resource.id && !a.isLeave &&
    overlap({ start: new Date(a.start), end: new Date(a.end) }, w)
  ).length);
}

function uid(): string { return Math.random().toString(36).slice(2, 8); }
function addDays(d: string, n: number): string { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); }

const today = new Date(), todayStr = today.toISOString().slice(0, 10);

const initProjects: Project[] = [
  { id: "p1", name: "Refonte site", color: COLORS[0] },
  { id: "p2", name: "CRM v2", color: COLORS[1] },
  { id: "p3", name: "Infrastructure", color: COLORS[2] },
];
const initResources: Resource[] = [
  { id: "r1", name: "Alice Martin" },
  { id: "r2", name: "Bob Dupont" },
  { id: "r3", name: "Claire Morin" },
];
const initAssignments: Assignment[] = [
  { id: "a1", resourceId: "r1", projectId: "p1", task: "Design UX", start: todayStr, end: addDays(todayStr, 13), isLeave: false },
  { id: "a2", resourceId: "r1", projectId: "p2", task: "Specs", start: addDays(todayStr, 5), end: addDays(todayStr, 18), isLeave: false },
  { id: "a3", resourceId: "r2", projectId: "p2", task: "Dev backend", start: todayStr, end: addDays(todayStr, 20), isLeave: false },
  { id: "a4", resourceId: "r3", projectId: "p1", task: "Intégration", start: addDays(todayStr, 7), end: addDays(todayStr, 21), isLeave: false },
  { id: "a5", resourceId: "r2", projectId: null, task: "Congés annuels", start: addDays(todayStr, 14), end: addDays(todayStr, 17), isLeave: true },
];

const NUM_WEEKS = 12, DAY_W = 26;

function parseCSV(text: string): Record<string, string>[] {
  const [hdr, ...rows] = text.trim().split("\n");
  const headers = hdr.split(",").map(h => h.trim());
  return rows.map(l => {
    const v = l.split(",").map(x => x.trim());
    const o: Record<string, string> = {};
    headers.forEach((h, i) => o[h] = v[i] || "");
    return o;
  });
}

export default function App() {
  const [resources, setResources] = useState<Resource[]>(initResources);
  const [projects, setProjects] = useState<Project[]>(initProjects);
  const [assignments, setAssignments] = useState<Assignment[]>(initAssignments);
  const [view, setView] = useState<string>("gantt");
  const [modal, setModal] = useState<Modal | null>(null);
  const [form, setForm] = useState<Partial<Assignment & Resource & Project>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [originDate] = useState<Date>(() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d; });

  const weeks = getWeeks(originDate, NUM_WEEKS);
  const ganttW = NUM_WEEKS * 7 * DAY_W;
  const todayOff = (dateToDay(new Date()) - dateToDay(originDate)) * DAY_W;

  const F = (f: Partial<typeof form>) => setForm(p => ({ ...p, ...f }));
  function openAdd(type: string, defaults: Partial<typeof form> = {}) { setModal({ type, mode: "add" }); setForm(defaults); }
  function openEdit(type: string, item: Assignment | Resource | Project) { setModal({ type, mode: "edit", id: (item as {id:string}).id }); setForm({ ...item }); }
  function closeModal() { setModal(null); setForm({}); }

  function saveResource() {
    if (!form.name?.trim()) return;
    modal?.mode === "add"
      ? setResources(r => [...r, { id: uid(), name: form.name! }])
      : setResources(r => r.map(x => x.id === modal?.id ? { ...x, name: form.name! } : x));
    closeModal();
  }
  function delResource(id: string) { setResources(r => r.filter(x => x.id !== id)); setAssignments(a => a.filter(x => x.resourceId !== id)); }

  function saveProject() {
    if (!form.name?.trim()) return;
    modal?.mode === "add"
      ? setProjects(p => [...p, { id: uid(), name: form.name!, color: (form.color as string) || COLORS[projects.length % COLORS.length] }])
      : setProjects(p => p.map(x => x.id === modal?.id ? { ...x, name: form.name!, color: (form.color as string) || x.color } : x));
    closeModal();
  }
  function delProject(id: string) { setProjects(p => p.filter(x => x.id !== id)); setAssignments(a => a.filter(x => x.projectId !== id)); }

  function saveAssignment() {
    if (!form.resourceId || !form.start || !form.end || form.start > form.end) return;
    const a: Assignment = {
      id: modal?.id || uid(),
      resourceId: form.resourceId as string,
      projectId: (form.projectId as string) || null,
      task: (form.task as string) || "",
      start: form.start as string,
      end: form.end as string,
      isLeave: !!form.isLeave,
    };
    modal?.mode === "add"
      ? setAssignments(x => [...x, a])
      : setAssignments(x => x.map(y => y.id === modal?.id ? a : y));
    closeModal();
  }
  function delAssignment(id: string) { setAssignments(a => a.filter(x => x.id !== id)); }

  function exportCSV() {
    const rows = [["id","resourceId","resourceName","projectId","projectName","task","start","end","isLeave"]];
    assignments.forEach(a => {
      const r = resources.find(x => x.id === a.resourceId);
      const p = projects.find(x => x.id === a.projectId);
      rows.push([a.id, a.resourceId, r?.name || "", a.projectId || "", p?.name || "", a.task || "", a.start, a.end, a.isLeave ? "oui" : "non"]);
    });
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const u = URL.createObjectURL(blob);
    const el = document.createElement("a"); el.href = u; el.download = "affectations.csv"; el.click();
  }

  function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const rows = parseCSV(ev.target?.result as string);
        setAssignments(rows.map(r => ({
          id: r.id || uid(),
          resourceId: r.resourceId,
          projectId: r.projectId || null,
          task: r.task || "",
          start: r.start,
          end: r.end,
          isLeave: r.isLeave === "oui" || r.isLeave === "true",
        })));
      } catch (_) { /* ignore */ }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function barPos(a: Assignment): { left: number; width: number } {
    const s = new Date(a.start), e = new Date(a.end);
    const left = (dateToDay(s) - dateToDay(originDate)) * DAY_W;
    const width = Math.max((dateToDay(e) - dateToDay(s) + 1) * DAY_W, DAY_W);
    return { left, width };
  }

  function loadColor(n: number): string {
    if (n <= 0) return "transparent";
    if (n === 1) return "#B5D4F4";
    if (n === 2) return "#EF9F27";
    return "#E24B4A";
  }

  const overloaded = resources.filter(r => computeLoad(r, weeks, assignments).some(l => l > 2));

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 500, fontSize: 20 }}>Affectation des ressources</h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>Planification sur {NUM_WEEKS} semaines</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => openAdd("assignment", { resourceId: resources[0]?.id || "", projectId: projects[0]?.id || "", task: "", start: todayStr, end: addDays(todayStr, 7), isLeave: false })}>
              <i className="ti ti-plus" aria-hidden="true"></i> Nouvelle affectation
            </button>
            <button className="btn" onClick={exportCSV}><i className="ti ti-download" aria-hidden="true"></i> Exporter CSV</button>
            <button className="btn" onClick={() => fileRef.current?.click()}><i className="ti ti-upload" aria-hidden="true"></i> Importer CSV</button>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={importCSV} />
          </div>
        </div>

        {overloaded.length > 0 && (
          <div className="alert-bar">
            <i className="ti ti-alert-triangle" style={{ fontSize: 16 }} aria-hidden="true"></i>
            <strong>Surcharge détectée :</strong> {overloaded.map(r => r.name).join(", ")}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div className="tab-bar">
            {([["gantt","ti-layout-kanban","Timeline Gantt"],["resources","ti-users","Ressources"],["projects","ti-folder","Projets"]] as [string,string,string][]).map(([v, ic, lb]) => (
              <button key={v} className={`tab${view === v ? " active" : ""}`} onClick={() => setView(v)}>
                <i className={`ti ${ic}`} aria-hidden="true"></i> {lb}
              </button>
            ))}
          </div>
          {view === "resources" && <button className="btn sm" style={{ marginLeft: "auto" }} onClick={() => openAdd("resource", { name: "" })}><i className="ti ti-plus" aria-hidden="true"></i> Ajouter une ressource</button>}
          {view === "projects" && <button className="btn sm" style={{ marginLeft: "auto" }} onClick={() => openAdd("project", { name: "", color: COLORS[projects.length % COLORS.length] })}><i className="ti ti-plus" aria-hidden="true"></i> Ajouter un projet</button>}
        </div>

        {view === "gantt" && (
          <div className="card" style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 180 + ganttW }}>
              <div className="gantt-header" style={{ display: "flex" }}>
                <div style={{ width: 180, flexShrink: 0, padding: "8px 12px", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", borderRight: "0.5px solid var(--color-border-tertiary)" }}>Ressource</div>
                <div style={{ display: "flex", width: ganttW }}>
                  {weeks.map((w, i) => (
                    <div key={i} className="week-col" style={{ width: 7 * DAY_W, textAlign: "center", padding: "6px 2px" }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{w.label}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{w.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {resources.map(r => {
                const rA = assignments.filter(a => a.resourceId === r.id);
                const layers: Assignment[][] = [];
                rA.forEach(a => {
                  let placed = false;
                  for (let li = 0; li < layers.length; li++) {
                    if (!layers[li].some(b => overlap({ start: new Date(b.start), end: new Date(b.end) }, { start: new Date(a.start), end: new Date(a.end) }))) {
                      layers[li].push(a); placed = true; break;
                    }
                  }
                  if (!placed) layers.push([a]);
                });
                const rowH = Math.max(44, layers.length * 30 + 12);
                return (
                  <div key={r.id} className="gantt-row" style={{ minHeight: rowH }}>
                    <div className="resource-cell">
                      <div className="avatar">{r.name.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase()}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{rA.filter(a => !a.isLeave).length} tâche(s)</div>
                      </div>
                    </div>
                    <div style={{ position: "relative", width: ganttW, flexShrink: 0 }}>
                      {weeks.map((_, i) => <div key={i} className="week-col" style={{ position: "absolute", left: i * 7 * DAY_W, top: 0, width: 7 * DAY_W, height: "100%", pointerEvents: "none" }}></div>)}
                      {todayOff >= 0 && todayOff < ganttW && <div style={{ position: "absolute", left: todayOff, top: 0, width: 2, height: "100%", background: "#E24B4A", opacity: 0.6, pointerEvents: "none" }}></div>}
                      {layers.map((layer, li) => layer.map(a => {
                        const { left, width } = barPos(a);
                        if (left > ganttW || left + width < 0) return null;
                        const proj = projects.find(p => p.id === a.projectId);
                        const color = a.isLeave ? LEAVE_COLOR : (proj?.color || COLORS[0]);
                        return (
                          <div key={a.id} title={`${a.task} (${a.start} → ${a.end})`}
                            onClick={() => openEdit("assignment", a)}
                            style={{ position: "absolute", left: Math.max(0, left), top: 8 + li * 30, width: Math.min(width, ganttW - Math.max(0, left)) - 2, height: 22, background: color, borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", paddingLeft: 7, overflow: "hidden" }}>
                            <span style={{ fontSize: 11, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>{a.task || (a.isLeave ? "Congé" : proj?.name || "")}</span>
                          </div>
                        );
                      }))}
                    </div>
                  </div>
                );
              })}

              <div style={{ display: "flex", background: "#F1EFE8", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                <div style={{ width: 180, flexShrink: 0, padding: "6px 12px", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", borderRight: "0.5px solid var(--color-border-tertiary)" }}>Charge totale</div>
                <div style={{ display: "flex", width: ganttW }}>
                  {weeks.map((w, i) => {
                    const total = resources.reduce((s, r) => s + computeLoad(r, [w], assignments)[0], 0);
                    const avg = resources.length ? total / resources.length : 0;
                    return <div key={i} className="week-col" style={{ width: 7 * DAY_W, textAlign: "center", fontSize: 12, padding: "5px 0", background: loadColor(Math.ceil(avg)), color: avg >= 2 ? "#fff" : "var(--color-text-secondary)", fontWeight: 500 }}>{total}</div>;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "resources" && (
          <div className="card">
            {resources.map(r => {
              const asgns = assignments.filter(a => a.resourceId === r.id && !a.isLeave);
              const leaves = assignments.filter(a => a.resourceId === r.id && a.isLeave);
              const overload = computeLoad(r, weeks, assignments).some(l => l > 2);
              return (
                <div key={r.id} className="list-row">
                  <div className="avatar" style={{ width: 38, height: 38, fontSize: 13 }}>{r.name.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{asgns.length} tâche(s) · {leaves.length} congé(s)</div>
                  </div>
                  {overload && <span className="badge badge-danger"><i className="ti ti-alert-triangle" style={{ fontSize: 11 }} aria-hidden="true"></i> Surcharge</span>}
                  <button className="btn sm" onClick={() => openEdit("resource", r)}><i className="ti ti-edit" aria-hidden="true"></i> Modifier</button>
                  <button className="btn sm danger" onClick={() => delResource(r.id)}><i className="ti ti-trash" aria-hidden="true"></i> Supprimer</button>
                </div>
              );
            })}
            {resources.length === 0 && <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--color-text-secondary)", fontSize: 13 }}>Aucune ressource.</div>}
          </div>
        )}

        {view === "projects" && (
          <div className="card">
            {projects.map(p => {
              const asgns = assignments.filter(a => a.projectId === p.id);
              return (
                <div key={p.id} className="list-row">
                  <div style={{ width: 16, height: 16, borderRadius: 3, background: p.color, flexShrink: 0 }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{asgns.length} affectation(s)</div>
                  </div>
                  <button className="btn sm" onClick={() => openEdit("project", p)}><i className="ti ti-edit" aria-hidden="true"></i> Modifier</button>
                  <button className="btn sm danger" onClick={() => delProject(p.id)}><i className="ti ti-trash" aria-hidden="true"></i> Supprimer</button>
                </div>
              );
            })}
            {projects.length === 0 && <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--color-text-secondary)", fontSize: 13 }}>Aucun projet.</div>}
          </div>
        )}

        <div className="legend">
          <span>Charge :</span>
          {([["1 tâche","#B5D4F4"],["2 tâches","#EF9F27"],["3+ (surcharge)","#E24B4A"]] as [string,string][]).map(([l, c]) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}><span className="legend-dot" style={{ background: c }}></span>{l}</span>
          ))}
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span className="legend-dot" style={{ background: LEAVE_COLOR }}></span>Congé</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 2, height: 12, background: "#E24B4A", display: "inline-block" }}></span>Aujourd'hui</span>
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {modal.mode === "add" ? "Ajouter" : "Modifier"} {modal.type === "resource" ? "une ressource" : modal.type === "project" ? "un projet" : "une affectation"}
              </h3>
              <button className="btn sm" onClick={closeModal}><i className="ti ti-x" aria-hidden="true"></i></button>
            </div>

            {modal.type === "resource" && (
              <div className="field">
                <label>Nom complet</label>
                <input value={(form.name as string) || ""} onChange={e => F({ name: e.target.value })} placeholder="Prénom Nom" autoFocus />
              </div>
            )}

            {modal.type === "project" && (<>
              <div className="field">
                <label>Nom du projet</label>
                <input value={(form.name as string) || ""} onChange={e => F({ name: e.target.value })} placeholder="Nom du projet" autoFocus />
              </div>
              <div className="field">
                <label>Couleur</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => F({ color: c })} style={{ width: 26, height: 26, borderRadius: 5, background: c, cursor: "pointer", border: form.color === c ? "2px solid #2C2C2A" : "2px solid transparent" }}></div>
                  ))}
                </div>
              </div>
            </>)}

            {modal.type === "assignment" && (<>
              <div className="field">
                <label>Ressource</label>
                <select value={(form.resourceId as string) || ""} onChange={e => F({ resourceId: e.target.value })}>
                  {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Type</label>
                <div className="radio-group">
                  <div className={`radio-opt${!form.isLeave ? " selected" : ""}`} onClick={() => F({ isLeave: false })}>
                    <i className="ti ti-briefcase" aria-hidden="true"></i> Tâche / Projet
                  </div>
                  <div className={`radio-opt${form.isLeave ? " selected" : ""}`} onClick={() => F({ isLeave: true })}>
                    <i className="ti ti-beach" aria-hidden="true"></i> Congé / Absence
                  </div>
                </div>
              </div>
              {!form.isLeave && (<>
                <div className="field">
                  <label>Projet</label>
                  <select value={(form.projectId as string) || ""} onChange={e => F({ projectId: e.target.value })}>
                    <option value="">— Sans projet —</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Tâche</label>
                  <input value={(form.task as string) || ""} onChange={e => F({ task: e.target.value })} placeholder="Description de la tâche" />
                </div>
              </>)}
              <div style={{ display: "flex", gap: 12 }}>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Date de début</label>
                  <input type="date" value={(form.start as string) || ""} onChange={e => F({ start: e.target.value })} />
                </div>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Date de fin</label>
                  <input type="date" value={(form.end as string) || ""} onChange={e => F({ end: e.target.value })} />
                </div>
              </div>
            </>)}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, paddingTop: 16, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
              <div>
                {modal.mode === "edit" && (
                  <button className="btn danger" onClick={() => {
                    if (modal.type === "resource" && modal.id) delResource(modal.id);
                    else if (modal.type === "project" && modal.id) delProject(modal.id);
                    else if (modal.id) delAssignment(modal.id);
                    closeModal();
                  }}><i className="ti ti-trash" aria-hidden="true"></i> Supprimer</button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" onClick={closeModal}>Annuler</button>
                <button className="btn primary" onClick={modal.type === "resource" ? saveResource : modal.type === "project" ? saveProject : saveAssignment}>
                  {modal.mode === "add" ? "Ajouter" : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
