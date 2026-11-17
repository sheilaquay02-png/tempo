"use client";

import { useState } from "react";
import * as Core from "../../lib/tempo/core";
import { TempoWeather } from "../weather/TempoWeather";

const {
  TODAY,
  DEFAULT_AFFIRMATIONS,
  AFFIRMATION_CATEGORIES,
  affirmationForDate,
  affirmationCategoryById,
  normalizeAffirmation,
  uid,
} = Core;

export function DailyAffirmationCard({ affirmations = DEFAULT_AFFIRMATIONS, compact = false }) {
  const todayAffirmation = affirmationForDate(affirmations, TODAY);
  if (!todayAffirmation) return null;
  const category = affirmationCategoryById(todayAffirmation.category);
  return (
    <section className={`phase-card affirmation-daily-card ${compact ? "compact" : ""}`}>
      <div className="phase-card-head"><span>Daily Affirmation</span><small>Randomized daily</small></div>
      <div className="affirmation-quote-row">
        <div className="affirmation-quote-text">
          <blockquote>“{todayAffirmation.text}”</blockquote>
        </div>
        <span className="affirmation-quote-icon">{category.emoji}</span>
      </div>
      <TempoWeather />
    </section>
  );
}

export function AffirmationEditorModal({ affirmation, onClose, onSave, onDelete }) {
  const initial = affirmation ? normalizeAffirmation(affirmation) : normalizeAffirmation({ id: "affirm-" + uid(), text: "", category: "calm", favorite: false, source: "custom" });
  const [form, setForm] = useState(initial);
  const canDelete = Boolean(affirmation?.id && affirmation?.source === "custom");
  function saveForm() {
    const text = form.text.trim();
    if (!text) return;
    onSave?.({ ...form, text, source: "custom" });
    onClose?.();
  }
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Affirmation editor">
      <div className="affirmation-modal" onClick={e => e.stopPropagation()}>
        <div className="checkin-modal-head">
          <div>
            <div className="phase-kicker">Affirmation</div>
            <h2>{affirmation ? "Edit your affirmation" : "Create a custom affirmation"}</h2>
            <p>Keep it grounded, kind, and simple enough to return to daily.</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="checkin-section">
          <div className="checkin-section-title">Text</div>
          <textarea className="checkin-note-input affirmation-textarea" rows={4} value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} placeholder="Example: I can move through today calmly and clearly." />
        </div>
        <div className="checkin-section">
          <div className="checkin-section-title">Category</div>
          <div className="affirmation-category-grid">
            {AFFIRMATION_CATEGORIES.map(cat => (
              <button type="button" key={cat.id} className={`affirmation-category ${form.category === cat.id ? "active" : ""}`} onClick={() => setForm(f => ({ ...f, category: cat.id }))}>
                <span>{cat.emoji}</span>{cat.label}
              </button>
            ))}
          </div>
        </div>
        <label className="affirmation-inline-toggle">
          <input type="checkbox" checked={Boolean(form.favorite)} onChange={e => setForm(f => ({ ...f, favorite: e.target.checked }))} />
          <span>Save as favorite</span>
        </label>
        <div className="modal-footer">
          {canDelete && <button className="modal-delete" onClick={() => { onDelete?.(affirmation); onClose?.(); }}>Delete</button>}
          <button className="tf-cancel" onClick={onClose}>Cancel</button>
          <button className="tf-save" disabled={!form.text.trim()} onClick={saveForm}>{affirmation ? "Save affirmation" : "Create affirmation"}</button>
        </div>
      </div>
    </div>
  );
}
