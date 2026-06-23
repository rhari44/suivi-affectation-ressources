import { useState, useEffect, useRef } from 'react';

const COLORS = [
  '#378ADD',
  '#1D9E75',
  '#D85A30',
  '#7F77DD',
  '#D4537E',
  '#639922',
  '#BA7517',
  '#993556',
  '#0F6E56',
  '#534AB7',
];
const LEAVE_COLOR = '#888780';

function getWeeks(startDate, numWeeks) {
  const weeks = [];
  const d = new Date(startDate);
  d.setDate(d.getDate() - d.getDay() + 1);
  for (let i = 0; i < numWeeks; i++) {
    const s = new Date(d);
    const e = new Date(d);
    e.setDate(e.getDate() + 6);
    weeks.push({
      start: new Date(s),
      end: new Date(e),
      label: `S${i + 1}\n${s.getDate()}/${s.getMonth() + 1}`,
    });
    d.setDate(d.getDate() + 7);
  }
  return weeks;
}

function dateToDay(date, origin) {
  return Math.floor((date - origin) / 86400000);
}

function overlap(a, b) {
  return a.start <= b.end && a.end >= b.start;
}

function computeLoad(resource, weeks, assignments) {
  return weeks.map((w) => {
    const asgns = assignments.filter(
      (a) =>
        a.resourceId === resource.id &&
        overlap(
          { start: new Date(a.start), end: new Date(a.end) },
          { start: w.start, end: w.end }
        ) &&
        !a.isLeave
    );
    return asgns.length;
  });
}

const initProjects = [
  { id: 'p1', name: 'Refonte site', color: COLORS[0] },
  { id: 'p2', name: 'CRM v2', color: COLORS[1] },
  { id: 'p3', name: 'Infrastructure', color: COLORS[2] },
];
const initResources = [
  { id: 'r1', name: 'Alice Martin' },
  { id: 'r2', name: 'Bob Dupont' },
  { id: 'r3', name: 'Claire Morin' },
];
const today = new Date();
const todayStr = today.toISOString().slice(0, 10);
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
}
const initAssignments = [
  {
    id: 'a1',
    resourceId: 'r1',
    projectId: 'p1',
    task: 'Design UX',
    start: todayStr,
    end: addDays(todayStr, 13),
    isLeave: false,
  },
  {
    id: 'a2',
    resourceId: 'r1',
    projectId: 'p2',
    task: 'Specs',
    start: addDays(todayStr, 5),
    end: addDays(todayStr, 18),
    isLeave: false,
  },
  {
    id: 'a3',
    resourceId: 'r2',
    projectId: 'p2',
    task: 'Dev backend',
    start: todayStr,
    end: addDays(todayStr, 20),
    isLeave: false,
  },
  {
    id: 'a4',
    resourceId: 'r3',
    projectId: 'p1',
    task: 'Intégration',
    start: addDays(todayStr, 7),
    end: addDays(todayStr, 21),
    isLeave: false,
  },
  {
    id: 'a5',
    resourceId: 'r2',
    projectId: null,
    task: 'Congés',
    start: addDays(todayStr, 14),
    end: addDays(todayStr, 17),
    isLeave: true,
  },
];

const NUM_WEEKS = 12;

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((l) => {
    const vals = l.split(',').map((v) => v.trim());
    const obj = {};
    headers.forEach((h, i) => (obj[h] = vals[i] || ''));
    return obj;
  });
}

