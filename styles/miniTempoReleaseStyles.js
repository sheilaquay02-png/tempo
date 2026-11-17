// Scoped presentation for Mini Tempo's task-and-calendar companion only.
// No financial, budget, recorder, or global Full Tempo styles.
export const miniTempoCSS = `
.mini-tempo{height:100dvh;min-height:0;overflow:auto;color:#46342d;background:#fffaf7;font-family:Nunito,system-ui,sans-serif}
.mini-tempo-header{padding:14px 18px;background:#f9e3e8;display:flex;align-items:center;justify-content:space-between}
.mini-tempo-drag{-webkit-app-region:drag;display:flex;flex-direction:column;gap:2px;flex:1}
.mini-tempo-drag strong{font-size:15px}.mini-tempo-drag small{font-size:10px;color:#8d6873}
.mini-tempo-title-actions{display:flex;align-items:center;gap:4px;-webkit-app-region:no-drag}
.mini-tempo-title-actions button{border:0;background:transparent;color:#6f5360;padding:5px 8px;cursor:pointer}
.mini-tempo-body{padding:14px 18px 18px;display:flex;flex-direction:column;gap:11px}
.mini-tempo h1{font-size:20px;line-height:1.25;margin:0}
.mini-tempo-subtitle{color:#946f80;font-size:11px;margin:-8px 0 2px}
.mini-section{border:1px solid #efdfe1;background:#fff;border-radius:14px;padding:11px 12px;display:flex;flex-direction:column;gap:9px}
.mini-section-head{display:flex;justify-content:space-between;align-items:center;font-size:13px}
.mini-section-head button{border:0;background:transparent;color:#9b7382;font:inherit;font-size:11px;cursor:pointer}
.mini-task{display:flex;gap:9px;align-items:center;min-height:25px}
.mini-task input{accent-color:#D989A2;width:15px;height:15px}
.mini-task button{padding:0;flex:1;text-align:left;border:0;background:transparent;color:inherit;font-size:12px;cursor:pointer}
.mini-task button.mini-task-done{text-decoration:line-through;color:#a89c9b}
.mini-task-add{display:flex;gap:5px}
.mini-task-add input{min-width:0;flex:1;border:0;border-bottom:1px solid #ead6da;font:inherit;font-size:12px;padding:7px 2px;outline:none}
.mini-task-add button{border:0;background:#f7e4e9;border-radius:7px;padding:5px 9px;color:#704455;font:inherit;font-size:11px}
.mini-event{text-align:left;display:flex;flex-direction:column;gap:3px;border:0;border-radius:10px;background:#fbf1f2;padding:11px;color:#46342d;cursor:pointer}
.mini-empty{font-size:12px;color:#9b7c86;margin:0}
.mini-quick-toggle{border:1px solid #efdee3;background:#fff;border-radius:10px;padding:8px;color:#7b5262;font-weight:700;cursor:pointer}
.mini-quick-menu{display:grid;grid-template-columns:repeat(2,1fr);gap:4px}
.mini-quick-menu button{border:1px solid #efdde3;border-radius:10px;background:#fff;padding:8px 3px;font:inherit;font-size:11px}
.mini-footer{display:flex;justify-content:space-between;gap:6px;margin-top:2px}
.mini-footer button{border:0;background:transparent;color:#876a74;font-size:11px;cursor:pointer}
.mini-task-undo{flex:0 0 auto!important;width:auto!important;border:1px solid #e6c8d4!important;background:#fff5f8!important;color:#8b4969!important;border-radius:7px;padding:4px 7px!important;font-weight:800!important;font-size:11px!important;text-decoration:none!important}
.mini-offline-banner{border:1px solid #e8c98e;border-radius:10px;padding:9px 10px;background:#fff3da;color:#705124;font-size:11px}
`;
