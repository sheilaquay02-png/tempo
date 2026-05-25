// Journal decoration model helpers extracted from TempoApp.
// These are deliberately pure/data-only to preserve the existing editor behavior.

import { COZY_STICKER_PACK, uid } from "../core.js";

export const JOURNAL_DECORATION_DEFAULTS = {
  tape: { x: 10, y: 18, w: 42, h: 14, rotate: -2 },
  sticker: { x: 68, y: 10, w: 18, h: 14, rotate: 0 },
};

export const JOURNAL_DECORATION_HISTORY_LIMIT = 40;
export const JOURNAL_DECORATION_SAFE_TYPES = new Set(["tape", "sticker", "text", "quote"]);
export const scrapbookClamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const scrapbookNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export function scrapbookItemType(item) {
  const raw = item?.type;
  if (raw === "sticker") return "sticker";
  if (raw === "tape" || raw === "text" || raw === "quote") return "tape";
  return null;
}

export function scrapbookItemLabel(type) {
  return type === "sticker" ? "Sticker" : "Tape note";
}

export function scrapbookItemLayout(item = {}, index = 0) {
  const type = scrapbookItemType(item) || "tape";
  const fallback = JOURNAL_DECORATION_DEFAULTS[type] || JOURNAL_DECORATION_DEFAULTS.tape;
  const stagger = (index % 6) * 5;
  const minX = -12;
  const minY = -8;
  const maxEdge = 112;
  const w = scrapbookClamp(scrapbookNumber(item.w, fallback.w), type === "sticker" ? 8 : 16, 110);
  const h = scrapbookClamp(scrapbookNumber(item.h, fallback.h), type === "sticker" ? 8 : 8, 82);
  const x = scrapbookClamp(scrapbookNumber(item.x, fallback.x + stagger), minX, maxEdge);
  const y = scrapbookClamp(scrapbookNumber(item.y, fallback.y + stagger), minY, maxEdge);
  return {
    x: scrapbookClamp(x, minX, Math.max(minX, maxEdge - Math.min(w, 110))),
    y: scrapbookClamp(y, minY, Math.max(minY, maxEdge - Math.min(h, 82))),
    w,
    h,
    rotate: scrapbookClamp(scrapbookNumber(item.rotate, fallback.rotate || 0), -180, 180),
    z: scrapbookNumber(item.z, index + 1),
  };
}

export function makeScrapbookItem(type = "sticker", index = 0) {
  const cleanType = type === "sticker" ? "sticker" : "tape";
  const layout = scrapbookItemLayout({ type: cleanType }, index);
  const base = { id: `b${uid()}`, type: cleanType, ...layout };
  if (cleanType === "sticker") return { ...base, sticker: "🌸", stickerAsset: COZY_STICKER_PACK[0]?.src || null, flipX: false, flipY: false };
  return { ...base, text: "" };
}

export function scrapbookTextFitStyle(item = {}, layout = {}, type = "tape") {
  const text = String(item?.text || "");
  const chars = text.replace(/\s+/g, " ").trim().length || 1;
  const lines = Math.max(1, text.split(/\n/).length);
  const area = Math.max(1, scrapbookNumber(layout.w, 40) * scrapbookNumber(layout.h, 16));
  const density = chars / area;
  let size = 13;
  if (density > 0.085 || lines > 2) size = 12;
  if (density > 0.125 || lines > 3) size = 11;
  if (density > 0.18 || lines > 4) size = 10;
  if (density > 0.27 || lines > 5) size = 9;
  if (density > 0.38 || lines > 6) size = 8;
  if (layout.h < 11) size = Math.min(size, 10);
  if (layout.w < 18) size = Math.min(size, 9);
  const line = size <= 9 ? 1.16 : size <= 11 ? 1.24 : 1.34;
  return {
    "--scrapbook-text-size": `${size}px`,
    "--scrapbook-text-line": line,
  };
}

export function scrapbookStickerFlipStyle(item = {}) {
  return {
    transform: `scale(${item?.flipX ? -1 : 1}, ${item?.flipY ? -1 : 1})`,
  };
}

export function normalizeScrapbookBlocksForSave(blocks = []) {
  return (Array.isArray(blocks) ? blocks : [])
    .filter(block => JOURNAL_DECORATION_SAFE_TYPES.has(block?.type))
    .map((block, index) => {
      const type = scrapbookItemType(block);
      if (!type) return null;
      const layout = scrapbookItemLayout({ ...block, type }, index);
      const hasPxLayout = [block?.xPx, block?.yPx, block?.wPx, block?.hPx].every(v => Number.isFinite(Number(v)));
      return {
        id: block?.id || `b${uid()}`,
        type,
        text: type === "tape" ? (block?.text || "") : "",
        sticker: block?.sticker || "🌸",
        stickerAsset: block?.stickerAsset || null,
        flipX: Boolean(block?.flipX),
        flipY: Boolean(block?.flipY),
        ...layout,
        ...(hasPxLayout ? {
          coord: "px",
          xPx: Math.round(Number(block.xPx) * 10) / 10,
          yPx: Math.round(Number(block.yPx) * 10) / 10,
          wPx: Math.max(24, Math.round(Number(block.wPx) * 10) / 10),
          hPx: Math.max(24, Math.round(Number(block.hPx) * 10) / 10),
          ...(Number.isFinite(Number(block.boardW)) ? { boardW: Math.max(1, Math.round(Number(block.boardW) * 10) / 10) } : {}),
          ...(Number.isFinite(Number(block.boardH)) ? { boardH: Math.max(1, Math.round(Number(block.boardH) * 10) / 10) } : {}),
        } : {}),
      };
    })
    .filter(Boolean);
}
