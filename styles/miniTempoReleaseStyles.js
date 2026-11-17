// Mini Tempo inherits the exact Nunito typography, theme tokens and surface language
// used by Full Tempo. Scoped to the compact companion; Budget remains Full-only.
export const miniTempoCSS = `
.mini-tempo{
  height:100dvh;min-height:0;overflow:auto;overflow-x:hidden;
  color:var(--text);font-family:var(--font);font-size:calc(var(--fs)*14px);
  background:radial-gradient(circle at 8% 0%,rgba(var(--accent-rgb),.10),transparent 36%),linear-gradient(180deg,var(--bg),var(--bg3));
}
.mini-tempo-header{
  padding:13px 16px;min-height:66px;background:var(--bg2);border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;gap:10px;box-shadow:var(--shadow-sm);
}
.mini-tempo-drag{-webkit-app-region:drag;display:flex;align-items:center;gap:10px;flex:1;min-width:0}
.mini-tempo-brand-mark{
  width:33px;height:33px;flex-shrink:0;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg,var(--accent),var(--accent2));border-radius:11px;font-size:17px;
}
.mini-tempo-brand{display:flex;flex-direction:column;gap:1px;min-width:0}
.mini-tempo-brand strong{font-size:15px;line-height:1.15;color:var(--accent);font-weight:900}
.mini-tempo-brand small{font-size:10px;line-height:1.35;color:var(--text2);font-weight:700}
.mini-tempo-title-actions{display:flex;align-items:center;gap:3px;-webkit-app-region:no-drag}
.mini-tempo-title-actions button{
  width:30px;height:30px;border:1px solid transparent;border-radius:10px;background:transparent;
  color:var(--text2);font-family:var(--font);font-size:14px;font-weight:900;cursor:pointer;
}
.mini-tempo-title-actions button:hover{background:var(--bg4);border-color:var(--accent3);color:var(--accent)}
.mini-tempo-body{padding:17px 16px 20px;display:flex;flex-direction:column;gap:12px}
.mini-tempo h1{font-size:calc(var(--fs)*21px);line-height:1.25;margin:0;color:var(--text);font-weight:900}
.mini-tempo-subtitle{color:var(--text2);font-size:calc(var(--fs)*11px);font-weight:700;margin:-7px 0 3px}
.mini-section{
  border:1px solid var(--border);background:var(--surface);border-radius:20px;
  padding:13px;display:flex;flex-direction:column;gap:11px;box-shadow:var(--shadow-sm);
}
.mini-section-head{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:13px;color:var(--text)}
.mini-section-head strong{font-size:13px;font-weight:900}
.mini-section-head button{border:0;background:transparent;color:var(--accent);font:inherit;font-size:11px;font-weight:800;cursor:pointer}
.mini-task{display:flex;gap:10px;align-items:center;min-height:28px}
.mini-task input{accent-color:var(--accent);width:16px;height:16px;flex-shrink:0}
.mini-task button{padding:3px 0;min-width:0;flex:1;text-align:left;border:0;background:transparent;color:var(--text);font-family:var(--font);font-size:12px;font-weight:700;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}
.mini-task button.mini-task-done{text-decoration:line-through;color:var(--text3)}
.mini-task-add{display:flex;gap:8px}
.mini-task-add input{
  min-width:0;flex:1;border:1px solid var(--border);border-radius:10px;background:var(--bg3);
  color:var(--text);font-family:var(--font);font-size:12px;font-weight:700;padding:9px 10px;outline:none;
}
.mini-task-add input::placeholder{color:var(--text3)}
.mini-task-add input:focus{border-color:var(--accent3)}
.mini-task-add button{
  border:0;background:linear-gradient(135deg,var(--accent),var(--accent2));border-radius:10px;
  padding:8px 12px;color:#fff;font-family:var(--font);font-size:11px;font-weight:900;cursor:pointer;
}
.mini-task-add button:disabled{opacity:.5;cursor:default}
.mini-event{
  text-align:left;display:flex;flex-direction:column;gap:5px;border:1px solid var(--border);
  border-radius:14px;background:var(--bg3);padding:12px;color:var(--text);
  font-family:var(--font);cursor:pointer;
}
.mini-event small{color:var(--text2);font-family:var(--mono);font-size:10px;font-weight:700}
.mini-event strong{font-size:13px;font-weight:900;overflow-wrap:anywhere}
.mini-event span{font-size:11px;font-weight:700;color:var(--accent)}
.mini-event:hover{border-color:var(--accent3);background:var(--bg4)}
.mini-empty{font-size:12px;color:var(--text3);font-weight:700;margin:0}
.mini-quick-toggle{
  border:1px solid var(--border);background:var(--surface);border-radius:14px;padding:11px;
  color:var(--accent);font-family:var(--font);font-size:12px;font-weight:900;cursor:pointer;box-shadow:var(--shadow-sm);
}
.mini-quick-menu{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
.mini-quick-menu button{
  border:1px solid var(--border);border-radius:12px;background:var(--surface);
  padding:10px 5px;color:var(--text2);font-family:var(--font);font-size:11px;font-weight:800;cursor:pointer;
}
.mini-quick-menu button:hover{border-color:var(--accent3);color:var(--accent);background:var(--bg4)}
.mini-footer{display:flex;justify-content:flex-end;gap:6px;margin-top:2px}
.mini-footer button{border:0;background:transparent;color:var(--accent);font-family:var(--font);font-size:11px;font-weight:900;cursor:pointer}
.mini-task-undo{
  flex:0 0 auto!important;width:auto!important;border:1px solid var(--accent3)!important;
  background:var(--bg4)!important;color:var(--accent)!important;border-radius:10px;
  padding:5px 9px!important;font-weight:900!important;font-size:11px!important;text-decoration:none!important;
}
.mini-offline-banner{
  border:1px solid var(--border);border-radius:12px;padding:10px;background:var(--warning-soft);
  color:var(--text2);font-family:var(--font);font-size:11px;font-weight:800;
}
.mini-tempo button:focus-visible,.mini-tempo input:focus-visible{
  outline:2px solid var(--accent);outline-offset:2px;
}
`;
