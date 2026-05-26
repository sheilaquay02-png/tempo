"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import * as Core from "../../lib/tempo/core";
import {
  JOURNAL_DECORATION_HISTORY_LIMIT,
  makeScrapbookItem,
  normalizeScrapbookBlocksForSave,
  scrapbookClamp,
  scrapbookItemLabel,
  scrapbookItemLayout,
  scrapbookItemType,
  scrapbookNumber,
  scrapbookStickerFlipStyle,
  scrapbookTextFitStyle,
} from "../../lib/tempo/client/journalDecorationModel";
import {
  allMemoryPhotoStoragePaths,
  deleteMemoryStoragePathsDetailed,
  memoryPhotoNeedsStorageMigration,
  signMemoryImagePath,
  uploadMemoryDataUrlToStorage,
  uploadMemoryImageToStorage,
} from "../auth/LoginScreen";

const {
  uid,
  TODAY,
  PRIORITIES,
  formatWithDisplayTimezone,
  dateKey,
  addDaysSafe,
  addMonthsSafe,
  localDateFromKey,
  formatTaskDuration,
  completedTasksForDateKey,
  dailyGameSummary,
  hasJournalEntryForKey,
  JOURNAL_MOODS,
  JOURNAL_ACTIVITIES,
  JOURNAL_PROMPTS,
  DAILY_CHECKIN_MOODS,
  DAILY_CHECKIN_ENERGIES,
  normalizeDailyCheckIns,
  dailyCheckInForDate,
  normalizeTomorrowResets,
  tomorrowResetForDate,
  normalizeWeeklyResets,
  weeklyResetForDate,
  MEMORY_TAGS,
  MEMORY_IMAGE_LIMIT_PER_ENTRY,
  MEMORY_BACKGROUNDS,
  COZY_STICKER_PACK,
  memoryBackgroundById,
  memoryBackgroundStyle,
  normalizeMemoryEntry,
  sanitizeMemoryPhotoForStorage,
  memoryPhotoSrc,
  memoryEntryCover,
  memoryTagLabel,
  prepareJournalPhotosFromFiles,
} = Core;

function JournalDecorationCanvas({ blocks = [], setBlocks, selectedBlockId, setSelectedBlockId, editing = false, onHistoryCheckpoint }) {
  const decorationCanvasRef = useRef(null);
  const decorationDragRef = useRef(null);
  const lastTapRef = useRef({ id: null, at: 0 });
  const [quickMenuBlockId, setQuickMenuBlockId] = useState(null);
  const [boardMetrics, setBoardMetrics] = useState({ width: 1, height: 1 });
  const normalizedBlocks = normalizeScrapbookBlocksForSave(blocks);
  const selectedBlock = normalizedBlocks.find(b => b.id === selectedBlockId) || null;
  const canEdit = Boolean(editing && setBlocks && setSelectedBlockId);

  function decorationBoardRect() {
    const board = decorationCanvasRef.current;
    const rect = board?.getBoundingClientRect?.() || { left: 0, top: 0, width: 1, height: 1 };
    return {
      left: rect.left || 0,
      top: rect.top || 0,
      width: Math.max(1, boardMetrics.width || rect.width || 1),
      height: Math.max(1, boardMetrics.height || rect.height || 1),
    };
  }
  function decorationLayoutToPx(item = {}, layout = {}, rect = decorationBoardRect()) {
    const hasPxLayout = [item?.xPx, item?.yPx, item?.wPx, item?.hPx].every(v => Number.isFinite(Number(v)));
    if (hasPxLayout) {
      const baseW = Math.max(1, Number(item.boardW || item.boardWidth || 560));
      const baseH = Math.max(1, Number(item.boardH || item.boardHeight || baseW));
      const sx = Math.max(0.2, Math.min(2.5, rect.width / baseW));
      const sy = Number.isFinite(Number(item.boardH || item.boardHeight)) ? Math.max(0.2, Math.min(2.5, rect.height / baseH)) : sx;
      return {
        x: Number(item.xPx) * sx,
        y: Number(item.yPx) * sy,
        w: Math.max(24, Number(item.wPx) * sx),
        h: Math.max(24, Number(item.hPx) * sy),
        rotate: scrapbookNumber(item.rotate, layout.rotate || 0),
        scaleX: sx,
        scaleY: sy,
      };
    }
    return {
      x: (scrapbookNumber(layout.x, 0) / 100) * Math.max(1, rect.width),
      y: (scrapbookNumber(layout.y, 0) / 100) * Math.max(1, rect.height),
      w: (scrapbookNumber(layout.w, 18) / 100) * Math.max(1, rect.width),
      h: (scrapbookNumber(layout.h, 14) / 100) * Math.max(1, rect.height),
      rotate: scrapbookNumber(layout.rotate, 0),
    };
  }
  function decorationStyleForItem(item = {}, layout = {}, idx = 0) {
    const hasPxLayout = [item?.xPx, item?.yPx, item?.wPx, item?.hPx].every(v => Number.isFinite(Number(v)));
    const base = {
      transform: `rotate(${layout.rotate}deg)`,
      zIndex:(layout.z || idx + 1) + (selectedBlock?.id === item.id && canEdit ? 300 : 0),
      "--decoration-rotate": `${layout.rotate}deg`,
    };
    if (hasPxLayout) {
      const baseW = Math.max(1, Number(item.boardW || item.boardWidth || 560));
      const baseH = Math.max(1, Number(item.boardH || item.boardHeight || baseW));
      const sx = Math.max(0.2, Math.min(2.5, (boardMetrics.width || baseW) / baseW));
      const sy = Number.isFinite(Number(item.boardH || item.boardHeight)) ? Math.max(0.2, Math.min(2.5, (boardMetrics.height || baseH) / baseH)) : sx;
      return {
        ...base,
        left:`${Number(item.xPx) * sx}px`,
        top:`${Number(item.yPx) * sy}px`,
        width:`${Math.max(24, Number(item.wPx) * sx)}px`,
        height:`${Math.max(24, Number(item.hPx) * sy)}px`,
      };
    }
    return {
      ...base,
      left:`${layout.x}%`,
      top:`${layout.y}%`,
      width:`${layout.w}%`,
      height:`${layout.h}%`,
    };
  }

  useEffect(() => {
    const board = decorationCanvasRef.current;
    if (!board) return;
    const content = board.parentElement || board;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = content.getBoundingClientRect?.() || board.getBoundingClientRect?.() || { width: 1, height: 1 };
        const width = Math.max(1, Math.round((content.scrollWidth || content.offsetWidth || rect.width || 1) * 10) / 10);
        const height = Math.max(1, Math.round((content.scrollHeight || content.offsetHeight || rect.height || 1) * 10) / 10);
        setBoardMetrics(prev => (Math.abs(prev.width - width) > 1 || Math.abs(prev.height - height) > 1) ? { width, height } : prev);
      });
    };
    measure();
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    resizeObserver?.observe(content);
    resizeObserver?.observe(board);
    window.addEventListener("resize", measure);
    const interval = window.setInterval(measure, 800);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect?.();
      window.removeEventListener("resize", measure);
      window.clearInterval(interval);
    };
  }, [normalizedBlocks.length, canEdit]);

  useEffect(() => {
    if (!selectedBlockId) setQuickMenuBlockId(null);
  }, [selectedBlockId]);

  useEffect(() => {
    if (!canEdit || !setBlocks) return;
    const board = decorationCanvasRef.current;
    const rect = board?.getBoundingClientRect?.();
    if (!rect || rect.width < 20 || rect.height < 20) return;
    setBlocks(bs => {
      let changed = false;
      const next = (Array.isArray(bs) ? bs : []).map((b, idx) => {
        const hasPxLayout = [b?.xPx, b?.yPx, b?.wPx, b?.hPx].every(v => Number.isFinite(Number(v)));
        if (hasPxLayout) return b;
        const type = scrapbookItemType(b);
        if (!type) return b;
        const layout = scrapbookItemLayout({ ...b, type }, idx);
        changed = true;
        return {
          ...b,
          coord: "px",
          xPx: Math.round(((layout.x / 100) * rect.width) * 10) / 10,
          yPx: Math.round(((layout.y / 100) * rect.height) * 10) / 10,
          wPx: Math.max(28, Math.round(((layout.w / 100) * rect.width) * 10) / 10),
          hPx: Math.max(28, Math.round(((layout.h / 100) * rect.height) * 10) / 10),
          boardW: Math.max(1, Math.round(rect.width * 10) / 10),
          boardH: Math.max(1, Math.round(rect.height * 10) / 10),
        };
      });
      return changed ? next : bs;
    });
  }, [canEdit, setBlocks, normalizedBlocks.length]);

  function patchDecoration(id, patch) {
    if (!canEdit) return;
    setBlocks(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b));
  }
  function updateDecorationText(id, text) {
    if (!canEdit) return;
    onHistoryCheckpoint?.();
    setBlocks(bs => bs.map((b, idx) => {
      if (b.id !== id) return b;
      const type = scrapbookItemType(b);
      const layout = scrapbookItemLayout(b, idx);
      const cleanText = String(text || "");
      const charsPerLine = Math.max(10, Math.floor(layout.w * 1.35));
      const estimatedLines = cleanText.split(/\n/).reduce((sum, line) => sum + Math.max(1, Math.ceil((line.length || 1) / charsPerLine)), 0);
      const neededH = 10 + estimatedLines * 4.2;
      const nextH = scrapbookClamp(Math.max(layout.h, neededH), 8, 82);
      return { ...b, type, text: cleanText, h: nextH, y: scrapbookClamp(layout.y, -8, 112 - nextH) };
    }));
  }
  function layerDecoration(id, dir) {
    if (!canEdit) return;
    onHistoryCheckpoint?.();
    setBlocks(bs => {
      const current = normalizeScrapbookBlocksForSave(bs);
      const zValues = current.map((b, idx) => scrapbookItemLayout(b, idx).z || idx + 1);
      const currentMax = Math.max(1, ...zValues);
      const currentMin = Math.min(1, ...zValues);
      return bs.map((b, idx) => {
        if (b.id !== id) return b;
        const layout = scrapbookItemLayout(b, idx);
        return { ...b, z: dir > 0 ? currentMax + 1 : currentMin - 1 };
      });
    });
  }
  function duplicateDecoration(id) {
    if (!canEdit) return;
    onHistoryCheckpoint?.();
    const sourceIndex = normalizedBlocks.findIndex(b => b.id === id);
    if (sourceIndex < 0) return;
    const source = normalizedBlocks[sourceIndex];
    const layout = scrapbookItemLayout(source, sourceIndex);
    const hasPxLayout = [source?.xPx, source?.yPx, source?.wPx, source?.hPx].every(v => Number.isFinite(Number(v)));
    const copy = {
      ...source,
      id: `b${uid()}`,
      x: scrapbookClamp(layout.x + 4, -12, 104),
      y: scrapbookClamp(layout.y + 4, -8, 104),
      ...(hasPxLayout ? {
        coord: "px",
        xPx: Number(source.xPx) + 18,
        yPx: Number(source.yPx) + 18,
        boardW: source.boardW || boardMetrics.width || 560,
        boardH: source.boardH || boardMetrics.height || 560,
      } : {}),
      z: Math.max(1, ...normalizedBlocks.map((b, idx) => scrapbookItemLayout(b, idx).z || idx + 1)) + 1,
    };
    setBlocks(bs => [...bs, copy]);
    setSelectedBlockId(copy.id);
    setQuickMenuBlockId(copy.id);
  }
  function removeDecoration(id) {
    if (!canEdit) return;
    onHistoryCheckpoint?.();
    setBlocks(bs => bs.filter(b => b.id !== id));
    setSelectedBlockId(current => current === id ? null : current);
    setQuickMenuBlockId(null);
  }
  function toggleFlip(id, axis) {
    if (!canEdit) return;
    onHistoryCheckpoint?.();
    const source = normalizedBlocks.find(b => b.id === id);
    const key = axis === "y" ? "flipY" : "flipX";
    patchDecoration(id, { [key]: !Boolean(source?.[key]) });
  }
  function editTapeText(id) {
    if (!canEdit || typeof window === "undefined") return;
    const source = normalizedBlocks.find(b => b.id === id);
    const next = window.prompt("Text on tape", source?.text || "");
    if (next === null) return;
    updateDecorationText(id, next);
  }
  function beginDecorationPointer(blockId, mode, layout, e) {
    if (!canEdit) return;
    if (e.target?.closest?.("textarea,button")) return;
    onHistoryCheckpoint?.();
    e.preventDefault();
    e.stopPropagation();
    setSelectedBlockId(blockId);
    if (mode === "move") {
      const now = Date.now();
      const last = lastTapRef.current;
      if (last.id === blockId && now - last.at < 360) {
        setQuickMenuBlockId(blockId);
        lastTapRef.current = { id: null, at: 0 };
      } else {
        setQuickMenuBlockId(null);
        lastTapRef.current = { id: blockId, at: now };
      }
    } else {
      setQuickMenuBlockId(null);
    }
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const board = decorationCanvasRef.current;
    const rect = board?.getBoundingClientRect?.();
    const sourceBlock = normalizedBlocks.find(b => b.id === blockId) || {};
    const pxLayout = decorationLayoutToPx(sourceBlock, layout, rect);
    const cx = rect ? rect.left + pxLayout.x + pxLayout.w / 2 : e.clientX;
    const cy = rect ? rect.top + pxLayout.y + pxLayout.h / 2 : e.clientY;
    const startDistance = Math.max(12, Math.hypot(e.clientX - cx, e.clientY - cy));
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
    decorationDragRef.current = { blockId, mode, layout, pxLayout, startX: e.clientX, startY: e.clientY, centerX: cx, centerY: cy, startDistance, startAngle, moved: false };
  }
  function moveDecorationPointer(e) {
    const drag = decorationDragRef.current;
    const board = decorationCanvasRef.current;
    if (!canEdit || !drag || !board) return;
    e.preventDefault();
    const rect = board.getBoundingClientRect();
    const dxPx = e.clientX - drag.startX;
    const dyPx = e.clientY - drag.startY;
    if (Math.hypot(dxPx, dyPx) > 3) drag.moved = true;
    const maxW = Math.max(1, rect.width);
    const maxH = Math.max(1, rect.height);
    const edgePad = Math.max(48, maxW * 0.12);
    if (drag.mode === "transform") {
      const distance = Math.max(12, Math.hypot(e.clientX - drag.centerX, e.clientY - drag.centerY));
      const ratio = scrapbookClamp(distance / Math.max(12, drag.startDistance), .35, 3.2);
      const angle = Math.atan2(e.clientY - drag.centerY, e.clientX - drag.centerX);
      const rotate = scrapbookClamp(drag.pxLayout.rotate + ((angle - drag.startAngle) * 180 / Math.PI), -180, 180);
      const nextW = scrapbookClamp(Math.round((drag.pxLayout.w * ratio) * 10) / 10, 28, maxW * 1.6);
      const nextH = scrapbookClamp(Math.round((drag.pxLayout.h * ratio) * 10) / 10, 28, maxH * 0.9);
      const centerXPx = drag.pxLayout.x + drag.pxLayout.w / 2;
      const centerYPx = drag.pxLayout.y + drag.pxLayout.h / 2;
      patchDecoration(drag.blockId, {
        coord: "px",
        wPx: nextW,
        hPx: nextH,
        xPx: scrapbookClamp(Math.round((centerXPx - nextW / 2) * 10) / 10, -edgePad, maxW - nextW + edgePad),
        yPx: scrapbookClamp(Math.round((centerYPx - nextH / 2) * 10) / 10, -edgePad, maxH - nextH + edgePad),
        rotate: Math.round(rotate * 10) / 10,
        boardW: Math.max(1, Math.round(maxW * 10) / 10),
        boardH: Math.max(1, Math.round(maxH * 10) / 10),
      });
    } else {
      patchDecoration(drag.blockId, {
        coord: "px",
        xPx: scrapbookClamp(Math.round((drag.pxLayout.x + dxPx) * 10) / 10, -edgePad, maxW - drag.pxLayout.w + edgePad),
        yPx: scrapbookClamp(Math.round((drag.pxLayout.y + dyPx) * 10) / 10, -edgePad, maxH - drag.pxLayout.h + edgePad),
        wPx: Math.max(24, Math.round(drag.pxLayout.w * 10) / 10),
        hPx: Math.max(24, Math.round(drag.pxLayout.h * 10) / 10),
        boardW: Math.max(1, Math.round(maxW * 10) / 10),
        boardH: Math.max(1, Math.round(maxH * 10) / 10),
      });
    }
  }
  function endDecorationPointer() { decorationDragRef.current = null; }
  function handleDecorationClick(blockId, e) {
    if (!canEdit) return;
    e.stopPropagation();
    setSelectedBlockId(blockId);
    const now = Date.now();
    const last = lastTapRef.current;
    if (e.detail >= 2 || (last.id === blockId && now - last.at < 360)) {
      setQuickMenuBlockId(blockId);
      lastTapRef.current = { id: null, at: 0 };
    } else {
      setQuickMenuBlockId(current => current === blockId ? current : null);
      lastTapRef.current = { id: blockId, at: now };
    }
  }

  if (!normalizedBlocks.length && !canEdit) return null;
  return (
    <div
      ref={decorationCanvasRef}
      className={`journal-decoration-layer journal-view-decoration-layer ${canEdit ? "journal-decoration-editing" : ""}`}
      style={{ width: `${boardMetrics.width}px`, height: `${boardMetrics.height}px`, minHeight: `${boardMetrics.height}px` }}
      aria-hidden={!canEdit}
      onPointerLeave={endDecorationPointer}
      onPointerMove={canEdit ? moveDecorationPointer : undefined}
      onPointerUp={canEdit ? endDecorationPointer : undefined}
      onPointerCancel={canEdit ? endDecorationPointer : undefined}
      onClick={canEdit ? e => { if (e.target === e.currentTarget) { setQuickMenuBlockId(null); setSelectedBlockId(null); } } : undefined}
    >
      {normalizedBlocks.map((b, idx) => {
        const type = scrapbookItemType(b);
        if (!type) return null;
        const layout = scrapbookItemLayout(b, idx);
        const selected = selectedBlock?.id === b.id;
        const quickOpen = canEdit && quickMenuBlockId === b.id;
        const textFitStyle = scrapbookTextFitStyle(b, layout, type);
        const flipStyle = scrapbookStickerFlipStyle(b);
        const style = decorationStyleForItem(b, layout, idx);
        return (
          <div
            key={b.id}
            className={`scrapbook-view-item journal-decoration-item scrapbook-${type} ${selected ? "selected" : ""} ${canEdit ? "story-editable" : ""}`}
            style={style}
            onPointerDown={canEdit ? e => beginDecorationPointer(b.id, "move", layout, e) : undefined}
            onPointerMove={canEdit ? moveDecorationPointer : undefined}
            onPointerUp={canEdit ? endDecorationPointer : undefined}
            onPointerCancel={canEdit ? endDecorationPointer : undefined}
            onClick={canEdit ? e => handleDecorationClick(b.id, e) : undefined}
            onDoubleClick={canEdit ? e => { e.stopPropagation(); setSelectedBlockId(b.id); setQuickMenuBlockId(b.id); } : undefined}
          >
            {quickOpen && (
              <div className="decoration-quick-menu" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                <button type="button" onClick={() => toggleFlip(b.id, "x")}>Flip H</button>
                <button type="button" onClick={() => toggleFlip(b.id, "y")}>Flip V</button>
                {type === "tape" && <button type="button" onClick={() => editTapeText(b.id)}>Text</button>}
                <button type="button" onClick={() => layerDecoration(b.id, 1)}>Front</button>
                <button type="button" onClick={() => layerDecoration(b.id, -1)}>Back</button>
                <button type="button" onClick={() => duplicateDecoration(b.id)}>Copy</button>
                <button type="button" className="danger" onClick={() => removeDecoration(b.id)}>Delete</button>
              </div>
            )}
            {type === "tape" && <div className="scrapbook-view-text" style={{ ...textFitStyle, ...flipStyle }}>{b.text || ""}</div>}
            {type === "sticker" && (
              <div className={canEdit ? "scrapbook-canvas-sticker" : "scrapbook-view-sticker"} style={flipStyle}>
                {b.stickerAsset ? <img src={b.stickerAsset} alt={b.sticker || "Sticker"}/> : <span>{b.sticker || "🌸"}</span>}
              </div>
            )}
            {canEdit && selected && <span className="story-transform-handle" title="Drag to resize and rotate" onPointerDown={e => beginDecorationPointer(b.id, "transform", layout, e)} />}
          </div>
        );
      })}
    </div>
  );
}

