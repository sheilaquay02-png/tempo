/* ── Phase 146 final mobile footer/popup safety layer ──────────────────────
   This file is intentionally composed AFTER tempoStyles.js and the extracted
   TempoApp legacy CSS. Keep Budget footer + popup guarantees here so older
   hotfix blocks cannot override them from TempoApp.jsx again. */
export const tempoMobileFooterPopupSafetyCSS = `
@media(max-width:768px){
  :root{
    --tempo-footer-h:var(--mobile-nav-h,calc(74px + env(safe-area-inset-bottom,0px)));
    --tempo-footer-gap:18px;
    --tempo-footer-clearance:calc(var(--tempo-footer-h) + var(--tempo-footer-gap));
  }

  .budget-page.budget-page-home.phase-page{
    height:100%!important;
    min-height:0!important;
    max-height:100%!important;
    overflow-y:auto!important;
    -webkit-overflow-scrolling:touch!important;
    overscroll-behavior-y:contain!important;
    padding-bottom:calc(var(--tempo-footer-clearance) + 104px)!important;
    scroll-padding-bottom:calc(var(--tempo-footer-clearance) + 104px)!important;
  }
  .budget-page.budget-page-home.phase-page::after{
    content:""!important;
    display:block!important;
    flex:0 0 72px!important;
    min-height:72px!important;
    pointer-events:none!important;
  }
  .budget-page.budget-page-home.phase-page > *:last-child{
    margin-bottom:0!important;
  }

  .budget-transaction-popup-overlay,
  .budget-card-editor-overlay{
    position:fixed!important;
    z-index:60000!important;
    inset:0 0 var(--tempo-footer-h) 0!important;
    width:100vw!important;
    height:calc(100dvh - var(--tempo-footer-h))!important;
    min-height:0!important;
    padding:calc(env(safe-area-inset-top,0px) + 6px) 0 0!important;
    display:flex!important;
    align-items:flex-end!important;
    justify-content:center!important;
    overflow:hidden!important;
    pointer-events:auto!important;
    isolation:isolate!important;
  }

  .budget-transaction-popup-backdrop{
    position:absolute!important;
    inset:0!important;
    z-index:0!important;
  }

  .budget-transaction-popup-sheet{
    z-index:1!important;
    width:100%!important;
    max-width:100%!important;
    height:auto!important;
    max-height:calc(100dvh - var(--tempo-footer-h) - env(safe-area-inset-top,0px) - 6px)!important;
    min-height:0!important;
    overflow:hidden!important;
    display:flex!important;
    flex-direction:column!important;
    border-radius:28px 28px 0 0!important;
    padding:10px 12px 10px!important;
    box-sizing:border-box!important;
  }

  .budget-transaction-popup-card{
    display:flex!important;
    flex:0 1 auto!important;
    flex-direction:column!important;
    min-height:0!important;
    overflow:visible!important;
    gap:5px!important;
    padding:0!important;
    border:0!important;
    box-shadow:none!important;
    background:transparent!important;
  }

  .budget-popup-header{
    position:relative!important;
    top:auto!important;
    flex:0 0 auto!important;
    margin:0 0 5px!important;
    padding:0 0 5px!important;
  }
  .budget-popup-header button,
  .budget-popup-header span{
    width:36px!important;
    height:36px!important;
    min-height:36px!important;
  }
  .budget-popup-header strong{
    font-size:20px!important;
    line-height:1.05!important;
  }

  .budget-transaction-popup-card .budget-transaction-type-tabs{
    order:1!important;
    width:100%!important;
    margin:0!important;
    gap:4px!important;
    padding:4px!important;
    border-radius:18px!important;
  }
  .budget-transaction-popup-card .budget-transaction-type-tabs button{
    min-height:31px!important;
    padding:3px 4px!important;
    font-size:10px!important;
    line-height:1!important;
  }
  .budget-transaction-popup-card .budget-transaction-type-tabs button span{
    width:19px!important;
    height:19px!important;
  }

  .budget-transaction-popup-card .budget-amount-stage{
    order:2!important;
    min-height:76px!important;
    gap:1px!important;
    padding:4px 0!important;
  }
  .budget-transaction-popup-card .budget-amount-stage span,
  .budget-transaction-popup-card .budget-amount-stage small{
    font-size:11px!important;
    letter-spacing:.08em!important;
  }
  .budget-transaction-popup-card .budget-amount-stage input{
    font-size:40px!important;
    line-height:.95!important;
  }

  .budget-popup-progress,
  .budget-popup-chip-row{
    display:none!important;
  }

  .budget-popup-tool-row{
    order:10!important;
    margin:0 -12px 2px!important;
    padding:4px 2px!important;
    grid-template-columns:repeat(6,minmax(0,1fr))!important;
  }
  .budget-popup-tool-row button{
    min-height:31px!important;
    font-size:13px!important;
  }
  .budget-popup-tool-row button > span{
    font-size:8px!important;
    line-height:1.05!important;
  }

  .budget-popup-editor-panel{
    order:15!important;
    padding:7px!important;
    gap:5px!important;
  }
  .budget-popup-editor-panel .budget-notes{
    min-height:44px!important;
  }

  .budget-transaction-popup-card .budget-transaction-form-grid{
    order:20!important;
    display:grid!important;
    grid-template-columns:1fr 1fr!important;
    gap:5px!important;
    align-items:end!important;
    flex:0 0 auto!important;
  }
  .budget-transaction-popup-card .budget-transaction-form-grid label{
    gap:2px!important;
    min-width:0!important;
  }
  .budget-transaction-popup-card .budget-field-label{
    font-size:9px!important;
    letter-spacing:.07em!important;
    line-height:1.05!important;
  }
  .budget-transaction-popup-card .budget-input{
    min-height:31px!important;
    height:31px!important;
    padding:4px 8px!important;
    border-radius:12px!important;
    font-size:10px!important;
    line-height:1.15!important;
  }

  .budget-popup-keypad{
    position:static!important;
    order:30!important;
    z-index:1!important;
    flex:0 0 auto!important;
    margin:4px 0 0!important;
    padding:0!important;
    display:grid!important;
    grid-template-columns:repeat(4,minmax(0,1fr))!important;
    gap:4px!important;
    background:transparent!important;
    box-shadow:none!important;
    transform:none!important;
  }
  .budget-popup-keypad button{
    min-height:40px!important;
    border-radius:8px!important;
    font-size:19px!important;
    line-height:1!important;
  }
  .budget-popup-keypad button.currency{
    font-size:16px!important;
  }
  .budget-popup-keypad button.confirm{
    font-size:29px!important;
  }

  .budget-card-editor-overlay{
    padding:calc(env(safe-area-inset-top,0px) + 8px) 0 0!important;
  }
  .budget-card-editor-sheet{
    z-index:1!important;
    width:100%!important;
    max-width:100%!important;
    max-height:calc(100dvh - var(--tempo-footer-h) - env(safe-area-inset-top,0px) - 8px)!important;
    min-height:0!important;
    overflow-y:auto!important;
    -webkit-overflow-scrolling:touch!important;
    overscroll-behavior:contain!important;
    border-radius:28px 28px 0 0!important;
    padding:12px 14px 0!important;
    box-sizing:border-box!important;
  }
  .budget-card-editor-grid{
    grid-template-columns:1fr!important;
    gap:8px!important;
  }
  .budget-card-editor-sheet .budget-input{
    min-height:40px!important;
    padding:8px 10px!important;
  }
  .budget-card-editor-sheet .budget-notes{
    min-height:58px!important;
    margin-top:8px!important;
  }
  .budget-card-editor-actions{
    position:sticky!important;
    bottom:0!important;
    z-index:2!important;
    margin:10px -14px 0!important;
    padding:10px 14px calc(14px + env(safe-area-inset-bottom,0px))!important;
    background:linear-gradient(180deg,rgba(255,255,255,.70),var(--surface) 38%)!important;
    border-top:1px solid rgba(var(--accent-rgb),.12)!important;
  }
  .dark .budget-card-editor-actions{
    background:linear-gradient(180deg,rgba(35,19,41,.76),var(--dark-surface) 38%)!important;
  }
}

@media(max-width:768px) and (max-height:760px){
  .budget-transaction-popup-card{
    gap:4px!important;
  }
  .budget-transaction-popup-card .budget-amount-stage{
    min-height:62px!important;
  }
  .budget-transaction-popup-card .budget-amount-stage input{
    font-size:34px!important;
  }
  .budget-popup-tool-row button{
    min-height:28px!important;
  }
  .budget-transaction-popup-card .budget-input{
    min-height:28px!important;
    height:28px!important;
  }
  .budget-popup-keypad button{
    min-height:34px!important;
  }
}
`;
