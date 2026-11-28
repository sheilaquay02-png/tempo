// Room furniture: what exists, what it costs, and how your saved room layout becomes a scene.
// Pictures live in public/game/room/room/. "starter" pieces are yours for free (your original room,
// including the pieces you put away); everything with a price can be bought at the General Store.
// Prices are whole numbers of finished tasks at 3 🌸 each (e.g. 12 = 4 tasks, 45 = 15 tasks).
import { ROOM_LAYOUT } from "./roomLayout.js";

const floor = "object";
export const FURNITURE = [
  // your original room
  { id: "bed", name: "Gingham bed", src: "room/bed.png", layer: floor, size: [275, 360], solid: [-130, -170, 260, 170], tap: { name: "Bed", opens: "Goodnight (night mode)", action: "night" }, starter: 1 },
  { id: "nightstand", name: "Nightstand & lamp", src: "room/nightstand_lamp.png", layer: floor, size: [132, 235], solid: [-60, -60, 120, 60], tap: { name: "Bedside lamp", opens: "Day / night", action: "night" }, starter: 1 },
  { id: "desk", name: "Heart desk", src: "room/desk_workspace_group.png", layer: floor, size: [436, 485], solid: [-190, -110, 380, 110], tap: { name: "Desk and computer", opens: "Today", action: "today" }, starter: 1 },
  { id: "window_seat", name: "Window seat", src: "room/window_seat.png", layer: floor, size: [570, 420], solid: [-270, -110, 540, 110], tap: { name: "Window", opens: "Calendar", action: "calendar" }, starter: 1 },
  { id: "storage_shelf", name: "Storage shelf", src: "room/storage_shelf_group.png", layer: "wall", size: [350, 235], tap: { name: "Storage shelf", opens: "Tasks", action: "tasks" }, starter: 1 },
  { id: "books_shelf", name: "Book shelf", src: "room/books_wall_shelf.png", layer: "wall", size: [400, 230], tap: { name: "Bookshelf", opens: "Tasks", action: "tasks" }, starter: 1 },
  { id: "pet_station", name: "Food & water", src: "room/pet_feeding_station.png", layer: floor, size: [340, 228], solid: [-155, -75, 310, 75], tap: { name: "Food and water", opens: "Dress up the dogs", action: "pets" }, starter: 1 },
  { id: "big_plant", name: "Big leafy plant", src: "room/large_floor_plant.png", layer: floor, size: [160, 300], solid: [-55, -45, 110, 45], starter: 2, price: 21 },
  { id: "small_plant", name: "Little potted plant", src: "room/small_potted_plant.png", layer: floor, size: [110, 125], solid: [-40, -30, 80, 30], starter: 1, price: 12 },
  // pieces you put away earlier (free, waiting in storage)
  { id: "pot_plant", name: "Pink pot plant", src: "room/potted_plant_variant.png", layer: floor, size: [120, 204], solid: [-45, -35, 90, 35], starter: 1, price: 15 },
  { id: "flower_art", name: "Flower picture", src: "room/flower_wall_art_angled.png", layer: "wall", size: [150, 250], starter: 1, price: 18 },
  { id: "heart_art", name: "Heart picture", src: "room/heart_wall_art.png", layer: "wall", size: [100, 180], starter: 1, price: 15 },
  { id: "cabinet", name: "Bookshelf cabinet", src: "room/bookshelf_cabinet.png", layer: floor, size: [230, 520], solid: [-110, -90, 220, 90], tap: { name: "Cabinet", opens: "Tasks", action: "tasks" }, starter: 1, price: 45 },
  // new at the General Store
  { id: "flower_art_front", name: "Flower frame", src: "room/flower_wall_art_front.png", layer: "wall", size: [140, 180], price: 18 },
  { id: "hanging_planter", name: "Hanging planter", src: "room/hanging_planter.png", layer: "wall", size: [130, 220], price: 24 },
  { id: "wall_shelf", name: "Little wall shelf", src: "room/storage_wall_shelf.png", layer: "wall", size: [300, 190], price: 30 },
  { id: "swivel_chair", name: "Pink swivel chair", src: "room/swivel_chair.png", layer: floor, size: [150, 220], solid: [-45, -30, 90, 30], price: 36 },
];
export const FURNITURE_BY_ID = Object.fromEntries(FURNITURE.map(f => [f.id, f]));
export const STORE_ITEMS = FURNITURE.filter(f => f.price);

// your original room (before any editing): the approved room layout
const ORIGINAL_ITEM = { plant_window: "small_plant", plant_left: "big_plant", plant_bottom_right: "big_plant" };
export const DEFAULT_ROOM = ROOM_LAYOUT.objects
  .filter(o => FURNITURE_BY_ID[ORIGINAL_ITEM[o.id] || o.id])
  .map(o => ({ uid: o.id, item: ORIGINAL_ITEM[o.id] || o.id, box: o.box.slice() }));

export const placedPieces = game => (Array.isArray(game?.room) ? game.room : DEFAULT_ROOM)
  .filter(p => FURNITURE_BY_ID[p.item]);

// how many of each piece you own (free starters + bought) minus those standing in the room
export function storageCounts(game, placed = placedPieces(game)) {
  const counts = {};
  for (const f of FURNITURE) counts[f.id] = (f.starter || 0) + ((game?.owned || {})[f.id] || 0);
  for (const p of placed) counts[p.item] = (counts[p.item] || 0) - 1;
  return Object.fromEntries(Object.entries(counts).filter(([, n]) => n > 0));
}

// a scene object for one placed piece
export function sceneObject(piece) {
  const f = FURNITURE_BY_ID[piece.item];
  return { id: piece.uid, item: f.id, src: f.src, box: piece.box.slice(), layer: f.layer, ...(f.solid ? { solid: f.solid } : {}), ...(f.tap ? { tap: f.tap } : {}) };
}

// the room scene for your saved layout
export function roomLayoutFor(game) {
  return { ...ROOM_LAYOUT, objects: placedPieces(game).map(sceneObject) };
}

// where a piece goes when you take it out of storage: middle of the floor, or high on the back wall
export function newPiece(itemId, existingUids = []) {
  const f = FURNITURE_BY_ID[itemId]; if (!f) return null;
  let n = 1; while (existingUids.includes(`${itemId}-${n}`)) n++;
  const [w, h] = f.size;
  const box = f.layer === "wall" ? [Math.round(768 - w / 2), 70, w, h] : [Math.round(768 - w / 2), 760 - h, w, h];
  return { uid: `${itemId}-${n}`, item: itemId, box };
}
