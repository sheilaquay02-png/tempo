import { useEffect, useState } from "react";
import {
  DAILY_CHECKIN_ENERGIES,
  DAILY_CHECKIN_MOODS,
  fmt,
  fmtDate,
  taskDurationToMinutes,
} from "../../lib/tempo/core";
import {
  DEFAULT_MEAL_BREAKS,
  DEFAULT_PLANNING_RULES,
  PLANNING_MODES,
} from "../../constants/tempoConstants";
import { hourLabel } from "../../utils/dateUtils";
import {
  normalizeMealBreaks,
  normalizePlanningMode,
  normalizePlanningRules,
  planningModeMeta,
} from "../../utils/planningUtils";

export function TaskScheduleModal({ task, onClose, onSchedule, workStart = 9, workEnd = 19 }) {
  const [mode, setMode] = useState("today");
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Schedule task">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><div><strong>📅 Schedule this task</strong><div style={{fontSize:12,color:"var(--text2)",fontWeight:800}}>{task?.title}</div></div><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="modal-row"><label>Find slot</label><select className="modal-select" value={mode} onChange={e => setMode(e.target.value)}><option value="today">Today</option><option value="week">This week</option><option value="deadline">Before deadline</option></select></div>
          <div className="settings-section-desc">Tempo will look for slots inside your Work Hours ({hourLabel(workStart)}–{hourLabel(workEnd)}) while respecting meal breaks and planning buffers.</div>
        </div>
        <div className="modal-footer"><button className="tf-cancel" onClick={onClose}>Cancel</button><button className="tf-save" onClick={() => onSchedule(mode)}>Schedule task</button></div>
      </div>
    </div>
  );
}

