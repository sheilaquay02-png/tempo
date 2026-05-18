"use client";

import { useState } from "react";
import { dateKey } from "../../lib/recurrence";

export default function JournalPage({ journal, journalActivities, onSaveEntry, onAddActivity, onRemoveActivity }) {
  const [day, setDay] = useState(dateKey(new Date()));
  const entry = journal?.[day] || { mood: "", activities: [], note: "", gratitude: "" };
  const [newActivity, setNewActivity] = useState("");

  function patch(next) {
    onSaveEntry(day, { ...entry, ...next, updatedAt: new Date().toISOString() });
  }

  function toggleActivity(name) {
    const set = new Set(entry.activities || []);
    if (set.has(name)) set.delete(name);
    else set.add(name);
    patch({ activities: [...set] });
  }

  return (
    <div className="journal-page">
      <div className="page-title"><h1>Daily Journal</h1><p>Activities and notes are saved by date.</p></div>
      <input className="input journal-date" type="date" value={day} onChange={e => setDay(e.target.value)} />
      <label className="field-label">Mood</label>
      <input className="input" value={entry.mood || ""} onChange={e => patch({ mood: e.target.value })} placeholder="How was today?" />
      <label className="field-label">Activities</label>
      <div className="activity-grid">{journalActivities.map(activity => <button key={activity} className={(entry.activities || []).includes(activity) ? "active" : ""} onClick={() => toggleActivity(activity)}>{activity}</button>)}</div>
      <div className="settings-row"><input className="input" placeholder="Add reusable activity" value={newActivity} onChange={e => setNewActivity(e.target.value)} /><button className="primary-btn small" onClick={() => { if (newActivity.trim()) { onAddActivity(newActivity.trim()); setNewActivity(""); } }}>Add</button></div>
      <div className="settings-list small-list">{journalActivities.map(a => <div key={a} className="settings-row"><span>{a}</span><button className="mini-btn danger-text" onClick={() => onRemoveActivity(a)}>Remove</button></div>)}</div>
      <label className="field-label">Gratitude</label>
      <textarea className="input textarea" value={entry.gratitude || ""} onChange={e => patch({ gratitude: e.target.value })} placeholder="What are you grateful for?" />
      <label className="field-label">Notes</label>
      <textarea className="input textarea tall" value={entry.note || ""} onChange={e => patch({ note: e.target.value })} placeholder="Write your daily notes..." />
    </div>
  );
}
