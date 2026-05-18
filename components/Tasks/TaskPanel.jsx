"use client";

import { useState } from "react";
import RecurrenceModal from "../Calendar/RecurrenceModal";
import { dateKey, durationToMinutes, ensureTaskModel, minutesToFriendly, parseDateKey, recurrenceSummary, sortTasks, uid } from "../../lib/recurrence";

function emptyTask(categories) {
  return { title: "", durationValue: 30, durationUnit: "minutes", category: categories?.[0]?.id || "admin", deadline: "", priority: "medium", notes: "", recurrence: null };
}

function TaskForm({ initial, categories, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial ? { ...ensureTaskModel(initial), deadline: initial.deadline || "" } : emptyTask(categories));
  const [showRecurrence, setShowRecurrence] = useState(false);
  function patch(next) { setForm(f => ({ ...f, ...next })); }
  function save() {
    if (!form.title.trim()) return;
    onSave(ensureTaskModel({ ...form, id: form.id || uid("task"), title: form.title.trim(), deadline: form.deadline || null, duration: durationToMinutes(form.durationValue, form.durationUnit) }));
  }
  return (
    <div className="task-form">
      <input className="input" placeholder="Task title" value={form.title} onChange={e => patch({ title: e.target.value })} />
      <div className="form-grid two"><input className="input" type="number" min="0" value={form.durationValue} onChange={e => patch({ durationValue: Number(e.target.value) })} /><select className="input" value={form.durationUnit} onChange={e => patch({ durationUnit: e.target.value })}><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option></select></div>
      <div className="form-grid two"><select className="input" value={form.category} onChange={e => patch({ category: e.target.value })}>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select><select className="input" value={form.priority} onChange={e => patch({ priority: e.target.value })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
      <input className="input" type="date" value={form.deadline || ""} onChange={e => patch({ deadline: e.target.value })} />
      <button className="repeat-card compact" type="button" onClick={() => setShowRecurrence(true)}><span>{recurrenceSummary(form.recurrence, form.deadline ? parseDateKey(form.deadline) : new Date())}</span><strong>Customise</strong></button>
      <textarea className="input textarea" placeholder="Notes" value={form.notes} onChange={e => patch({ notes: e.target.value })} />
      <div className="modal-actions"><button className="ghost-btn" onClick={onCancel}>Cancel</button><button className="primary-btn" onClick={save}>Save task</button></div>
      {showRecurrence && <RecurrenceModal value={form.recurrence} baseDate={form.deadline ? parseDateKey(form.deadline) : new Date()} onClose={() => setShowRecurrence(false)} onSave={recurrence => { patch({ recurrence }); setShowRecurrence(false); }} />}
    </div>
  );
}

function TaskRow({ task, categories, onToggle, onEdit, onDelete }) {
  const cat = categories.find(c => c.id === task.category);
  function dragStart(e) {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/tempo-task", JSON.stringify(task));
  }
  return (
    <div className={`task-row ${task.done ? "done" : ""}`} draggable onDragStart={dragStart}>
      <input type="checkbox" checked={task.done} onChange={() => onToggle(task)} />
      <div className="task-main"><strong>{task.title}</strong><span>{cat?.icon} {cat?.label || task.category} · {minutesToFriendly(task.duration)}{task.deadline ? ` · due ${task.deadline}` : ""}{task.recurrence ? " · ↻" : ""}</span>{task.notes && <small>{task.notes}</small>}</div>
      <button className="mini-btn" onClick={() => onEdit(task)}>Edit</button>
      <button className="mini-btn danger-text" onClick={() => onDelete(task.id)}>Delete</button>
    </div>
  );
}

export default function TaskPanel({ tasks, categories, onAdd, onUpdate, onDelete, onToggle }) {
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const openTasks = sortTasks(tasks.filter(t => !t.done)).slice(0, 12);
  return (
    <aside className="task-panel">
      <div className="panel-header"><h2>Tasks</h2><button className="primary-btn small" onClick={() => setShowAdd(true)}>+ Task</button></div>
      {showAdd && <TaskForm categories={categories} onCancel={() => setShowAdd(false)} onSave={task => { onAdd(task); setShowAdd(false); }} />}
      {editing && <TaskForm initial={editing} categories={categories} onCancel={() => setEditing(null)} onSave={task => { onUpdate(task); setEditing(null); }} />}
      <div className="task-list">{openTasks.map(task => <TaskRow key={task.id} task={task} categories={categories} onToggle={onToggle} onEdit={setEditing} onDelete={onDelete} />)}</div>
    </aside>
  );
}