export function DailyPlanModal({ plan, onClose, onApply, onRegenerate, onMoveRemaining, onMoveRemainingToWeek, onSkipLowPriority, mealBreaks = DEFAULT_MEAL_BREAKS, planningRules = DEFAULT_PLANNING_RULES }) {
  const [selectedMode, setSelectedMode] = useState(normalizePlanningMode(plan?.mode));
  const [selectedTaskIds, setSelectedTaskIds] = useState(() => plan?.selectedTaskIds || (plan?.allPlanningTasks || []).map(t => t.id));
  useEffect(() => {
    setSelectedMode(normalizePlanningMode(plan?.mode));
    setSelectedTaskIds(plan?.selectedTaskIds || (plan?.allPlanningTasks || []).map(t => t.id));
  }, [plan?.generatedAt, plan?.mode, plan?.selectedTaskIds, plan?.allPlanningTasks]);
  if (!plan) return null;
  const modeMeta = planningModeMeta(selectedMode);
  const activeRules = normalizePlanningRules(plan.planningRules || planningRules);
  const remainingTasks = plan.remainingTasks || plan.unscheduled || [];
  const lifestyleBlocks = plan.lifestyleBlocks || [];
  const skippedLowPriority = plan.skippedLowPriority || [];
  const allPlanningTasks = plan.allPlanningTasks || [];
  const excludedByChoice = plan.excludedByChoice || [];
  const selectedCount = selectedTaskIds.length;
  const energyMeta = plan.energy ? DAILY_CHECKIN_ENERGIES.find(e => e.id === plan.energy) : null;
  const moodMeta = plan.mood ? DAILY_CHECKIN_MOODS.find(m => m.id === plan.mood) : null;
  const regenerateWithSelection = (nextIds = selectedTaskIds, nextMode = selectedMode, extra = {}) => {
    onRegenerate?.(plan, [], nextMode, {
      skipLowPriorityToday: Boolean(extra.skipLowPriorityToday ?? plan.skipLowPriorityToday),
      includedTaskIds: nextIds,
    });
  };
  const handleMode = mode => {
    const nextMode = normalizePlanningMode(mode);
    setSelectedMode(nextMode);
    regenerateWithSelection(selectedTaskIds, nextMode);
  };
  const toggleTaskPlanning = id => {
    const nextIds = selectedTaskIds.includes(id) ? selectedTaskIds.filter(x => x !== id) : [...selectedTaskIds, id];
    setSelectedTaskIds(nextIds);
    regenerateWithSelection(nextIds, selectedMode);
  };
  const selectAllTasks = () => {
    const nextIds = allPlanningTasks.map(t => t.id);
    setSelectedTaskIds(nextIds);
    regenerateWithSelection(nextIds, selectedMode);
  };
  const clearSelectedTasks = () => {
    setSelectedTaskIds([]);
    regenerateWithSelection([], selectedMode);
  };
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Plan today">
      <div className="modal day-plan-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><div><strong>✨ Plan Today</strong><div style={{fontSize:12,color:"var(--text2)",fontWeight:800}}>{fmtDate(plan.date)}</div></div><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="plan-summary">Planning <strong>{selectedCount}</strong> of <strong>{allPlanningTasks.length}</strong> open task{allPlanningTasks.length === 1 ? "" : "s"} with <strong>{Math.round(plan.freeMinutes / 60 * 10) / 10}</strong> free hours today.</div>
          <div className="plan-context-card">
            <div><strong>{modeMeta.emoji} {modeMeta.label}</strong><span>{modeMeta.desc}</span></div>
            <div><strong>{energyMeta ? `${energyMeta.emoji} ${energyMeta.label} energy` : "Energy not set"}</strong><span>{moodMeta ? `${moodMeta.emoji} Feeling ${moodMeta.label}` : "Add a check-in for smarter planning"}</span></div>
          </div>
          <div className="planning-mode-grid">
            {PLANNING_MODES.map(mode => <button key={mode.id} className={`planning-mode-btn ${selectedMode === mode.id ? "active" : ""}`} onClick={() => handleMode(mode.id)}><span>{mode.emoji}</span><strong>{mode.label}</strong><small>{mode.desc}</small></button>)}
          </div>
          {allPlanningTasks.length > 0 && <div className="plan-task-picker">
            <div className="plan-task-picker-head"><div><strong>Choose tasks to plan</strong><span>Tick what you want Tempo to schedule today.</span></div><div><button className="mini-move-btn" onClick={selectAllTasks} disabled={selectedCount === allPlanningTasks.length}>All</button><button className="mini-move-btn" onClick={clearSelectedTasks} disabled={selectedCount === 0}>None</button></div></div>
            <div className="plan-task-picker-list">
              {allPlanningTasks.map(task => {
                const checked = selectedTaskIds.includes(task.id);
                return <label key={task.id} className={`plan-task-choice ${checked ? "selected" : ""}`}><input type="checkbox" checked={checked} onChange={() => toggleTaskPlanning(task.id)} /><span><strong>{task.title}</strong><small>{task.priority || "medium"} priority · {taskDurationToMinutes(task.duration || 30)} min{task.deadline ? ` · due ${task.deadline}` : ""}</small></span></label>;
              })}
            </div>
          </div>}
          <div className="plan-break-note">Protected: {normalizeMealBreaks(mealBreaks).filter(b => b.enabled).map(b => `${b.label} ${b.start}–${b.end}`).join(", ") || "no meal breaks"}{lifestyleBlocks.length ? ` · ${lifestyleBlocks.length} habit block${lifestyleBlocks.length === 1 ? "" : "s"}` : ""}. Buffer: {activeRules.bufferMinutes} min. Capacity: {activeRules.maxPlanMinutes} min.</div>
          {plan.suggestions.length ? <div className="plan-list">{plan.suggestions.map(item => <div key={item.task.id} className="plan-row"><span>{fmt(item.start)} — {item.task.title}</span><strong>{item.minutes}min</strong></div>)}</div> : <div className="task-card-empty">{selectedCount ? "No suitable free slots found for the selected tasks today." : "Tick at least one task for Tempo to plan today."}</div>}
          {lifestyleBlocks.length > 0 && <div className="plan-soft-blocks"><strong>Soft commitments protected</strong>{lifestyleBlocks.slice(0, 4).map(block => <span key={block.id}>{fmt(block.start)} · {block.title.replace(/^Ritual: |^Habit: /, "")}</span>)}{lifestyleBlocks.length > 4 && <span>+{lifestyleBlocks.length - 4} more</span>}</div>}
          {excludedByChoice.length > 0 && <div className="plan-skip-note">Not planned by choice: {excludedByChoice.map(t => t.title).join(", ")}</div>}
          {remainingTasks.length > 0 && <div className="plan-warning">Could not fit: {remainingTasks.map(t => t.title).join(", ")}</div>}
          {skippedLowPriority.length > 0 && <div className="plan-skip-note">Skipped low-priority today: {skippedLowPriority.map(t => t.title).join(", ")}</div>}
        </div>
        <div className="modal-footer day-plan-footer"><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="tf-cancel" onClick={() => regenerateWithSelection(selectedTaskIds, selectedMode)}>Regenerate plan</button><button className="tf-cancel" onClick={() => onSkipLowPriority?.(plan, [], selectedMode, selectedTaskIds)} disabled={Boolean(plan.skipLowPriorityToday)}>Skip low-priority today</button>{remainingTasks.length > 0 && <button className="tf-cancel" onClick={() => onMoveRemaining?.(plan)}>Move remaining to tomorrow</button>}{remainingTasks.length > 0 && <button className="tf-cancel" onClick={() => onMoveRemainingToWeek?.(plan)}>Move remaining to this week</button>}</div><div style={{display:"flex",gap:8}}><button className="tf-cancel" onClick={onClose}>Cancel</button><button className="tf-save" disabled={!plan.suggestions.length} onClick={() => onApply(plan)}>Apply plan</button></div></div>
      </div>
    </div>
  );
}
