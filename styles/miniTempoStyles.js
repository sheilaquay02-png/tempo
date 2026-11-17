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
.tempo-today-money{display:flex;flex-direction:column;gap:12px;margin-top:12px}
.tempo-today-money-value{background:transparent;border:0;text-align:left;color:var(--text,#46342d);display:flex;flex-direction:column;gap:4px;cursor:pointer}
.tempo-today-money-value small{font-size:12px;color:var(--text2,#7a5f54)}
.tempo-today-money-value strong{font-size:24px;font-weight:800}
.tempo-today-record{align-self:flex-start}
.tempo-today-event-open{width:100%;text-align:left;background:transparent;border:0;color:inherit;cursor:pointer;font:inherit}
.tempo-event-spending-plan,.tempo-event-spending-details{border:1px solid var(--border,#eeddd2);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:10px;margin:8px 0}
.tempo-event-spending-toggle{background:transparent;color:var(--text,#46342d);font:inherit;font-weight:800;text-align:left;border:0;cursor:pointer}
.tempo-event-spending-editor{display:grid;grid-template-columns:1fr;gap:8px}
.tempo-event-spending-editor label{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:700}
.tempo-event-spending-editor input,.tempo-event-spending-editor select,.tempo-event-spending-link select{width:100%;border:1px solid var(--border,#eeddd2);padding:9px;border-radius:9px;background:var(--bg2,#fff);color:var(--text,#46342d)}
.tempo-event-spending-editor small,.tempo-event-spending-details small{font-size:11px;color:var(--text2,#7a5f54)}
.tempo-event-spending-numbers{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.tempo-event-spending-numbers>div{border-radius:10px;background:var(--bg3,#fff6f9);display:flex;flex-direction:column;gap:5px;padding:10px}
.tempo-event-spending-numbers strong{font-size:19px}
.tempo-event-linked-row{display:flex;align-items:center;gap:8px;justify-content:space-between}
.tempo-event-linked-row>div{display:flex;flex-direction:column;gap:4px;flex:1}
.tempo-event-linked-row button,.tempo-event-spending-actions button,.tempo-event-spending-link button{border:1px solid var(--border,#eeddd2);padding:8px;border-radius:9px;background:var(--bg2,#fff);color:var(--text,#46342d);font:inherit;cursor:pointer}
.tempo-event-spending-actions{display:flex;gap:8px}
.tempo-event-spending-link{display:flex;gap:8px}
.tempo-mini-error{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);max-width:95vw;padding:12px 16px;border-radius:9px;background:#9c3b49;color:white;z-index:101000}
.tempo-recorder .budget-transaction-popup-overlay{inset:0!important;height:100dvh!important;z-index:100000!important}
.tempo-recorder .budget-transaction-popup-sheet{height:auto!important;max-height:100dvh!important;overflow-y:auto!important}
.tempo-recorder .mini-expense-save-next{flex-shrink:0}
.mini-recorder-hint{padding:16px;color:#997486;text-align:center;font-size:12px}

.mini-conflict-review{border:1px solid #d2a65b;border-radius:10px;padding:10px;color:#74490f;background:#fff4d6;text-align:center;font:inherit;font-size:12px;cursor:pointer}
.tempo-conflict-banner{position:fixed;bottom:92px;right:18px;z-index:9950;border:1px solid #c89b48;border-radius:12px;padding:12px 16px;background:#fff0c3;color:#7a4a12;font:inherit;font-weight:800;cursor:pointer;box-shadow:0 8px 20px #3c2e2330}
.tempo-conflict-overlay{z-index:100500!important;display:flex;align-items:center;justify-content:center;padding:18px}
.tempo-conflict-dialog{width:min(620px,100%);max-height:min(760px,90dvh);overflow:auto;background:var(--bg2,#fffaf7);color:var(--text,#46342d);border-radius:18px;border:1px solid var(--border,#e7d0d6);padding:20px;box-shadow:0 20px 70px #33262c44;display:flex;flex-direction:column;gap:15px}
.tempo-conflict-header{display:flex;align-items:start;justify-content:space-between;gap:12px}
.tempo-conflict-header h2{font-size:19px;margin:0 0 8px}
.tempo-conflict-header p,.tempo-conflict-card p{font-size:12px;color:var(--text2,#78636d);line-height:1.5}
.tempo-conflict-header>button{border:0;background:transparent;padding:8px;cursor:pointer;color:inherit}
.tempo-conflict-card{border:1px solid var(--border,#ead9dd);border-radius:14px;padding:13px;display:flex;flex-direction:column;gap:12px}
.tempo-conflict-versions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.tempo-conflict-versions>div{border-radius:11px;background:var(--bg3,#fff2f6);padding:12px;min-width:0}
.tempo-conflict-versions small{display:block;font-size:11px;color:var(--text2,#78636d)}
.tempo-conflict-tx{display:flex;flex-direction:column;gap:6px;font-size:12px;margin-top:8px;overflow-wrap:anywhere}
.tempo-conflict-deleted{font-size:12px;color:#ad444e}
.tempo-conflict-actions{display:flex;flex-wrap:wrap;gap:7px}
.tempo-conflict-actions button,.tempo-conflict-footer button{border:1px solid var(--border,#d0bbc4);background:var(--bg2,#fff);color:inherit;border-radius:9px;padding:9px 12px;font:inherit;font-size:12px;cursor:pointer}
.tempo-conflict-actions button:disabled,.tempo-conflict-footer button:disabled{opacity:.55}
.tempo-conflict-footer{display:flex;align-items:center;justify-content:space-between;font-size:11px}
@media(max-width:540px){.tempo-conflict-versions{grid-template-columns:1fr}.tempo-conflict-banner{bottom:calc(var(--mobile-nav-h,78px) + 18px);right:12px;left:12px}}

/* V1 global navigation: four primary destinations. Budget's existing pages stay intact. */
.app-mode-switch{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:3px!important;padding:5px!important}
.app-mode-btn{flex-direction:column!important;gap:2px!important;font-size:16px!important;padding:7px 2px!important;min-height:49px!important}
.app-mode-btn .tempo-primary-label{font-size:9px;line-height:1.1;font-weight:800;white-space:nowrap;color:inherit}
.mini-task-undo{flex:0 0 auto!important;width:auto!important;border:1px solid #e6c8d4!important;background:#fff5f8!important;color:#8b4969!important;border-radius:7px;padding:4px 7px!important;font-weight:800!important;font-size:11px!important;text-decoration:none!important}
.mini-offline-banner{border:1px solid #e8c98e;border-radius:10px;padding:9px 10px;background:#fff3da;color:#705124;font-size:11px}
@media(max-width:768px){
  .mobile-nav.tempo-primary-mobile-nav{display:flex!important;grid-template-columns:repeat(4,minmax(0,1fr))!important}
  .mobile-nav.tempo-primary-mobile-nav .mobile-nav-btn{flex:1 1 25%;min-width:0!important}
  .mobile-nav.tempo-primary-mobile-nav .mobile-nav-btn.active{color:var(--accent)!important;background:var(--bg3)!important}
  .mobile-nav.tempo-primary-mobile-nav .mobile-nav-btn.active span{color:var(--accent)!important}
  .tempo-mobile-menu-trigger{position:fixed;left:10px;bottom:calc(var(--mobile-nav-h,86px) + 9px);display:flex;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:12px;background:var(--surface,#fff);color:var(--text);font:inherit;font-size:11px;font-weight:850;padding:10px;min-height:40px;z-index:111;box-shadow:0 3px 10px rgba(40,20,30,.12)}
  .tempo-budget-subnav{position:fixed;left:89px;right:9px;bottom:calc(var(--mobile-nav-h,86px) + 9px);display:flex;gap:5px;overflow-x:auto;padding:4px;border-radius:12px;background:var(--bg2,#fff);border:1px solid var(--border);z-index:111;scrollbar-width:thin}
  .tempo-budget-subnav-btn{white-space:nowrap;flex:0 0 auto;border:0;border-radius:8px;padding:8px 9px;background:transparent;color:var(--text2);font-size:11px;font-family:inherit;font-weight:750}
  .tempo-budget-subnav-btn.active{background:var(--bg3,#fff3f7);color:var(--accent)}
}
@media(min-width:769px){.tempo-mobile-menu-trigger,.tempo-budget-subnav{display:none}}

`;