function JournalDecorationControls({ blocks = [], setBlocks, selectedBlockId, setSelectedBlockId, onSave, onCancel, saving = false, onHistoryCheckpoint, canUndo = false, canRedo = false, onUndo, onRedo }) {
  const stickerPacks = Core.MEMORY_STICKER_PACKS || [{ id: "cozy", label: "Cozy", stickers: COZY_STICKER_PACK }];
  const normalizedBlocks = normalizeScrapbookBlocksForSave(blocks);
  const selectedBlock = normalizedBlocks.find(b => b.id === selectedBlockId) || null;
  const [activeStickerPackId, setActiveStickerPackId] = useState(stickerPacks.find(p => p.id === "sugar")?.id || stickerPacks[0]?.id || "cozy");
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetSwipeRef = useRef(null);
  const sheetClickBlockRef = useRef(0);

  function finishSheetSwipe(start, endY) {
    if (!start) return;
    const dy = endY - start.y;
    if (dy < -14) {
      setSheetOpen(true);
      sheetClickBlockRef.current = Date.now();
    } else if (dy > 14) {
      setSheetOpen(false);
      sheetClickBlockRef.current = Date.now();
    }
  }
  function startSheetSwipe(e) {
    if (e.target?.closest?.(".journal-decoration-sheet-content button,.journal-decoration-sheet-content input,.journal-decoration-sheet-content textarea,.journal-decoration-sheet-content select")) return;
    e.preventDefault();
    e.stopPropagation();
    const start = { y: e.clientY, moved: false, lastY: e.clientY };
    sheetSwipeRef.current = start;
    e.currentTarget?.setPointerCapture?.(e.pointerId);
    const onMove = evt => {
      if (!sheetSwipeRef.current) return;
      const dy = evt.clientY - sheetSwipeRef.current.y;
      sheetSwipeRef.current.lastY = evt.clientY;
      if (Math.abs(dy) > 6) sheetSwipeRef.current.moved = true;
      evt.preventDefault?.();
    };
    const onUp = evt => {
      const current = sheetSwipeRef.current;
      cleanup();
      finishSheetSwipe(current, evt.clientY ?? current?.lastY ?? start.y);
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
      sheetSwipeRef.current = null;
    };
    sheetSwipeRef.current.cleanup = cleanup;
    window.addEventListener("pointermove", onMove, { capture: true, passive: false });
    window.addEventListener("pointerup", onUp, { capture: true, passive: false });
    window.addEventListener("pointercancel", onUp, { capture: true, passive: false });
  }
  function moveSheetSwipe(e) {
    const start = sheetSwipeRef.current;
    if (!start) return;
    const dy = e.clientY - start.y;
    start.lastY = e.clientY;
    if (Math.abs(dy) > 6) start.moved = true;
  }
  function endSheetSwipe(e) {
    const start = sheetSwipeRef.current;
    if (start?.cleanup) return;
    sheetSwipeRef.current = null;
    finishSheetSwipe(start, e.clientY ?? start?.lastY ?? start?.y ?? 0);
  }
  function toggleSheetFromHandle(e) {
    e.preventDefault();
    e.stopPropagation();
    if (Date.now() - sheetClickBlockRef.current < 250) return;
    setSheetOpen(open => !open);
  }
  useEffect(() => () => {
    sheetSwipeRef.current?.cleanup?.();
    sheetSwipeRef.current = null;
  }, []);

  useEffect(() => {
    if (!selectedBlock?.stickerAsset) return;
    const pack = stickerPacks.find(p => (p.stickers || []).some(st => st.src === selectedBlock.stickerAsset));
    if (pack && pack.id !== activeStickerPackId) setActiveStickerPackId(pack.id);
  }, [selectedBlock?.id, selectedBlock?.stickerAsset]);

  function addDecoration(type, sticker) {
    setSheetOpen(true);
    onHistoryCheckpoint?.();
    const nextItem = makeScrapbookItem(type === "tape" ? "tape" : "sticker", normalizedBlocks.length);
    const item = sticker ? { ...nextItem, stickerAsset: sticker.src, sticker: sticker.label } : nextItem;
    setBlocks(bs => [...normalizeScrapbookBlocksForSave(bs), item]);
    setSelectedBlockId(item.id);
  }
  function updateDecoration(id, patch) { onHistoryCheckpoint?.(); setBlocks(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b)); }
  function removeDecoration(id) {
    onHistoryCheckpoint?.();
    setBlocks(bs => bs.filter(b => b.id !== id));
    setSelectedBlockId(current => current === id ? null : current);
  }
  function duplicateDecoration(id) {
    onHistoryCheckpoint?.();
    const sourceIndex = normalizedBlocks.findIndex(b => b.id === id);
    if (sourceIndex < 0) return;
    const source = normalizedBlocks[sourceIndex];
    const layout = scrapbookItemLayout(source, sourceIndex);
    const hasPxLayout = [source?.xPx, source?.yPx, source?.wPx, source?.hPx].every(v => Number.isFinite(Number(v)));
    const copy = {
      ...source,
      id: `b${uid()}`,
      x: scrapbookClamp(layout.x + 4, -12, 104),
      y: scrapbookClamp(layout.y + 4, -8, 104),
      ...(hasPxLayout ? { coord: "px", xPx: Number(source.xPx) + 18, yPx: Number(source.yPx) + 18 } : {}),
      z: Math.max(1, ...normalizedBlocks.map((b, idx) => scrapbookItemLayout(b, idx).z || idx + 1)) + 1,
    };
    setBlocks(bs => [...bs, copy]);
    setSelectedBlockId(copy.id);
  }
  function nudgeLayer(id, dir) {
    onHistoryCheckpoint?.();
    setBlocks(bs => {
      const current = normalizeScrapbookBlocksForSave(bs);
      const zValues = current.map((b, idx) => scrapbookItemLayout(b, idx).z || idx + 1);
      const currentMax = Math.max(1, ...zValues);
      const currentMin = Math.min(1, ...zValues);
      return bs.map((b, idx) => {
        if (b.id !== id) return b;
        const layout = scrapbookItemLayout(b, idx);
        return { ...b, z: dir > 0 ? currentMax + 1 : currentMin - 1 };
      });
    });
  }
  function pickSticker(sticker) {
    setSheetOpen(true);
    if (selectedBlock && scrapbookItemType(selectedBlock) === "sticker") updateDecoration(selectedBlock.id, { stickerAsset: sticker.src, sticker: sticker.label });
    else addDecoration("sticker", sticker);
  }
  function renderStickerPackPicker() {
    const activePack = stickerPacks.find(pack => pack.id === activeStickerPackId) || stickerPacks[0];
    const activeStickers = activePack?.stickers || [];
    return (
      <div className="sticker-pack-browser story-sticker-browser">
        <div className="sticker-pack-tabs story-pack-tabs" role="tablist" aria-label="Sticker packs">
          {stickerPacks.map(pack => {
            const icon = pack.stickers?.[0];
            return (
              <button key={pack.id} type="button" className={pack.id === activePack?.id ? "active" : ""} title={pack.label} aria-label={`${pack.label} sticker pack`} onClick={() => setActiveStickerPackId(pack.id)}>
                {icon?.src ? <img src={icon.src} alt="" onError={e => { e.currentTarget.style.display = "none"; }} /> : <span>🌸</span>}
                <small>{pack.label}</small>
              </button>
            );
          })}
        </div>
        <div className="sticker-pack-active-title">{activePack?.label || "Stickers"}</div>
        <div className="sticker-asset-picker-row compact story-sticker-row" aria-label="Choose a sticker">
          {activeStickers.map(st => (
            <button key={st.id} type="button" className={selectedBlock?.stickerAsset === st.src ? "selected" : ""} title={st.label} onClick={() => pickSticker(st)}>
              <img src={st.src} alt={st.label} onError={e => { e.currentTarget.style.display = "none"; }} />
              <span className="sticker-choice-label">{st.number || st.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const selectedType = scrapbookItemType(selectedBlock);

  return (
    <aside className={`journal-decoration-bottom-sheet journal-decoration-tool-card ${sheetOpen ? "open" : "collapsed"}`} aria-label="Decoration tools" data-open={sheetOpen ? "true" : "false"} onPointerDown={startSheetSwipe}>
      <button
        type="button"
        className="journal-decoration-sheet-handle"
        onPointerDown={startSheetSwipe}
        onPointerMove={moveSheetSwipe}
        onPointerUp={endSheetSwipe}
        onPointerCancel={() => { sheetSwipeRef.current = null; }}
        onClick={toggleSheetFromHandle}
        aria-expanded={sheetOpen}
      >
        <span />
        <strong>{sheetOpen ? "Decoration tools" : "Swipe up to decorate"}</strong>
      </button>
      {sheetOpen && <div className="journal-decoration-sheet-content">
        <div className="journal-decoration-editor-head story-tool-head">
          <div>
            <strong>Decorate 🎀</strong>
            <span>Drag on the memory. Use the corner dot to resize + rotate. Double-tap for flip, layer, copy, or delete.</span>
          </div>
          <div className="journal-decoration-editor-actions">
            <button type="button" className="tf-cancel decor-history-btn" onClick={onUndo} disabled={saving || !canUndo} title="Undo last decoration change">↶ Undo</button>
            <button type="button" className="tf-cancel decor-history-btn" onClick={onRedo} disabled={saving || !canRedo} title="Redo decoration change">↷ Redo</button>
            <button type="button" className="tf-cancel" onClick={onCancel} disabled={saving}>Cancel</button>
            <button type="button" className="tf-save" onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save ✓"}</button>
          </div>
        </div>
        <div className="scrapbook-add-row scrapbook-toolbar journal-decoration-toolbar story-add-row">
          <button type="button" onClick={() => addDecoration("tape")}>+ Tape</button>
          <button type="button" onClick={() => addDecoration("sticker")}>+ Sticker</button>
          {selectedBlock && <button type="button" onClick={() => setSelectedBlockId(null)}>Deselect</button>}
        </div>
        <div className="story-tool-tip">{selectedBlock ? `${scrapbookItemLabel(selectedType)} selected. Double-tap it for quick actions.` : "Choose a sticker or add tape, then drag it directly on the memory."}</div>
        {selectedType === "tape" && <div className="journal-decoration-note">Double-tap tape and choose Text if you want words on it.</div>}
        {renderStickerPackPicker()}
      </div>}
    </aside>
  );

}



function DayEntryModal({ date, entry, onSave, onClose, onSaved, activitiesCatalog = JOURNAL_ACTIVITIES, memoryTagsCatalog = MEMORY_TAGS, onAddActivity, onUpdateActivity, onDeleteActivity, onAddMemoryTag, onUpdateMemoryTag, onDeleteMemoryTag, onReorderActivities, userId, imageUrls = {}, onQueuePhotoCleanup }) {
  const normalized = normalizeMemoryEntry(entry);
  const originalStoragePaths = useMemo(() => normalized.photos.flatMap(allMemoryPhotoStoragePaths), [entry]);
  const [mood,       setMoodLocal]  = useState(normalized.mood);
  const [activities, setActivities] = useState(normalized.activities);
  const [note,       setNote]       = useState(normalized.note);
  const [gratitude,  setGratitude]  = useState(normalized.gratitude.length ? normalized.gratitude : ["","",""]);
  const [photos,     setPhotos]     = useState(normalized.photos);
  const [coverPhotoId, setCoverPhotoId] = useState(normalized.coverPhotoId);
  const [tags,       setTags]       = useState(normalized.tags);
  const [newTag,     setNewTag]     = useState("");
  const [blocks,     setBlocks]     = useState(() => normalizeScrapbookBlocksForSave(normalized.blocks));
  const [backgroundId, setBackgroundId] = useState(normalized.backgroundId || "plain");
  const [highlights, setHighlights] = useState(normalized.highlights);
  const [newActivity, setNewActivity] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const scrapbookCanvasRef = useRef(null);
  const scrapbookDragRef = useRef(null);
  const initialSnapshot = useMemo(() => JSON.stringify({
    mood: normalized.mood,
    activities: normalized.activities,
    note: normalized.note,
    gratitude: normalized.gratitude.length ? normalized.gratitude : ["","",""],
    photos: normalized.photos.map(p => ({ id:p.id, caption:p.caption || "", storagePath:p.storagePath || "", thumbStoragePath:p.thumbStoragePath || "" })),
    coverPhotoId: normalized.coverPhotoId,
    tags: normalized.tags,
    blocks: normalizeScrapbookBlocksForSave(normalized.blocks),
    backgroundId: normalized.backgroundId || "plain",
    highlights: normalized.highlights,
  }), [entry]);
  const prompt = JOURNAL_PROMPTS[date.getDate() % JOURNAL_PROMPTS.length];
  const stickerPacks = Core.MEMORY_STICKER_PACKS || [{ id: "cozy", label: "Cozy", stickers: COZY_STICKER_PACK }];
  const [activeStickerPackId, setActiveStickerPackId] = useState(stickerPacks.find(p => p.id === "sugar")?.id || stickerPacks[0]?.id || "cozy");
  const renderStickerPackPicker = (selectedSrc, onPick, { previewOnly = false } = {}) => {
    const activePack = stickerPacks.find(pack => pack.id === activeStickerPackId) || stickerPacks[0];
    const activeStickers = activePack?.stickers || [];
    return (
      <div className="sticker-pack-browser">
        <div className="sticker-pack-tabs" role="tablist" aria-label="Sticker packs">
          {stickerPacks.map(pack => {
            const icon = pack.stickers?.[0];
            return (
              <button
                key={pack.id}
                type="button"
                className={pack.id === activePack?.id ? "active" : ""}
                title={pack.label}
                aria-label={`${pack.label} sticker pack`}
                onClick={() => setActiveStickerPackId(pack.id)}
              >
                {icon?.src ? <img src={icon.src} alt="" onError={e => { e.currentTarget.style.display = "none"; }} /> : <span>🌸</span>}
                <small>{pack.label}</small>
              </button>
            );
          })}
        </div>
        <div className="sticker-pack-active-title">{activePack?.label || "Stickers"}</div>
        <div className="sticker-asset-picker-row compact">
          {activeStickers.map(st => {
            const content = (
              <>
                <img src={st.src} alt={st.label} onError={e => { e.currentTarget.style.display = "none"; }} />
                <span className="sticker-choice-label">{st.number || st.label}</span>
              </>
            );
            return previewOnly
              ? <span key={st.id} className="sticker-preview-chip">{content}</span>
              : <button key={st.id} type="button" className={selectedSrc === st.src ? "selected" : ""} title={st.label} onClick={() => onPick(st)}>{content}</button>;
          })}
        </div>
      </div>
    );
  };
  const visibleActivitiesCatalog = (activitiesCatalog || []).filter(a => !a.archived);
  const groups = [...new Set(visibleActivitiesCatalog.map(a => a.group || "Custom"))];
  const [showActivityManager, setShowActivityManager] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [dragActivityId, setDragActivityId] = useState(null);
  const availableTags = [...new Set([...(memoryTagsCatalog || MEMORY_TAGS), ...tags].map(memoryTagLabel).filter(Boolean))];
  const editableScrapbookBlocks = normalizeScrapbookBlocksForSave(blocks);
  const selectedBlock = editableScrapbookBlocks.find(b => b.id === selectedBlockId) || editableScrapbookBlocks[0] || null;
  useEffect(() => {
    if (!selectedBlock?.stickerAsset) return;
    const pack = stickerPacks.find(p => (p.stickers || []).some(st => st.src === selectedBlock.stickerAsset));
    if (pack && pack.id !== activeStickerPackId) setActiveStickerPackId(pack.id);
  }, [selectedBlock?.id, selectedBlock?.stickerAsset]);
  const currentSnapshot = JSON.stringify({
    mood, activities, note, gratitude,
    photos: photos.map(p => ({ id:p.id, caption:p.caption || "", storagePath:p.storagePath || "", thumbStoragePath:p.thumbStoragePath || "", pending: Boolean(p.pendingFile) })),
    coverPhotoId, tags, blocks, backgroundId, highlights,
  });
  const hasUnsavedChanges = currentSnapshot !== initialSnapshot;
  function requestClose() {
    if (uploading) return;
    if (hasUnsavedChanges && !window.confirm("Discard this memory? You have unsaved changes.")) return;
    onClose();
  }

  function toggleActivity(id) {
    setActivities(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]);
  }
  function updateGratitude(i, val) {
    setGratitude(g => { const n=[...g]; n[i]=val; return n; });
  }
  function toggleTag(tag) {
    const clean = memoryTagLabel(tag);
    if (!clean) return;
    setTags(t => t.includes(clean) ? t.filter(x => x !== clean) : [...t, clean]);
  }
  function editMemoryTag(tag) {
    const clean = memoryTagLabel(tag);
    const next = window.prompt("Rename memory tag", clean);
    if (!next || !next.trim()) return;
    const renamed = memoryTagLabel(next);
    onUpdateMemoryTag?.(clean, renamed);
    setTags(t => [...new Set(t.map(x => x === clean ? renamed : x))]);
  }
  function removeMemoryTag(tag) {
    const clean = memoryTagLabel(tag);
    if (!clean) return;
    if (!window.confirm(`Remove #${clean} from all memories? This cannot be undone.`)) return;
    onDeleteMemoryTag?.(clean);
    setTags(t => t.filter(x => x !== clean));
  }
  function editActivity(activity) {
    const label = window.prompt("Rename activity", activity.label);
    if (!label || !label.trim()) return;
    const emoji = window.prompt("Emoji", activity.emoji || "✨") || activity.emoji || "✨";
    onUpdateActivity?.(activity.id, { label: label.trim(), emoji: emoji.trim() || "✨" });
  }
  function removeActivity(activity) {
    if (!window.confirm(`Archive ${activity.emoji || ""} ${activity.label}? Old memories will keep their label.`)) return;
    onDeleteActivity?.(activity.id);
    setActivities(a => a.filter(x => x !== activity.id));
  }
  function handleActivityDrop(targetId) {
    if (!dragActivityId || dragActivityId === targetId) return;
    onReorderActivities?.(dragActivityId, targetId);
    setDragActivityId(null);
  }
  async function handlePhotoUpload(files) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError("");
    setUploadStatus("Preparing photos…");
    try {
      const next = await prepareJournalPhotosFromFiles(files, photos.length, setUploadStatus);
      setPhotos(p => {
        const merged = [...p, ...next];
        if (!coverPhotoId && merged[0]) setCoverPhotoId(merged[0].id);
        return merged;
      });
    } catch (err) {
      console.warn("Memory photo selection failed", err);
      setUploadError(err?.message || "Could not add photos. Please try smaller image files.");
    } finally { setUploading(false); setUploadStatus(""); }
  }
  function updatePhotoCaption(id, caption) {
    setPhotos(p => p.map(photo => photo.id === id ? { ...photo, caption } : photo));
  }
  function removePhoto(id) {
    if (!window.confirm("Remove this photo from the memory? The file is deleted after the memory saves successfully.")) return;
    setPhotos(p => p.filter(photo => photo.id !== id));
    setCoverPhotoId(c => c === id ? null : c);
    setBlocks(bs => bs.filter(b => b.photoId !== id && !(Array.isArray(b.photoIds) && b.photoIds.includes(id))));
  }
  function addBlock(type) {
    const nextItem = makeScrapbookItem(type === "tape" ? "tape" : "sticker", blocks.length);
    setBlocks(bs => [...bs, nextItem]);
    setSelectedBlockId(nextItem.id);
  }
  function updateBlock(id, patch) { setBlocks(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b)); }
  function updateScrapbookText(id, text) {
    setBlocks(bs => bs.map((b, idx) => {
      if (b.id !== id) return b;
      const type = scrapbookItemType(b);
      const layout = scrapbookItemLayout(b, idx);
      const cleanText = String(text || "");
      const charsPerLine = Math.max(10, Math.floor(layout.w * 1.35));
      const estimatedLines = cleanText.split(/\n/).reduce((sum, line) => sum + Math.max(1, Math.ceil((line.length || 1) / charsPerLine)), 0);
      const neededH = 10 + estimatedLines * 4.2;
      const nextH = scrapbookClamp(Math.max(layout.h, neededH), 8, 60);
      return { ...b, text: cleanText, h: nextH, y: scrapbookClamp(layout.y, 0, 100 - nextH) };
    }));
  }
  function toggleStickerFlip(id, axis) {
    if (!id) return;
    const key = axis === "y" ? "flipY" : "flipX";
    setBlocks(bs => bs.map(b => b.id === id ? { ...b, [key]: !Boolean(b[key]) } : b));
  }
  function removeBlock(id) {
    setBlocks(bs => bs.filter(b => b.id !== id));
    setSelectedBlockId(current => current === id ? null : current);
  }
  function duplicateBlock(id) {
    const sourceIndex = blocks.findIndex(b => b.id === id);
    if (sourceIndex < 0) return;
    const source = blocks[sourceIndex];
    const layout = scrapbookItemLayout(source, sourceIndex);
    const copy = {
      ...source,
      id: `b${uid()}`,
      x: scrapbookClamp(layout.x + 4, 0, 92),
      y: scrapbookClamp(layout.y + 4, 0, 92),
      z: Math.max(1, ...blocks.map((b, idx) => scrapbookItemLayout(b, idx).z || idx + 1)) + 1,
    };
    setBlocks(bs => [...bs, copy]);
    setSelectedBlockId(copy.id);
  }
  function nudgeLayer(id, dir) {
    setBlocks(bs => {
      const zValues = bs.map((b, idx) => scrapbookItemLayout(b, idx).z || idx + 1);
      const currentMax = Math.max(1, ...zValues);
      const currentMin = Math.min(1, ...zValues);
      return bs.map((b, idx) => {
        if (b.id !== id) return b;
        const layout = scrapbookItemLayout(b, idx);
        return { ...b, z: dir > 0 ? currentMax + 1 : currentMin - 1 };
      });
    });
  }
  function updateBlockLayout(id, key, value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    updateBlock(id, { [key]: n });
  }
  function beginScrapbookPointer(blockId, mode, layout, e) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedBlockId(blockId);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    scrapbookDragRef.current = { blockId, mode, layout, startX: e.clientX, startY: e.clientY };
  }
  function moveScrapbookPointer(e) {
    const drag = scrapbookDragRef.current;
    const board = scrapbookCanvasRef.current;
    if (!drag || !board) return;
    e.preventDefault();
    const rect = board.getBoundingClientRect();
    const dx = ((e.clientX - drag.startX) / Math.max(1, rect.width)) * 100;
    const dy = ((e.clientY - drag.startY) / Math.max(1, rect.height)) * 100;
    if (drag.mode === "resize") {
      updateBlock(drag.blockId, {
        w: scrapbookClamp(Math.round((drag.layout.w + dx) * 10) / 10, 8, 96),
        h: scrapbookClamp(Math.round((drag.layout.h + dy) * 10) / 10, 8, 60),
      });
    } else {
      updateBlock(drag.blockId, {
        x: scrapbookClamp(Math.round((drag.layout.x + dx) * 10) / 10, 0, 100 - drag.layout.w),
        y: scrapbookClamp(Math.round((drag.layout.y + dy) * 10) / 10, 0, 100 - drag.layout.h),
      });
    }
  }
  function endScrapbookPointer() { scrapbookDragRef.current = null; }

  async function handleSave() {
    const memoryKey = dateKey(date);
    setUploading(true);
    setUploadError("");
    try {
      const cleanTags = [...new Set(tags.map(memoryTagLabel).filter(Boolean))];
      const uploadedPhotos = [];
      const pendingPhotos = photos.filter(p => p.pendingFile);
      for (const photo of photos) {
        if (photo.pendingFile) {
          const uploadIndex = pendingPhotos.findIndex(p => p.id === photo.id) + 1;
          setUploadStatus(`Uploading ${uploadIndex || 1} of ${pendingPhotos.length || 1} photos…`);
          const uploaded = await uploadMemoryImageToStorage(userId, photo.pendingFile, memoryKey);
          uploadedPhotos.push(sanitizeMemoryPhotoForStorage({
            id: photo.id,
            ...uploaded,
            caption: photo.caption || "",
            name: photo.name || photo.pendingFile?.name || "Memory photo",
            createdAt: photo.createdAt || new Date().toISOString(),
          }));
        } else if (photo.storagePath) {
          uploadedPhotos.push(sanitizeMemoryPhotoForStorage({ ...photo, caption: photo.caption || "" }));
        }
      }
      const cleanBlocks = normalizeScrapbookBlocksForSave(blocks);
      const finalStoragePaths = new Set(uploadedPhotos.flatMap(allMemoryPhotoStoragePaths));
      const removedPaths = originalStoragePaths.filter(path => !finalStoragePaths.has(path));
      const newlyUploadedPaths = uploadedPhotos
        .filter(p => photos.find(original => original.id === p.id)?.pendingFile)
        .flatMap(allMemoryPhotoStoragePaths);
      try {
        setUploadStatus("Saving memory…");
        await onSave(memoryKey, {
          mood, activities, note, gratitude,
          photos: uploadedPhotos,
          coverPhotoId: coverPhotoId || uploadedPhotos[0]?.id || null,
          tags: cleanTags,
          backgroundId,
          highlights,
          blocks: cleanBlocks,
          updatedAt: new Date().toISOString()
        });
      } catch (saveErr) {
        if (newlyUploadedPaths.length) {
          const rollback = await deleteMemoryStoragePathsDetailed(newlyUploadedPaths);
          if (!rollback.ok) onQueuePhotoCleanup?.(rollback.failedPaths, "upload-rollback");
        }
        throw saveErr;
      }
      let cleanupQueued = false;
      if (removedPaths.length) {
        setUploadStatus("Cleaning removed photos…");
        const cleanup = await deleteMemoryStoragePathsDetailed(removedPaths);
        if (!cleanup.ok) {
          cleanupQueued = true;
          onQueuePhotoCleanup?.(cleanup.failedPaths, "removed-photo");
          setUploadStatus("Memory saved — photo cleanup will retry later");
        }
      }
      if (!cleanupQueued) setUploadStatus("Memory saved ✓");
      if (onSaved) onSaved(memoryKey);
      else onClose();
    } catch (err) {
      console.warn("Memory save failed", err);
      setUploadError(err?.message || "Could not save memory. Please check your connection and Supabase Storage setup.");
    } finally {
      setUploading(false);
    }
  }
  return (
    <div className="modal-overlay memory-entry-overlay" onClick={requestClose} role="dialog" aria-modal="true" aria-label="Journal entry">
      <div className={`entry-modal memory-entry-modal memory-bg-${backgroundId}`} style={memoryBackgroundStyle(backgroundId)} onClick={e => e.stopPropagation()}>
        <div className="entry-modal-header">
          <div>
            <div className="entry-modal-date">{formatWithDisplayTimezone(date, {weekday:"long",month:"long",day:"numeric"})}</div>
            <div className="entry-modal-sub">Add today’s memory page</div>
          </div>
          <button className="modal-close" onClick={requestClose}>✕</button>
        </div>

        <div className="entry-modal-body">
        <div className="entry-section">
          <div className="entry-section-title">Mood</div>
          <div className="mood-picker-row">
            {JOURNAL_MOODS.map(m => (
              <button key={m.id} className={`mood-pick-btn ${mood===m.id?"selected":""}`}
                style={{"--mc": m.color}} onClick={() => setMoodLocal(m.id)}>
                <span className="mp-emoji">{m.emoji}</span>
                <span className="mp-label">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="entry-section">
          <div className="entry-section-title">Photos</div>
          <label className="memory-upload-box">
            <input type="file" accept="image/*" multiple onChange={e => { handlePhotoUpload(e.target.files); e.target.value=""; }} />
            <span className="memory-upload-icon">📷</span>
            <span>{uploading ? "Working on photos…" : `+ Add photos (${photos.length}/${MEMORY_IMAGE_LIMIT_PER_ENTRY})`}</span>
          </label>
          {(uploadStatus || uploadError) && <div className={uploadError ? "memory-upload-error" : "memory-upload-status"}>{uploadError || uploadStatus}</div>}
          {photos.length > 0 && (
            <div className="memory-photo-editor-grid">
              {photos.map(p => (
                <div key={p.id} className={`memory-photo-editor-card ${coverPhotoId===p.id?"cover":""}`}>
                  <img src={memoryPhotoSrc(p, imageUrls)} alt={p.caption || "Journal memory"} />
                  <div className="memory-photo-tools">
                    <button type="button" onClick={() => setCoverPhotoId(p.id)}>{coverPhotoId===p.id ? "Cover ✓" : "Set cover"}</button>
                    <button type="button" onClick={() => removePhoto(p.id)}>Remove</button>
                  </div>
                  <input className="gratitude-input memory-caption-input" placeholder="Add caption…" value={p.caption || ""} onChange={e => updatePhotoCaption(p.id, e.target.value)} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="entry-section">
          <div className="entry-section-title section-title-with-action"><span>Memory Tags</span><button type="button" className="mini-manage-btn" onClick={() => setShowTagManager(v => !v)}>{showTagManager ? "Done" : "Manage"}</button></div>
          <div className="memory-tag-row editable-memory-row">
            {availableTags.map(tag => (
              <span key={tag} className={`editable-chip memory-tag-chip ${tags.includes(tag)?"selected":""}`}>
                <button type="button" className="editable-chip-main" onClick={() => toggleTag(tag)}>#{tag}</button>
                <button type="button" className="chip-mini-action" title="Rename tag" onClick={() => editMemoryTag(tag)}>✎</button>
                <button type="button" className="chip-mini-action" title="Remove tag" onClick={() => removeMemoryTag(tag)}>×</button>
              </span>
            ))}
          </div>
          <div className="tf-row" style={{marginTop:10}}>
            <input className="tf-input" placeholder="Add tag…" value={newTag} onChange={e => setNewTag(e.target.value)} />
            <button className="tf-save" onClick={() => { const added = onAddMemoryTag?.(newTag) || memoryTagLabel(newTag); toggleTag(added); setNewTag(""); }}>Add</button>
          </div>
          {showTagManager && (
            <div className="memory-manager-panel">
              <div className="manager-title">Tag Manager</div>
              {availableTags.map(tag => (
                <div key={tag} className="manager-row">
                  <span className="manager-chip">#{tag}</span>
                  <span className="manager-count">{tags.includes(tag) ? "selected" : "available"}</span>
                  <button type="button" onClick={() => editMemoryTag(tag)}>Rename</button>
                  <button type="button" onClick={() => removeMemoryTag(tag)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="entry-section">
          <div className="entry-section-title">Page Background</div>
          <div className="memory-background-picker">
            {MEMORY_BACKGROUNDS.map(bg => (
              <button key={bg.id} type="button" className={`memory-bg-choice ${backgroundId===bg.id?"selected":""}`} onClick={() => setBackgroundId(bg.id)}>
                <span className="memory-bg-swatch" style={bg.src ? {backgroundImage:`url(${bg.src})`} : {}} />
                <span>{bg.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="entry-section">
          <div className="entry-section-title section-title-with-action"><span>Activities</span><button type="button" className="mini-manage-btn" onClick={() => setShowActivityManager(v => !v)}>{showActivityManager ? "Done" : "Manage"}</button></div>
          {groups.map(g => (
            <div key={g} className="activity-group">
              <div className="activity-group-label">{g}</div>
              <div className="activity-chips">
                {visibleActivitiesCatalog.filter(a => (a.group || "Custom") === g).map(a => (
                  <span key={a.id} className={`editable-chip activity-chip ${activities.includes(a.id)?"selected":""}`}>
                    <button type="button" className="editable-chip-main" onClick={() => toggleActivity(a.id)}><span>{a.emoji}</span><span>{a.label}</span></button>
                    <button type="button" className="chip-mini-action" title="Rename activity" onClick={() => editActivity(a)}>✎</button>
                    <button type="button" className="chip-mini-action" title="Remove activity" onClick={() => removeActivity(a)}>×</button>
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="tf-row" style={{marginTop:10}}>
            <input className="tf-input" placeholder="Add activity…" value={newActivity} onChange={e => setNewActivity(e.target.value)} />
            <button className="tf-save" onClick={() => { if (!newActivity.trim()) return; const added = onAddActivity?.(newActivity.trim()); if (added?.id) setActivities(a => [...new Set([...a, added.id])]); setNewActivity(""); }}>Add</button>
          </div>
          {showActivityManager && (
            <div className="memory-manager-panel activity-manager-panel">
              <div className="manager-title">Activity Manager</div>
              {groups.map(groupName => (
                <div key={groupName} className="manager-group-card">
                  <div className="manager-group-head">{groupName}</div>
                  {visibleActivitiesCatalog.filter(a => (a.group || "Custom") === groupName).map(a => (
                    <div key={a.id} className={`manager-row draggable-manager-row ${dragActivityId===a.id?"dragging":""}`} draggable onDragStart={() => setDragActivityId(a.id)} onDragOver={e => e.preventDefault()} onDrop={() => handleActivityDrop(a.id)} onDragEnd={() => setDragActivityId(null)}>
                      <span className="drag-handle" title="Drag to reorder">⋮⋮</span>
                      <span className="manager-chip">{a.emoji} {a.label}</span>
                      <button type="button" onClick={() => editActivity(a)}>Edit</button>
                      <button type="button" onClick={() => removeActivity(a)}>Archive</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="entry-section">
          <div className="entry-section-title">Today’s Highlights ✨</div>
          <input className="gratitude-input" placeholder="Best moment…" value={highlights.best || ""} onChange={e => setHighlights(h => ({...h, best:e.target.value}))} />
          <input className="gratitude-input" placeholder="Biggest win…" value={highlights.win || ""} onChange={e => setHighlights(h => ({...h, win:e.target.value}))} />
          <input className="gratitude-input" placeholder="Something I learned…" value={highlights.learned || ""} onChange={e => setHighlights(h => ({...h, learned:e.target.value}))} />
          <input className="gratitude-input" placeholder="One thing I want to remember…" value={highlights.remember || ""} onChange={e => setHighlights(h => ({...h, remember:e.target.value}))} />
        </div>

        <div className="entry-section">
          <div className="entry-section-title">3 Things I&apos;m Grateful For 🌸</div>
          {[0,1,2].map(i => (
            <input key={i} className="gratitude-input" placeholder={`Gratitude ${i+1}…`}
              value={gratitude[i] || ""} onChange={e => updateGratitude(i, e.target.value)} />
          ))}
        </div>

        <div className="entry-section">
          <div className="entry-section-title">Journal Entry</div>
          <div className="journal-prompt">💭 {prompt}</div>
          <textarea className="journal-textarea" rows={5} placeholder="Write freely…"
            value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <div className="entry-modal-footer">
          <button className="tf-cancel" onClick={requestClose}>Cancel</button>
          <button className="tf-save" onClick={handleSave} disabled={uploading}>{uploading ? "Saving…" : "Save memory ✓"}</button>
        </div>
        </div>
      </div>
    </div>
  );
}

// ─── Journal Page ─────────────────────────────────────────────────────────────
export function JournalPage({ journal, setJournal, onSaveMemoryEntry, events, tasks, dailyCheckIns = [], tomorrowResets = [], weeklyResets = [], onOpenCheckIn, activitiesCatalog = JOURNAL_ACTIVITIES, memoryTagsCatalog = MEMORY_TAGS, onAddActivity, onUpdateActivity, onDeleteActivity, onAddMemoryTag, onUpdateMemoryTag, onDeleteMemoryTag, onReorderActivities, userId, onMemoryStorageMigrated, onQueuePhotoCleanup, quickEditDate, onQuickEditHandled, allowDecorationEditing = true }) {
  const [calDate,    setCalDate]    = useState(new Date(TODAY));
  const [editing,    setEditing]    = useState(null); // Date being edited
  const [viewingKey, setViewingKey] = useState(null); // dateKey being read
  const [activeTag,  setActiveTag]  = useState("all"); // Journal tag filter
  const [memorySearch, setMemorySearch] = useState("");
  const [memorySettingsOpen, setMemorySettingsOpen] = useState(false);
  const [memoryImageUrls, setMemoryImageUrls] = useState({});
  const [dragActivityId, setDragActivityId] = useState(null);
  const [decoratingKey, setDecoratingKey] = useState(null);
  const [decoratePromptKey, setDecoratePromptKey] = useState(null);
  const [decorDraftBlocks, setDecorDraftBlocks] = useState([]);
  const [selectedDecorationId, setSelectedDecorationId] = useState(null);
  const [decorUndoStack, setDecorUndoStack] = useState([]);
  const [decorRedoStack, setDecorRedoStack] = useState([]);
  const [savingDecorations, setSavingDecorations] = useState(false);
  const decorationOriginalRef = useRef("[]");
  useEffect(() => {
    if (quickEditDate) {
      setEditing(quickEditDate);
      onQuickEditHandled?.();
    }
  }, [quickEditDate]);

  useEffect(() => {
    if (!viewingKey || typeof document === "undefined") return;
    const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;
    document.documentElement.classList.add("tempo-modal-locked");
    document.body.classList.add("tempo-modal-locked");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.documentElement.classList.remove("tempo-modal-locked");
      document.body.classList.remove("tempo-modal-locked");
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      if (typeof window !== "undefined") window.scrollTo(0, scrollY);
    };
  }, [viewingKey]);

  async function saveEntry(key, data) {
    if (onSaveMemoryEntry) return onSaveMemoryEntry(key, data);
    setJournal(j => ({ ...j, [key]: data }));
    return true;
  }

  function resetDecorationHistory() {
    setDecorUndoStack([]);
    setDecorRedoStack([]);
  }

  function recordDecorationHistoryCheckpoint() {
    const snapshot = normalizeScrapbookBlocksForSave(decorDraftBlocks);
    const snapshotText = JSON.stringify(snapshot);
    setDecorUndoStack(stack => {
      const last = stack[stack.length - 1];
      if (last && JSON.stringify(last) === snapshotText) return stack;
      return [...stack.slice(-(JOURNAL_DECORATION_HISTORY_LIMIT - 1)), snapshot];
    });
    setDecorRedoStack([]);
  }

  function undoDecorationChange() {
    if (!decorUndoStack.length) return;
    const previous = decorUndoStack[decorUndoStack.length - 1];
    const current = normalizeScrapbookBlocksForSave(decorDraftBlocks);
    setDecorUndoStack(stack => stack.slice(0, -1));
    setDecorRedoStack(stack => [...stack.slice(-(JOURNAL_DECORATION_HISTORY_LIMIT - 1)), current]);
    setDecorDraftBlocks(previous);
    setSelectedDecorationId(id => previous.some(b => b.id === id) ? id : (previous[previous.length - 1]?.id || null));
  }

  function redoDecorationChange() {
    if (!decorRedoStack.length) return;
    const next = decorRedoStack[decorRedoStack.length - 1];
    const current = normalizeScrapbookBlocksForSave(decorDraftBlocks);
    setDecorRedoStack(stack => stack.slice(0, -1));
    setDecorUndoStack(stack => [...stack.slice(-(JOURNAL_DECORATION_HISTORY_LIMIT - 1)), current]);
    setDecorDraftBlocks(next);
    setSelectedDecorationId(id => next.some(b => b.id === id) ? id : (next[next.length - 1]?.id || null));
  }

  function startDecoratingMemory(key) {
    const entry = normalizeMemoryEntry(journal[key]);
    const blocks = normalizeScrapbookBlocksForSave(entry.blocks);
    setViewingKey(key);
    setDecoratingKey(key);
    setDecoratePromptKey(null);
    setDecorDraftBlocks(blocks);
    setSelectedDecorationId(blocks[0]?.id || null);
    resetDecorationHistory();
    decorationOriginalRef.current = JSON.stringify(blocks);
  }

  function stopDecoratingMemory({ force = false } = {}) {
    if (!decoratingKey) return true;
    const changed = JSON.stringify(normalizeScrapbookBlocksForSave(decorDraftBlocks)) !== decorationOriginalRef.current;
    if (!force && changed && !window.confirm("Discard unsaved decorations?")) return false;
    setDecoratingKey(null);
    setDecorDraftBlocks([]);
    setSelectedDecorationId(null);
    resetDecorationHistory();
    return true;
  }

  function closeViewingMemory() {
    if (!stopDecoratingMemory()) return;
    setDecoratePromptKey(null);
    setViewingKey(null);
  }

  async function saveDecorations() {
    if (!decoratingKey || !journal[decoratingKey]) return;
    setSavingDecorations(true);
    try {
      const cleanBlocks = normalizeScrapbookBlocksForSave(decorDraftBlocks);
      await saveEntry(decoratingKey, {
        ...journal[decoratingKey],
        blocks: cleanBlocks,
        updatedAt: new Date().toISOString(),
      });
      decorationOriginalRef.current = JSON.stringify(cleanBlocks);
      setDecoratingKey(null);
      setDecorDraftBlocks([]);
      setSelectedDecorationId(null);
      resetDecorationHistory();
    } catch (err) {
      console.warn("Could not save journal decorations", err);
      window.alert(err?.message || "Could not save decorations. Please try again.");
    } finally {
      setSavingDecorations(false);
    }
  }

  // Build mood calendar for current month
  const year = calDate.getFullYear(), month = calDate.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const fd = new Date(year, month, 1); const so = (fd.getDay()+6)%7;
  const calDays = [];
  for (let i=0; i<so; i++) calDays.push(null);
  for (let d=1; d<=daysInMonth; d++) calDays.push(new Date(year, month, d));
  while (calDays.length%7!==0) calDays.push(null);

  // Stats for current month
  const monthPrefix = `${year}-${String(month+1).padStart(2,"0")}`;
  const monthEntries = Object.entries(journal).filter(([k]) => k.startsWith(monthPrefix));
  const monthTags = [...new Set(monthEntries.flatMap(([,e]) => normalizeMemoryEntry(e).tags || []))].filter(Boolean).sort();
  const allTagUsage = Object.values(journal || {}).reduce((acc, e) => { normalizeMemoryEntry(e).tags.forEach(t => { acc[t] = (acc[t] || 0) + 1; }); return acc; }, {});
  const allActivitiesUsage = Object.values(journal || {}).reduce((acc, e) => { normalizeMemoryEntry(e).activities.forEach(id => { acc[id] = (acc[id] || 0) + 1; }); return acc; }, {});
  const monthPhotos = monthEntries.reduce((sum, [,e]) => sum + normalizeMemoryEntry(e).photos.length, 0);
  const monthPages = monthEntries.filter(([,e]) => hasJournalEntryForKey({ tmp: e }, "tmp")).length;
  const moodCounts = JOURNAL_MOODS.map(m => ({ ...m, count: monthEntries.filter(([,e]) => e.mood===m.id).length }));
  const todayCheckIn = dailyCheckInForDate(dailyCheckIns, TODAY);
  const todayCheckInMood = todayCheckIn?.mood ? DAILY_CHECKIN_MOODS.find(m => m.id === todayCheckIn.mood) : null;
  const todayCheckInEnergy = todayCheckIn?.energy ? DAILY_CHECKIN_ENERGIES.find(e => e.id === todayCheckIn.energy) : null;
  const monthCheckIns = normalizeDailyCheckIns(dailyCheckIns).filter(c => String(c.date || "").startsWith(monthPrefix));
  const latestTomorrowReset = tomorrowResetForDate(tomorrowResets, TODAY);
  const monthTomorrowResets = normalizeTomorrowResets(tomorrowResets).filter(r => String(r.date || "").startsWith(monthPrefix));
  const latestWeeklyReset = weeklyResetForDate(weeklyResets, TODAY);
  const monthWeeklyResets = normalizeWeeklyResets(weeklyResets).filter(r => String(r.weekStart || "").startsWith(monthPrefix));
  const query = memorySearch.trim().toLowerCase();
  const memorySearchText = (key, entry) => {
    const mem = normalizeMemoryEntry(entry);
    const moodLabel = JOURNAL_MOODS.find(m => m.id === mem.mood)?.label || "";
    const activityLabels = (mem.activities || []).map(id => activitiesCatalog.find(a => a.id === id)?.label || id);
    const bgLabel = memoryBackgroundById(mem.backgroundId)?.label || "";
    return [
      key,
      moodLabel,
      bgLabel,
      ...activityLabels,
      mem.note,
      ...(mem.gratitude || []),
      ...(mem.tags || []),
      ...Object.values(mem.highlights || {}),
      ...(mem.photos || []).flatMap(p => [p.caption || "", p.name || ""]),
      ...(mem.blocks || []).flatMap(b => [b.text || "", b.caption || "", b.sticker || ""])
    ].join(" ").toLowerCase();
  };
  const memoryMatchesFilters = (key, entry) => {
    if (!hasJournalEntryForKey({ [key]: entry }, key)) return false;
    const mem = normalizeMemoryEntry(entry);
    if (activeTag !== "all" && !(mem.tags || []).includes(activeTag)) return false;
    if (query && !memorySearchText(key, entry).includes(query)) return false;
    return true;
  };
  const memoryFiltersActive = activeTag !== "all" || Boolean(query);
  const searchableEntries = Object.entries(journal)
    .filter(([k,e]) => memoryMatchesFilters(k, e))
    .sort(([a],[b]) => b.localeCompare(a));
  const throwbackKeys = [dateKey(addDaysSafe(TODAY, -7)), dateKey(addMonthsSafe(TODAY, -1)), dateKey(addDaysSafe(TODAY, -365))];
  const throwbacks = [...new Set(throwbackKeys)].map(k => [k, journal[k]]).filter(([,e]) => e && hasJournalEntryForKey({ tmp:e }, "tmp")).slice(0,3);
  const streak = (() => {
    let s=0; const d=new Date(TODAY);
    while(true){ if(!hasJournalEntryForKey(journal, dateKey(d))) break; s++; d.setDate(d.getDate()-1); }
    return s;
  })();

  async function refreshMemoryImage(photo, preferThumb = false) {
    const path = preferThumb ? (photo?.thumbStoragePath || photo?.storagePath) : (photo?.storagePath || photo?.thumbStoragePath);
    if (!path) return;
    try {
      const signed = await signMemoryImagePath(path);
      if (signed.src) setMemoryImageUrls(prev => ({ ...prev, [path]: signed.src }));
    } catch (err) {
      console.warn("Could not refresh Journal image URL", err);
    }
  }


  useEffect(() => {
    if (!userId) return;
    const migrations = [];
    const pathsToSign = new Set();
    Object.entries(journal || {}).forEach(([key, entry]) => {
      const mem = normalizeMemoryEntry(entry);
      mem.photos.forEach(photo => {
        if (memoryPhotoNeedsStorageMigration(photo)) migrations.push({ key, photo });
        else {
          allMemoryPhotoStoragePaths(photo).forEach(path => { if (!memoryImageUrls[path]) pathsToSign.add(path); });
        }
      });
    });
    if (!migrations.length && !pathsToSign.size) return;
    let cancelled = false;
    (async () => {
      const migratedPhotos = {};
      const signedUrls = {};
      for (const item of migrations) {
        try {
          const uploaded = await uploadMemoryDataUrlToStorage(userId, item.photo.src, item.photo.name || "legacy-memory-photo", item.key);
          migratedPhotos[`${item.key}:${item.photo.id}`] = sanitizeMemoryPhotoForStorage({
            id: item.photo.id,
            ...uploaded,
            caption: item.photo.caption || "",
            name: item.photo.name || "legacy-memory-photo",
            createdAt: item.photo.createdAt || new Date().toISOString(),
          });
          allMemoryPhotoStoragePaths(uploaded).forEach(path => pathsToSign.add(path));
        } catch (err) {
          console.warn("Could not migrate Journal photo", err);
        }
      }
      for (const path of pathsToSign) {
        try {
          const signed = await signMemoryImagePath(path);
          if (signed.src) signedUrls[path] = signed.src;
        } catch (err) {
          console.warn("Could not sign Journal photo", err);
        }
      }
      if (cancelled) return;
      if (Object.keys(signedUrls).length) setMemoryImageUrls(prev => ({ ...prev, ...signedUrls }));
      if (Object.keys(migratedPhotos).length) {
        setJournal(prev => {
          let changed = false;
          const next = { ...prev };
          Object.entries(prev || {}).forEach(([key, entry]) => {
            const mem = normalizeMemoryEntry(entry);
            let entryChanged = false;
            const photos = mem.photos.map(photo => {
              const patch = migratedPhotos[`${key}:${photo.id}`];
              if (!patch) return photo;
              changed = true;
              entryChanged = true;
              return patch;
            });
            if (entryChanged) next[key] = { ...entry, photos };
          });
          return changed ? next : prev;
        });
        onMemoryStorageMigrated?.(new Date().toISOString());
      }
    })();
    return () => { cancelled = true; };
  }, [userId, journal, memoryImageUrls, setJournal, onMemoryStorageMigrated]);

  // (viewEntry accessed inline below via journal[viewingKey])

  return (
    <div className="journal-page">
      {/* Header */}
      <div className="journal-header">
        <div className="journal-header-main">
          <div className="journal-title">📔 Journal</div>
          <div className="journal-streak">🔥 {streak} day streak</div>
        </div>
        <div className="journal-header-actions">
          <button type="button" className="tf-save journal-today-btn" onClick={() => setEditing(new Date(TODAY))}>+ Add Memory</button>
        </div>
      </div>


      {/* Mood stats bar */}
      <div className="mood-stats-bar">
        {moodCounts.map(m => m.count > 0 && (
          <div key={m.id} className="mood-stat-pill" style={{"--mc":m.color}}>
            <span>{m.emoji}</span><span className="mood-stat-count">{m.count}</span>
          </div>
        ))}
        <span className="mood-stats-month">{formatWithDisplayTimezone(calDate, {month:"long",year:"numeric"})}</span>
      </div>


      {latestWeeklyReset && (
        <div className="journal-reset-card journal-weekly-reset-card">
          <div className="journal-reset-main">
            <span>🧺</span>
            <div>
              <strong>Weekly Reset saved</strong>
              <p>{latestWeeklyReset.priorities?.length ? `Next focus: ${latestWeeklyReset.priorities.slice(0, 2).join(" · ")}` : (latestWeeklyReset.intention || "Your weekly intention is saved.")}</p>
            </div>
          </div>
          <div className="journal-checkin-actions">
            <span>{monthWeeklyResets.length} weekly reset{monthWeeklyResets.length === 1 ? "" : "s"} this month</span>
          </div>
        </div>
      )}

      <div className="journal-reflection-hub">
        <div className="journal-reflection-head">
          <div>
            <strong>Reflection Hub</strong>
            <p>Today’s check-in, gratitude, tomorrow intention, and weekly reset in one calm space.</p>
          </div>
          <button className="tf-save journal-today-btn" onClick={() => setEditing(new Date(TODAY))}>Write today’s journal</button>
        </div>
        <div className="journal-reflection-grid">
          <div className="journal-reflection-tile"><span>Mood</span><strong>{todayCheckInMood ? `${todayCheckInMood.emoji} ${todayCheckInMood.label}` : "Not checked in"}</strong><p>{todayCheckInEnergy ? `${todayCheckInEnergy.emoji} ${todayCheckInEnergy.label} energy` : "Add energy for better planning."}</p></div>
          <div className="journal-reflection-tile"><span>Gratitude</span><strong>{(normalizeMemoryEntry(journal[dateKey(TODAY)] || {}).gratitude || []).filter(Boolean)[0] || latestTomorrowReset?.reflection?.gratitude || "Not written yet"}</strong><p>Captured from Journal or Tomorrow Reset.</p></div>
          <div className="journal-reflection-tile"><span>Tomorrow</span><strong>{latestTomorrowReset?.reflection?.tomorrowMainThing || "No main thing yet"}</strong><p>{latestTomorrowReset ? "Saved from your reset." : "Start Tomorrow Reset to set it."}</p></div>
          <div className="journal-reflection-tile"><span>Week</span><strong>{latestWeeklyReset?.intention || latestWeeklyReset?.priorities?.[0] || "No weekly intention"}</strong><p>{latestWeeklyReset ? "Your weekly rhythm is saved." : "Run Weekly Reset when ready."}</p></div>
        </div>
      </div>

      <div className="memory-search-section">
        <input className="memory-search-input" value={memorySearch} onChange={e=>setMemorySearch(e.target.value)} placeholder="Search memories, tags, gratitude, captions…" />
      </div>

      {throwbacks.length > 0 && (
        <div className="memory-throwback-section">
          <div className="journal-entries-title">Then & Now Throwbacks ✨</div>
          <div className="memory-throwback-row">
            {throwbacks.map(([k,e]) => { const mem = normalizeMemoryEntry(e); const cover = memoryEntryCover(mem); const d = localDateFromKey(k) || new Date(TODAY); return (
              <button key={k} className="memory-throwback-card" onClick={() => setViewingKey(k)}>
                {cover ? <img src={memoryPhotoSrc(cover, memoryImageUrls, true)} onError={() => refreshMemoryImage(cover, true)} alt="Throwback"/> : <span>📔</span>}
                <strong>{formatWithDisplayTimezone(d, {month:"short",day:"numeric"})}</strong>
                <small>{mem.note ? mem.note.slice(0,42) + (mem.note.length>42?"…":"") : "A memory from before"}</small>
              </button>
            );})}
          </div>
        </div>
      )}

      {/* Monthly Journal */}
      <div className="memory-book-section">
        <div className="memory-book-head">
          <div>
            <div className="memory-book-title">{formatWithDisplayTimezone(calDate, {month:"long",year:"numeric"})} Journal</div>
            <div className="memory-book-sub">{monthPages} page{monthPages !== 1 ? "s" : ""} • {monthPhotos} photo{monthPhotos !== 1 ? "s" : ""}</div>
          </div>
          <div className="memory-book-actions">
            <button className="topbar-btn icon-only nav-arrow" onClick={() => { const d=new Date(calDate); d.setMonth(d.getMonth()-1); setCalDate(d); }}>‹</button>
            <button className="tf-save journal-today-btn" onClick={() => setEditing(new Date(TODAY))}>+ Add Memory</button>
            <button className="topbar-btn icon-only nav-arrow" onClick={() => { const d=new Date(calDate); d.setMonth(d.getMonth()+1); setCalDate(d); }}>›</button>
          </div>
        </div>
        <div className="memory-filter-row">
          <button className={`memory-tag-chip ${activeTag === "all" ? "selected" : ""}`} onClick={() => setActiveTag("all")}>All</button>
          {monthTags.map(tag => <button key={tag} className={`memory-tag-chip ${activeTag === tag ? "selected" : ""}`} onClick={() => setActiveTag(tag)}>#{tag}</button>)}
        </div>
        <div className="memory-page-grid">
          {calDays.filter(Boolean).map(day => {
            const key = dateKey(day);
            const rawEntry = journal[key];
            const entry = normalizeMemoryEntry(rawEntry);
            const hasEntry = hasJournalEntryForKey(journal, key);
            const matchesFilters = memoryMatchesFilters(key, rawEntry);
            const filteredOut = memoryFiltersActive && !matchesFilters;
            const moodObj = entry.mood ? JOURNAL_MOODS.find(m=>m.id===entry.mood) : null;
            const cover = memoryEntryCover(entry);
            const completedCount = completedTasksForDateKey(tasks, key).length;
            const score = dailyGameSummary(tasks, journal, events, key);
            const isFuture = day > TODAY;
            return (
              <button key={key} className={`memory-page-card ${hasEntry ? "has-memory" : ""} ${isFuture ? "future" : ""} ${filteredOut ? "filtered-out" : ""} ${memoryFiltersActive && matchesFilters ? "filter-match" : ""}`} style={hasEntry ? memoryBackgroundStyle(entry.backgroundId) : undefined} onClick={() => isFuture ? null : (hasEntry ? setViewingKey(key) : setEditing(day))}>
                {cover && <img className="memory-page-cover" src={memoryPhotoSrc(cover, memoryImageUrls, true)} onError={() => refreshMemoryImage(cover, true)} alt={cover.caption || "Memory cover"} />}
                <div className="memory-page-shade" />
                <div className="memory-page-date">{day.getDate()}</div>
                <div className="memory-page-main">
                  <span>{moodObj?.emoji || (hasEntry ? "📔" : "＋")}</span>
                  {hasEntry && <strong>{score.rank}</strong>}
                </div>
                {hasEntry && <div className="memory-page-meta">{completedCount}✓ {entry.photos.length}📷</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent entries list */}
      <div className="journal-entries-section journal-recent-list-section">
        <div className="journal-entries-title">{memoryFiltersActive ? "Matching Memories" : "Recent Entries"}</div>
        {searchableEntries
          .slice(0,10)
          .map(([key, entry]) => {
            const d = localDateFromKey(key) || new Date(TODAY);
            const mem = normalizeMemoryEntry(entry);
            const moodObj = JOURNAL_MOODS.find(m=>m.id===mem.mood);
            const cover = memoryEntryCover(mem);
            const acts = (mem.activities||[]).map(id=>activitiesCatalog.find(a=>a.id===id)).filter(Boolean);
            const completedCount = completedTasksForDateKey(tasks, key).length;
            return (
              <div key={key} className="journal-entry-card" onClick={() => setViewingKey(key)}>
                <div className="jec-left">
                  {cover ? <img className="jec-cover" src={memoryPhotoSrc(cover, memoryImageUrls, true)} onError={() => refreshMemoryImage(cover, true)} alt={cover.caption || "Memory cover"} /> : (moodObj && <span className="jec-emoji" style={{"--mc":moodObj.color}}>{moodObj.emoji}</span>)}
                </div>
                <div className="jec-body">
                  <div className="jec-date">{formatWithDisplayTimezone(d, {weekday:"short",month:"short",day:"numeric"})}</div>
                  {moodObj && <div className="jec-mood" style={{color:moodObj.color}}>{moodObj.label}</div>}
                  {acts.length>0 && <div className="jec-acts">{acts.slice(0,5).map(a=><span key={a.id}>{a.emoji}</span>)}</div>}
                  {mem.note && <div className="jec-note">{mem.note.slice(0,80)}{mem.note.length>80?"…":""}</div>}
                  {mem.gratitude?.some(g=>g) && <div className="jec-gratitude">🌸 {mem.gratitude.filter(g=>g)[0]}</div>}
                  {mem.tags?.length > 0 && <div className="jec-tags">{mem.tags.slice(0,3).map(t => <span key={t}>#{t}</span>)}</div>}
                  {mem.photos.length > 0 && <div className="jec-gratitude">📷 {mem.photos.length} photo{mem.photos.length !== 1 ? "s" : ""}</div>}
                  {completedCount > 0 && <div className="jec-gratitude">✅ {completedCount} task{completedCount !== 1 ? "s" : ""} completed</div>}
                </div>
                <div className="jec-arrow">›</div>
              </div>
            );
          })}
        {Object.keys(journal).length === 0 && (
          <div className="journal-empty">
            <div className="journal-empty-icon">📔</div>
            <div className="journal-empty-title">No entries yet</div>
            <div className="journal-empty-sub">Tap &quot;+ Add Memory&quot; to create your first page</div>
            <button className="tf-save" style={{marginTop:16}} onClick={() => setEditing(new Date(TODAY))}>Create memory 🌸</button>
          </div>
        )}
      </div>


      {memorySettingsOpen && (
        <div className="modal-overlay memory-settings-overlay" onClick={() => setMemorySettingsOpen(false)} role="dialog" aria-modal="true" aria-label="Memory Settings">
          <div className="entry-modal memory-settings-modal" onClick={e => e.stopPropagation()}>
            <div className="entry-modal-header">
              <div><div className="entry-modal-date">Memory Settings</div><div className="entry-modal-sub">Manage activities, tags, backgrounds, and stickers</div></div>
              <button className="modal-close" onClick={() => setMemorySettingsOpen(false)}>✕</button>
            </div>
            <div className="entry-modal-body">
              <div className="entry-section">
                <div className="entry-section-title">Activities</div>
                {[...new Set((activitiesCatalog || []).map(a => a.group || "Custom"))].map(group => (
                  <div key={group} className="manager-group-card">
                    <div className="manager-group-head">{group}</div>
                    {(activitiesCatalog || []).filter(a => (a.group || "Custom") === group && !a.archived).map(a => (
                      <div key={a.id} className={`manager-row draggable-manager-row ${dragActivityId===a.id?"dragging":""}`} draggable onDragStart={() => setDragActivityId(a.id)} onDragOver={e => e.preventDefault()} onDrop={() => { if (dragActivityId && dragActivityId !== a.id) onReorderActivities?.(dragActivityId, a.id); setDragActivityId(null); }} onDragEnd={() => setDragActivityId(null)}>
                        <span className="drag-handle" title="Drag to reorder">⋮⋮</span>
                        <span className="manager-chip">{a.emoji} {a.label}</span>
                        <span className="manager-count">{allActivitiesUsage[a.id] || 0} uses</span>
                        <button type="button" onClick={() => { const label = window.prompt("Rename activity", a.label); if (!label?.trim()) return; const emoji = window.prompt("Emoji", a.emoji || "✨") || a.emoji || "✨"; onUpdateActivity?.(a.id, { label: label.trim(), emoji: emoji.trim() || "✨" }); }}>Edit</button>
                        <button type="button" onClick={() => { if (window.confirm(`Archive ${a.emoji || ""} ${a.label}? Old memories will keep their label.`)) onDeleteActivity?.(a.id); }}>Archive</button>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="tf-row" style={{marginTop:10}}><button className="tf-save" onClick={() => { const label = window.prompt("New activity name"); if (!label?.trim()) return; const emoji = window.prompt("Emoji", "✨") || "✨"; const group = window.prompt("Group", "Custom") || "Custom"; onAddActivity?.(label.trim(), group.trim() || "Custom", emoji.trim() || "✨"); }}>+ Add activity</button></div>
              </div>
              <div className="entry-section">
                <div className="entry-section-title">Memory Tags</div>
                {Object.keys(allTagUsage).length === 0 && <div className="scrapbook-empty-note">No tags yet. Add tags while creating a memory.</div>}
                {Object.keys(allTagUsage).sort().map(tag => (
                  <div key={tag} className="manager-row">
                    <span className="manager-chip">#{tag}</span><span className="manager-count">{allTagUsage[tag]} uses</span>
                    <button type="button" onClick={() => { const next = window.prompt("Rename memory tag", tag); if (next?.trim()) onUpdateMemoryTag?.(tag, next.trim()); }}>Rename</button>
                    <button type="button" onClick={() => { const into = window.prompt("Merge into which tag?"); if (into?.trim()) onUpdateMemoryTag?.(tag, into.trim()); }}>Merge</button>
                    <button type="button" onClick={() => { if (window.confirm(`Delete #${tag} from all memories?`)) onDeleteMemoryTag?.(tag); }}>Delete</button>
                  </div>
                ))}
              </div>
              <div className="entry-section"><div className="entry-section-title">Backgrounds</div><div className="memory-background-picker">{MEMORY_BACKGROUNDS.map(bg => <span key={bg.id} className="memory-bg-choice"><span className="memory-bg-swatch" style={bg.src ? {backgroundImage:`url(${bg.src})`} : {}} /> <span>{bg.label}</span></span>)}</div></div>
              <div className="entry-section"><div className="entry-section-title">Stickers</div><div className="sticker-asset-picker-row compact sticker-pack-preview-row">{(Core.MEMORY_STICKER_PACKS || [{ id: "cozy", label: "Cozy", stickers: COZY_STICKER_PACK }]).flatMap(pack => (pack.stickers || []).slice(0, 12).map(st => <span key={`${pack.id}-${st.id}`} className="sticker-preview-chip"><img src={st.src} alt={st.label} onError={e => { e.currentTarget.style.display = "none"; }} /><span className="sticker-choice-label">{st.number || st.label}</span></span>))}</div></div>
            </div>
          </div>
        </div>
      )}

      {/* View entry modal */}
      {viewingKey && journal[viewingKey] && (() => {
        const entry = normalizeMemoryEntry(journal[viewingKey]);
        const d = localDateFromKey(viewingKey) || new Date(TODAY);
        const moodObj = JOURNAL_MOODS.find(m=>m.id===entry.mood);
        const cover = memoryEntryCover(entry);
        const acts = (entry.activities||[]).map(id=>activitiesCatalog.find(a=>a.id===id)).filter(Boolean);
        const completedTasks = completedTasksForDateKey(tasks, viewingKey);
        const dayScore = dailyGameSummary(tasks, journal, events, viewingKey);
        const journalDecorations = normalizeScrapbookBlocksForSave(entry.blocks);
        const isDecorating = decoratingKey === viewingKey;
        const visibleDecorations = isDecorating ? decorDraftBlocks : journalDecorations;
        return (
          <div className={`modal-overlay ${isDecorating ? "journal-decorating-overlay" : ""}`} onClick={closeViewingMemory} role="dialog" aria-modal="true" aria-label="View journal entry">
            <div className={`entry-view-modal memory-bg-${entry.backgroundId || "plain"} ${isDecorating ? "decorating" : ""}`} style={memoryBackgroundStyle(entry.backgroundId)} onClick={e=>e.stopPropagation()}>
              <div className="entry-modal-header">
                <div>
                  <div className="entry-modal-date">{formatWithDisplayTimezone(d, {weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>
                  {moodObj && <div className="entry-view-mood" style={{color:moodObj.color}}>{moodObj.emoji} {moodObj.label}</div>}
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
                  {!isDecorating && allowDecorationEditing && <button className="tf-save decorate-entry-btn" style={{fontSize:11}} onClick={() => startDecoratingMemory(viewingKey)}>Decorate 🎀</button>}
                  {!isDecorating && <button className="tf-cancel" style={{fontSize:11}} onClick={() => { if (!stopDecoratingMemory()) return; setEditing(d); setViewingKey(null); }}>Edit Memory</button>}
                  {isDecorating && <button className="tf-save" style={{fontSize:11}} onClick={(e) => { e.stopPropagation(); saveDecorations(); }} disabled={savingDecorations}>{savingDecorations ? "Saving…" : "Done ✓"}</button>}
                  {isDecorating && <button className="tf-cancel" style={{fontSize:11}} onClick={(e) => { e.stopPropagation(); stopDecoratingMemory(); }}>Cancel</button>}
                  <button className="modal-close" onClick={(e) => { e.stopPropagation(); closeViewingMemory(); }}>✕</button>
                </div>
              </div>
              {isDecorating && (
                <JournalDecorationControls
                  blocks={decorDraftBlocks}
                  setBlocks={setDecorDraftBlocks}
                  selectedBlockId={selectedDecorationId}
                  setSelectedBlockId={setSelectedDecorationId}
                  onSave={saveDecorations}
                  onCancel={() => stopDecoratingMemory()}
                  saving={savingDecorations}
                  onHistoryCheckpoint={recordDecorationHistoryCheckpoint}
                  canUndo={decorUndoStack.length > 0}
                  canRedo={decorRedoStack.length > 0}
                  onUndo={undoDecorationChange}
                  onRedo={redoDecorationChange}
                />
              )}
              <div className="entry-view-body">
                <div className="entry-view-scroll-content">
                  <JournalDecorationCanvas
                    blocks={visibleDecorations}
                    setBlocks={isDecorating ? setDecorDraftBlocks : undefined}
                    selectedBlockId={isDecorating ? selectedDecorationId : null}
                    setSelectedBlockId={isDecorating ? setSelectedDecorationId : undefined}
                    editing={isDecorating}
                    onHistoryCheckpoint={isDecorating ? recordDecorationHistoryCheckpoint : undefined}
                  />
                  {cover && <div className="memory-cover-hero"><img src={memoryPhotoSrc(cover, memoryImageUrls)} onError={() => refreshMemoryImage(cover)} alt={cover.caption || "Memory cover"}/>{cover.caption && <div>{cover.caption}</div>}</div>}
                {entry.tags.length > 0 && <div className="entry-view-section"><div className="entry-section-title">Memory Tags</div><div className="memory-tag-row">{entry.tags.map(t => <span key={t} className="memory-tag-chip selected">#{t}</span>)}</div></div>}
                {entry.photos.length > 0 && <div className="entry-view-section"><div className="entry-section-title">Photos</div><div className="memory-photo-view-grid">{entry.photos.map(p => <figure key={p.id} className="memory-photo-view-card"><img src={memoryPhotoSrc(p, memoryImageUrls)} onError={() => refreshMemoryImage(p)} alt={p.caption || "Memory photo"}/>{p.caption && <figcaption>{p.caption}</figcaption>}</figure>)}</div></div>}
                {acts.length>0 && <div className="entry-view-section"><div className="entry-section-title">Activities</div><div className="activity-chips">{acts.map(a=><span key={a.id} className="activity-chip selected">{a.emoji} {a.label}</span>)}</div></div>}
                {Object.values(entry.highlights || {}).some(Boolean) && <div className="entry-view-section"><div className="entry-section-title">Today’s Highlights ✨</div><div className="highlight-view-grid">{entry.highlights.best && <div><span>Best moment</span><strong>{entry.highlights.best}</strong></div>}{entry.highlights.win && <div><span>Biggest win</span><strong>{entry.highlights.win}</strong></div>}{entry.highlights.learned && <div><span>Learned</span><strong>{entry.highlights.learned}</strong></div>}{entry.highlights.remember && <div><span>Remember</span><strong>{entry.highlights.remember}</strong></div>}</div></div>}
                {entry.gratitude?.some(g=>g) && <div className="entry-view-section"><div className="entry-section-title">Gratitude 🌸</div>{entry.gratitude.filter(g=>g).map((g,i)=><div key={i} className="gratitude-view-item">✦ {g}</div>)}</div>}
                {entry.note && <div className="entry-view-section"><div className="entry-section-title">Journal</div><div className="entry-view-note">{entry.note}</div></div>}
                <div className="entry-view-section daily-score-section">
                  <div className="entry-section-title">Daily Score 🌸</div>
                  <div className="daily-score-card">
                    <div className="daily-score-main"><span className="daily-score-rank">{dayScore.rank}</span><span className="daily-score-num">{dayScore.score}/100</span></div>
                    <div className="daily-score-lines">
                      <span>✅ {dayScore.completed.length} task{dayScore.completed.length !== 1 ? "s" : ""}</span>
                      <span>🎯 {dayScore.highDone} priority</span>
                      <span>📔 {dayScore.journalDone ? "Journal done" : "No journal"}</span>
                    </div>
                  </div>
                </div>
                {completedTasks.length > 0 && (
                  <div className="entry-view-section completed-tasks-section">
                    <div className="entry-section-title">Completed Tasks ✅</div>
                    <div className="completed-task-list">
                      {completedTasks.map(t => (
                        <div key={t.id} className="completed-task-item">
                          <span className="completed-task-check">✓</span>
                          <div className="completed-task-body">
                            <div className="completed-task-title">{t.title}</div>
                            <div className="completed-task-meta">{formatTaskDuration(t.duration)}{t.priority ? ` • ${PRIORITIES.find(p=>p.id===t.priority)?.label || t.priority}` : ""}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {allowDecorationEditing && decoratePromptKey && journal[decoratePromptKey] && (
        <div className="modal-overlay decorate-after-save-overlay" onClick={() => setDecoratePromptKey(null)} role="dialog" aria-modal="true" aria-label="Decorate saved memory">
          <div className="decorate-after-save-card" onClick={e => e.stopPropagation()}>
            <div className="decorate-after-save-icon">🎀</div>
            <strong>Memory saved</strong>
            <p>Want to decorate the saved journal entry now? You’ll place tape and stickers directly on the final memory view.</p>
            <div className="decorate-after-save-actions">
              <button type="button" className="tf-cancel" onClick={() => setDecoratePromptKey(null)}>Not now</button>
              <button type="button" className="tf-save" onClick={() => startDecoratingMemory(decoratePromptKey)}>Decorate now</button>
            </div>
          </div>
        </div>
      )}

      {editing && <DayEntryModal date={editing} entry={journal[dateKey(editing)]} onSave={saveEntry} onClose={() => setEditing(null)} onSaved={(key) => { setEditing(null); setViewingKey(key); if (allowDecorationEditing) setDecoratePromptKey(key); }} activitiesCatalog={activitiesCatalog} memoryTagsCatalog={memoryTagsCatalog} onAddActivity={onAddActivity} onUpdateActivity={onUpdateActivity} onDeleteActivity={onDeleteActivity} onAddMemoryTag={onAddMemoryTag} onUpdateMemoryTag={onUpdateMemoryTag} onDeleteMemoryTag={onDeleteMemoryTag} onReorderActivities={onReorderActivities} userId={userId} imageUrls={memoryImageUrls} onQueuePhotoCleanup={onQueuePhotoCleanup} />}
    </div>
  );
}

// Planning modals moved to components/planning/PlanningModals.jsx.

// DailyCheckInModal moved to components/checkins/CheckInReset.jsx.

// Affirmations are intentionally a Today-only card; the old standalone page was removed during the pre-Phase 22 audit.
