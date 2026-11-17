"use client";

import { useState } from "react";

export function QuickAddMenu({ onExpense, onTask, onEvent }) {
  const [open, setOpen] = useState(false);
  return <div className="tempo-quick-add">
    {open && <div className="tempo-quick-add-menu" role="menu" aria-label="Quick Add">
      <button role="menuitem" onClick={() => {setOpen(false);onExpense?.()}}>💳 Expense</button>
      <button role="menuitem" onClick={() => {setOpen(false);onTask?.()}}>✓ Task</button>
      <button role="menuitem" onClick={() => {setOpen(false);onEvent?.()}}>🗓 Event</button>
    </div>}
    <button className="tempo-quick-add-fab" aria-label={open?"Close Quick Add":"Open Quick Add"} aria-expanded={open} type="button" onClick={() => setOpen(x=>!x)}>{open?"×":"+"}</button>
  </div>;
}
