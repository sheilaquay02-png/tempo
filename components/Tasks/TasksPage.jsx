"use client";

import { useMemo, useState } from "react";
import TaskPanel from "./TaskPanel";
import { dateKey, sortTasks } from "../../lib/recurrence";

export default function TasksPage({ tasks, categories, onAdd, onUpdate, onDelete, onToggle }) {
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => sortTasks(tasks).filter(t => {
    const today = dateKey(new Date());
    if (filter === "day") return t.deadline === today;
    if (filter === "week") return t.deadline && t.deadline >= today;
    if (filter === "completed") return t.done;
    if (filter === "open") return !t.done;
    if (filter === "recurring") return Boolean(t.recurrence);
    return true;
  }), [tasks, filter]);
  return (
    <div className="tasks-page">
      <div className="page-title"><h1>Tasks</h1><p>View and edit tasks by day, week, month, status and recurrence.</p></div>
      <div className="filter-pills">{["all", "day", "week", "open", "completed", "recurring"].map(f => <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>{f}</button>)}</div>
      <TaskPanel tasks={filtered} categories={categories} onAdd={onAdd} onUpdate={onUpdate} onDelete={onDelete} onToggle={onToggle} />
    </div>
  );
}
