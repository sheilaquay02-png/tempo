// Applies only to the Windows mini/recorder surfaces and the opt-in Quick Add controls.
export const miniTempoCSS = `
.tempo-quick-add{position:fixed;right:24px;bottom:24px;z-index:8000;display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.tempo-quick-add-fab{border:none;border-radius:50%;width:54px;height:54px;color:white;font-size:30px;font-weight:700;background:var(--accent,#D989A2);box-shadow:0 5px 20px rgba(40,20,30,.2);cursor:pointer}
.tempo-quick-add-menu{display:flex;flex-direction:column;gap:4px;background:var(--bg2,#fff);border:1px solid var(--border,#ead8d2);padding:8px;border-radius:16px;box-shadow:0 8px 25px rgba(30,20,30,.15);min-width:160px}
.tempo-quick-add-menu button{border:0;background:none;padding:10px;text-align:left;cursor:pointer;color:var(--text,#46342d);font:inherit}
.tempo-quick-add-menu button:hover{background:var(--bg3,#f9eff3);border-radius:8px}
.mini-expense-save-next{width:100%;margin:8px 0 0;border:1px solid var(--border,#ead8d2);border-radius:10px;background:var(--bg3,#fff6f9);padding:9px;font:inherit;cursor:pointer;color:var(--text,#46342d)}
.mini-expense-save-next:disabled{opacity:.55}
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
.mini-event small,.mini-event span{font-size:10px;color:#92737c}.mini-event strong{font-size:12px}
.mini-empty{font-size:12px;color:#9b7c86;margin:0}
.mini-spent{text-align:left;font-size:23px;font-weight:800;border:0;background:transparent;color:#46342d;cursor:pointer}
.mini-expense-action{border:0;border-radius:12px;padding:12px;background:#d989a2;color:white;font-weight:800;cursor:pointer}
.mini-quick-toggle{border:1px solid #efdee3;background:#fff;border-radius:10px;padding:8px;color:#7b5262;font-weight:700;cursor:pointer}
.mini-quick-menu{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}
.mini-quick-menu button{border:1px solid #efdde3;border-radius:10px;background:#fff;padding:8px 3px;font:inherit;font-size:11px}
.mini-footer{display:flex;justify-content:space-between;gap:6px;margin-top:2px}
.mini-footer button{border:0;background:transparent;color:#876a74;font-size:11px;cursor:pointer}
.mini-sync-saved{color:#488b69!important}.mini-sync-pending{color:#bd7746!important}
.mini-recorder-shell{min-height:100dvh;padding:12px;background:#fff5f6}
.mini-recorder-shell .budget-transaction-popup-overlay{inset:0!important;height:100dvh!important;z-index:100!important}
.mini-recorder-shell .budget-transaction-popup-sheet{max-height:100dvh!important;overflow-y:auto!important}
@media(max-width:768px){.tempo-quick-add{bottom:calc(var(--mobile-nav-h,78px) + 18px);right:18px}.tempo-quick-add-fab{width:48px;height:48px}}
`;