export default function App() {
  const [resources, setResources] = useState(initResources);
  const [projects, setProjects] = useState(initProjects);
  const [assignments, setAssignments] = useState(initAssignments);
  const [view, setView] = useState('gantt');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [originDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    return d;
  });
  const weeks = getWeeks(originDate, NUM_WEEKS);
  const fileRef = useRef();

  function openAdd(type, defaults = {}) {
    setModal({ type, mode: 'add' });
    setForm(defaults);
  }
  function openEdit(type, item) {
    setModal({ type, mode: 'edit', id: item.id });
    setForm({ ...item });
  }
  function closeModal() {
    setModal(null);
    setForm({});
  }

  function saveResource() {
    if (!form.name?.trim()) return;
    if (modal.mode === 'add')
      setResources((r) => [...r, { id: uid(), name: form.name }]);
    else
      setResources((r) =>
        r.map((x) => (x.id === modal.id ? { ...x, ...form } : x))
      );
    closeModal();
  }
  function deleteResource(id) {
    setResources((r) => r.filter((x) => x.id !== id));
    setAssignments((a) => a.filter((x) => x.resourceId !== id));
  }
  function saveProject() {
    if (!form.name?.trim()) return;
    if (modal.mode === 'add')
      setProjects((p) => [
        ...p,
        {
          id: uid(),
          name: form.name,
          color: form.color || COLORS[projects.length % COLORS.length],
        },
      ]);
    else
      setProjects((p) =>
        p.map((x) => (x.id === modal.id ? { ...x, ...form } : x))
      );
    closeModal();
  }
  function deleteProject(id) {
    setProjects((p) => p.filter((x) => x.id !== id));
    setAssignments((a) => a.filter((x) => x.projectId !== id));
  }
  function saveAssignment() {
    if (!form.resourceId || !form.start || !form.end) return;
    if (form.start > form.end) return;
    if (modal.mode === 'add')
      setAssignments((a) => [
        ...a,
        {
          id: uid(),
          ...form,
          isLeave: form.isLeave === true || form.isLeave === 'true',
        },
      ]);
    else
      setAssignments((a) =>
        a.map((x) =>
          x.id === modal.id
            ? {
                ...x,
                ...form,
                isLeave: form.isLeave === true || form.isLeave === 'true',
              }
            : x
        )
      );
    closeModal();
  }
  function deleteAssignment(id) {
    setAssignments((a) => a.filter((x) => x.id !== id));
  }

  function exportCSV() {
    const rows = [
      [
        'id',
        'resourceId',
        'resourceName',
        'projectId',
        'projectName',
        'task',
        'start',
        'end',
        'isLeave',
      ],
    ];
    assignments.forEach((a) => {
      const r = resources.find((x) => x.id === a.resourceId);
      const p = projects.find((x) => x.id === a.projectId);
      rows.push([
        a.id,
        a.resourceId,
        r?.name || '',
        a.projectId || '',
        p?.name || '',
        a.task || '',
        a.start,
        a.end,
        a.isLeave ? 'oui' : 'non',
      ]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'affectations.csv';
    a.click();
  }

  function importCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target.result);
        const newAsgns = rows.map((r) => ({
          id: r.id || uid(),
          resourceId: r.resourceId,
          projectId: r.projectId || null,
          task: r.task || '',
          start: r.start,
          end: r.end,
          isLeave: r.isLeave === 'oui' || r.isLeave === 'true',
        }));
        setAssignments(newAsgns);
      } catch {}
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const dayWidth = 28;
  const totalDays = NUM_WEEKS * 7;
  const ganttWidth = totalDays * dayWidth;

  function assignmentToBar(a) {
    const s = new Date(a.start),
      e = new Date(a.end);
    const originDay = dateToDay(originDate, new Date(0));
    const sDay = dateToDay(s, new Date(0));
    const eDay = dateToDay(e, new Date(0));
    const left = (sDay - originDay) * dayWidth;
    const width = Math.max((eDay - sDay + 1) * dayWidth, dayWidth);
    return { left, width };
  }

  function getLoadColor(n) {
    if (n === 0) return 'transparent';
    if (n === 1) return '#B5D4F4';
    if (n === 2) return '#EF9F27';
    return '#E24B4A';
  }

  const overloaded = resources.filter((r) => {
    const loads = computeLoad(r, weeks, assignments);
    return loads.some((l) => l > 2);
  });

  const todayOffset =
    (dateToDay(new Date(), new Date(0)) - dateToDay(originDate, new Date(0))) *
    dayWidth;

  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        color: 'var(--color-text-primary)',
        padding: '0 0 2rem',
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 500, margin: '1rem 0 0.5rem' }}>
        Affectation des ressources
      </h2>

      {overloaded.length > 0 && (
        <div
          style={{
            background: 'var(--color-background-danger)',
            border: '0.5px solid var(--color-border-danger)',
            borderRadius: 'var(--border-radius-md)',
            padding: '8px 14px',
            marginBottom: 12,
            fontSize: 13,
            color: 'var(--color-text-danger)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <i
            className="ti ti-alert-triangle"
            style={{ fontSize: 16 }}
            aria-hidden="true"
          ></i>
          Surcharge détectée : {overloaded.map((r) => r.name).join(', ')}
        </div>
      )}

      <div
        style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}
      >
        {['gantt', 'resources', 'projects'].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              fontWeight: view === v ? 500 : 400,
              background:
                view === v
                  ? 'var(--color-background-secondary)'
                  : 'transparent',
            }}
          >
            {v === 'gantt'
              ? 'Timeline Gantt'
              : v === 'resources'
              ? 'Ressources'
              : 'Projets'}
          </button>
        ))}
        <div style={{ flex: 1 }}></div>
        <button
          onClick={() =>
            openAdd('assignment', {
              resourceId: resources[0]?.id || '',
              projectId: projects[0]?.id || '',
              task: '',
              start: todayStr,
              end: addDays(todayStr, 7),
              isLeave: false,
            })
          }
        >
          <i className="ti ti-plus" aria-hidden="true"></i> Affectation
        </button>
        <button onClick={exportCSV}>
          <i className="ti ti-download" aria-hidden="true"></i> Export CSV
        </button>
        <button onClick={() => fileRef.current.click()}>
          <i className="ti ti-upload" aria-hidden="true"></i> Import CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={importCSV}
        />
      </div>

      {view === 'gantt' && (
        <div
          style={{
            overflowX: 'auto',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)',
          }}
        >
          <div style={{ minWidth: 180 + ganttWidth, position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                borderBottom: '0.5px solid var(--color-border-tertiary)',
                background: 'var(--color-background-secondary)',
              }}
            >
              <div
                style={{
                  width: 180,
                  flexShrink: 0,
                  padding: '6px 10px',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--color-text-secondary)',
                }}
              >
                Ressource
              </div>
              <div style={{ position: 'relative', width: ganttWidth }}>
                <div style={{ display: 'flex' }}>
                  {weeks.map((w, i) => (
                    <div
                      key={i}
                      style={{
                        width: 7 * dayWidth,
                        flexShrink: 0,
                        borderLeft: '0.5px solid var(--color-border-tertiary)',
                        fontSize: 11,
                        padding: '4px 4px',
                        color: 'var(--color-text-secondary)',
                        textAlign: 'center',
                        lineHeight: 1.3,
                      }}
                    >
                      {w.label.split('\n').map((l, j) => (
                        <div key={j}>{l}</div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {resources.map((r) => {
              const rAsgns = assignments.filter((a) => a.resourceId === r.id);
              const layers = [];
              rAsgns.forEach((a) => {
                let placed = false;
                for (let li = 0; li < layers.length; li++) {
                  const hasOverlap = layers[li].some((b) =>
                    overlap(
                      { start: new Date(b.start), end: new Date(b.end) },
                      { start: new Date(a.start), end: new Date(a.end) }
                    )
                  );
                  if (!hasOverlap) {
                    layers[li].push(a);
                    placed = true;
                    break;
                  }
                }
                if (!placed) layers.push([a]);
              });
              const rowH = Math.max(36, layers.length * 28 + 8);
              return (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    borderBottom: '0.5px solid var(--color-border-tertiary)',
                    minHeight: rowH,
                  }}
                >
                  <div
                    style={{
                      width: 180,
                      flexShrink: 0,
                      padding: '8px 10px',
                      fontSize: 13,
                      borderRight: '0.5px solid var(--color-border-tertiary)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'var(--color-background-info)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'var(--color-text-info)',
                        flexShrink: 0,
                      }}
                    >
                      {r.name
                        .split(' ')
                        .map((x) => x[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span
                      style={{ fontSize: 12, lineHeight: 1.4, marginTop: 4 }}
                    >
                      {r.name}
                    </span>
                  </div>
                  <div style={{ position: 'relative', width: ganttWidth }}>
                    {weeks.map((_, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          left: i * 7 * dayWidth,
                          top: 0,
                          width: 7 * dayWidth,
                          height: '100%',
                          borderLeft:
                            '0.5px solid var(--color-border-tertiary)',
                          pointerEvents: 'none',
                        }}
                      ></div>
                    ))}
                    {todayOffset >= 0 && todayOffset < ganttWidth && (
                      <div
                        style={{
                          position: 'absolute',
                          left: todayOffset,
                          top: 0,
                          width: 2,
                          height: '100%',
                          background: '#E24B4A',
                          opacity: 0.7,
                          pointerEvents: 'none',
                        }}
                      ></div>
                    )}
                    {layers.map((layer, li) =>
                      layer.map((a) => {
                        const { left, width } = assignmentToBar(a);
                        const proj = projects.find((p) => p.id === a.projectId);
                        const color = a.isLeave
                          ? LEAVE_COLOR
                          : proj?.color || COLORS[0];
                        if (left > ganttWidth || left + width < 0) return null;
                        return (
                          <div
                            key={a.id}
                            title={`${a.task} (${a.start} → ${a.end})`}
                            onClick={() => openEdit('assignment', a)}
                            style={{
                              position: 'absolute',
                              left: Math.max(0, left),
                              top: 6 + li * 28,
                              width: Math.min(
                                width,
                                ganttWidth - Math.max(0, left)
                              ),
                              height: 22,
                              background: color,
                              borderRadius: 4,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              paddingLeft: 6,
                              overflow: 'hidden',
                              opacity: 0.9,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: '#fff',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontWeight: 500,
                              }}
                            >
                              {a.task ||
                                (a.isLeave ? 'Congé' : proj?.name || '')}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
            <div
              style={{
                display: 'flex',
                borderTop: '0.5px solid var(--color-border-tertiary)',
                background: 'var(--color-background-secondary)',
              }}
            >
              <div
                style={{
                  width: 180,
                  flexShrink: 0,
                  padding: '4px 10px',
                  fontSize: 11,
                  color: 'var(--color-text-secondary)',
                }}
              >
                Charge / semaine
              </div>
              <div
                style={{
                  position: 'relative',
                  width: ganttWidth,
                  display: 'flex',
                }}
              >
                {weeks.map((w, i) => {
                  const totalLoad = resources.reduce((sum, r) => {
                    const l = computeLoad(r, [w], assignments)[0];
                    return sum + l;
                  }, 0);
                  return (
                    <div
                      key={i}
                      style={{
                        width: 7 * dayWidth,
                        flexShrink: 0,
                        borderLeft: '0.5px solid var(--color-border-tertiary)',
                        textAlign: 'center',
                        fontSize: 11,
                        padding: '4px 0',
                        background: getLoadColor(
                          Math.ceil(totalLoad / resources.length)
                        ),
                        color:
                          totalLoad > 2
                            ? '#fff'
                            : 'var(--color-text-secondary)',
                      }}
                    >
                      {totalLoad}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'resources' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: 8,
            }}
          >
            <button onClick={() => openAdd('resource', { name: '' })}>
              <i className="ti ti-plus" aria-hidden="true"></i> Ressource
            </button>
          </div>
          <div
            style={{
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-lg)',
              overflow: 'hidden',
            }}
          >
            {resources.map((r, i) => {
              const asgns = assignments.filter(
                (a) => a.resourceId === r.id && !a.isLeave
              );
              const leaves = assignments.filter(
                (a) => a.resourceId === r.id && a.isLeave
              );
              const loads = computeLoad(r, weeks, assignments);
              const maxLoad = Math.max(...loads);
              return (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderTop:
                      i > 0
                        ? '0.5px solid var(--color-border-tertiary)'
                        : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--color-background-info)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--color-text-info)',
                      flexShrink: 0,
                    }}
                  >
                    {r.name
                      .split(' ')
                      .map((x) => x[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>
                      {r.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {asgns.length} tâche(s) · {leaves.length} congé(s)
                    </div>
                  </div>
                  {maxLoad > 2 && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 'var(--border-radius-md)',
                        background: 'var(--color-background-danger)',
                        color: 'var(--color-text-danger)',
                      }}
                    >
                      Surcharge
                    </span>
                  )}
                  <button
                    onClick={() => openEdit('resource', r)}
                    style={{ padding: '4px 10px', fontSize: 12 }}
                  >
                    <i className="ti ti-edit" aria-hidden="true"></i>
                  </button>
                  <button
                    onClick={() => deleteResource(r.id)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      color: 'var(--color-text-danger)',
                    }}
                  >
                    <i className="ti ti-trash" aria-hidden="true"></i>
                  </button>
                </div>
              );
            })}
            {resources.length === 0 && (
              <div
                style={{
                  padding: '1rem',
                  color: 'var(--color-text-secondary)',
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                Aucune ressource
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'projects' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: 8,
            }}
          >
            <button
              onClick={() =>
                openAdd('project', {
                  name: '',
                  color: COLORS[projects.length % COLORS.length],
                })
              }
            >
              <i className="ti ti-plus" aria-hidden="true"></i> Projet
            </button>
          </div>
          <div
            style={{
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-lg)',
              overflow: 'hidden',
            }}
          >
            {projects.map((p, i) => {
              const asgns = assignments.filter((a) => a.projectId === p.id);
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderTop:
                      i > 0
                        ? '0.5px solid var(--color-border-tertiary)'
                        : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: p.color,
                      flexShrink: 0,
                    }}
                  ></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>
                      {p.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {asgns.length} affectation(s)
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit('project', p)}
                    style={{ padding: '4px 10px', fontSize: 12 }}
                  >
                    <i className="ti ti-edit" aria-hidden="true"></i>
                  </button>
                  <button
                    onClick={() => deleteProject(p.id)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      color: 'var(--color-text-danger)',
                    }}
                  >
                    <i className="ti ti-trash" aria-hidden="true"></i>
                  </button>
                </div>
              );
            })}
            {projects.length === 0 && (
              <div
                style={{
                  padding: '1rem',
                  color: 'var(--color-text-secondary)',
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                Aucun projet
              </div>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 12,
          display: 'flex',
          gap: 16,
          fontSize: 12,
          color: 'var(--color-text-secondary)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <span>Légende charge :</span>
        {[
          ['1 tâche', '#B5D4F4'],
          ['2 tâches', '#EF9F27'],
          ['3+ tâches', '#E24B4A'],
        ].map(([l, c]) => (
          <span
            key={l}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: c,
                display: 'inline-block',
              }}
            ></span>
            {l}
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              background: LEAVE_COLOR,
              display: 'inline-block',
            }}
          ></span>
          Congé
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              width: 2,
              height: 12,
              background: '#E24B4A',
              display: 'inline-block',
            }}
          ></span>
          Aujourd'hui
        </span>
      </div>

      {modal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div
            style={{
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '1.25rem',
              width: 380,
              maxWidth: '95vw',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <h3 style={{ margin: 0, fontWeight: 500, fontSize: 16 }}>
                {modal.mode === 'add' ? 'Ajouter' : 'Modifier'}{' '}
                {modal.type === 'resource'
                  ? 'une ressource'
                  : modal.type === 'project'
                  ? 'un projet'
                  : 'une affectation'}
              </h3>
              <button onClick={closeModal} style={{ padding: '4px 8px' }}>
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>

            {modal.type === 'resource' && (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <label
                  style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}
                >
                  Nom
                </label>
                <input
                  value={form.name || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Prénom Nom"
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {modal.type === 'project' && (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <label
                  style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}
                >
                  Nom du projet
                </label>
                <input
                  value={form.name || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Nom du projet"
                  style={{ width: '100%' }}
                />
                <label
                  style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}
                >
                  Couleur
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COLORS.map((c) => (
                    <div
                      key={c}
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        background: c,
                        cursor: 'pointer',
                        border:
                          form.color === c
                            ? '2px solid var(--color-text-primary)'
                            : '2px solid transparent',
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            )}

            {modal.type === 'assignment' && (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <label
                  style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}
                >
                  Ressource
                </label>
                <select
                  value={form.resourceId || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, resourceId: e.target.value }))
                  }
                  style={{ width: '100%' }}
                >
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <label
                  style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}
                >
                  Type
                </label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <label
                    style={{
                      display: 'flex',
                      gap: 6,
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    <input
                      type="radio"
                      checked={!form.isLeave}
                      onChange={() =>
                        setForm((f) => ({ ...f, isLeave: false }))
                      }
                    />
                    Tâche / Projet
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      gap: 6,
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    <input
                      type="radio"
                      checked={!!form.isLeave}
                      onChange={() => setForm((f) => ({ ...f, isLeave: true }))}
                    />
                    Congé
                  </label>
                </div>
                {!form.isLeave && (
                  <>
                    <label
                      style={{
                        fontSize: 13,
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Projet
                    </label>
                    <select
                      value={form.projectId || ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, projectId: e.target.value }))
                      }
                      style={{ width: '100%' }}
                    >
                      <option value="">— Sans projet —</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <label
                      style={{
                        fontSize: 13,
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Tâche
                    </label>
                    <input
                      value={form.task || ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, task: e.target.value }))
                      }
                      placeholder="Nom de la tâche"
                      style={{ width: '100%' }}
                    />
                  </>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        fontSize: 13,
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Début
                    </label>
                    <input
                      type="date"
                      value={form.start || ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, start: e.target.value }))
                      }
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        fontSize: 13,
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Fin
                    </label>
                    <input
                      type="date"
                      value={form.end || ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, end: e.target.value }))
                      }
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'flex-end',
                marginTop: 18,
              }}
            >
              {modal.mode === 'edit' && (
                <button
                  onClick={() => {
                    if (modal.type === 'resource') deleteResource(modal.id);
                    else if (modal.type === 'project') deleteProject(modal.id);
                    else deleteAssignment(modal.id);
                    closeModal();
                  }}
                  style={{
                    color: 'var(--color-text-danger)',
                    marginRight: 'auto',
                  }}
                >
                  <i className="ti ti-trash" aria-hidden="true"></i> Supprimer
                </button>
              )}
              <button onClick={closeModal}>Annuler</button>
              <button
                onClick={
                  modal.type === 'resource'
                    ? saveResource
                    : modal.type === 'project'
                    ? saveProject
                    : saveAssignment
                }
                style={{ fontWeight: 500 }}
              >
                {modal.mode === 'add' ? 'Ajouter' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
