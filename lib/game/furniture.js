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
  // Tempo_Room_Furniture pack (General Store). Pictures: public/game/room/furniture/<cat>/.
  // Sizes are set per piece (the pack isn't drawn at one scale); "ground" pieces are rugs you walk over.
  { id: "candle", name: "Candle", cat: "decor", src: "furniture/decor/candle.png", layer: floor, size: [48, 45], price: 12 },
  { id: "flower_glass_dome", name: "Flower glass dome", cat: "decor", src: "furniture/decor/flower_glass_dome.png", layer: floor, size: [58, 70], price: 12 },
  { id: "hourglass", name: "Hourglass", cat: "decor", src: "furniture/decor/hourglass.png", layer: floor, size: [39, 55], price: 12 },
  { id: "pink_book_stack", name: "Pink book stack", cat: "decor", src: "furniture/decor/pink_book_stack.png", layer: floor, size: [53, 45], price: 12 },
  { id: "pink_storage_box", name: "Pink storage box", cat: "decor", src: "furniture/decor/pink_storage_box.png", layer: floor, size: [61, 45], price: 12 },
  { id: "reed_diffuser", name: "Reed diffuser", cat: "decor", src: "furniture/decor/reed_diffuser.png", layer: floor, size: [40, 60], price: 12 },
  { id: "toy_basket", name: "Toy basket", cat: "decor", src: "furniture/decor/toy_basket.png", layer: floor, size: [179, 130], solid: [-72, -29, 143, 29], price: 24 },
  { id: "compact_laptop_desk", name: "Compact laptop desk", cat: "desks", src: "furniture/desks/compact_laptop_desk.png", layer: floor, size: [485, 330], solid: [-194, -73, 388, 73], tap: { name: "Desk", opens: "Today", action: "today" }, price: 45 },
  { id: "compact_desk_alt", name: "Compact desk (cream)", cat: "desks", src: "furniture/desks/compact_desk_alt.png", layer: floor, size: [499, 330], solid: [-200, -73, 399, 73], tap: { name: "Desk", opens: "Today", action: "today" }, price: 45 },
  { id: "compact_desk_mini", name: "Compact desk (small)", cat: "desks", src: "furniture/desks/compact_desk_mini.png", layer: floor, size: [377, 250], solid: [-151, -55, 302, 55], tap: { name: "Desk", opens: "Today", action: "today" }, price: 39 },
  { id: "corner_desk", name: "Corner desk", cat: "desks", src: "furniture/desks/corner_desk.png", layer: floor, size: [493, 300], solid: [-197, -66, 394, 66], tap: { name: "Desk", opens: "Today", action: "today" }, price: 45 },
  { id: "monitor_desk", name: "Monitor desk", cat: "desks", src: "furniture/desks/monitor_desk.png", layer: floor, size: [454, 300], solid: [-182, -66, 363, 66], tap: { name: "Desk", opens: "Today", action: "today" }, price: 45 },
  { id: "shelf_backed_desk", name: "Shelf desk", cat: "desks", src: "furniture/desks/shelf_backed_desk.png", layer: floor, size: [577, 420], solid: [-231, -80, 462, 80], tap: { name: "Desk", opens: "Today", action: "today" }, price: 45 },
  { id: "shelf_backed_desk_alt", name: "Shelf desk (cream)", cat: "desks", src: "furniture/desks/shelf_backed_desk_alt.png", layer: floor, size: [576, 410], solid: [-230, -80, 461, 80], tap: { name: "Desk", opens: "Today", action: "today" }, price: 45 },
  { id: "shelf_desk_mini", name: "Shelf desk (small)", cat: "desks", src: "furniture/desks/shelf_desk_mini.png", layer: floor, size: [431, 320], solid: [-172, -70, 345, 70], tap: { name: "Desk", opens: "Today", action: "today" }, price: 45 },
  { id: "vanity_with_stool", name: "Vanity & stool", cat: "desks", src: "furniture/desks/vanity_with_stool.png", layer: floor, size: [280, 360], solid: [-112, -79, 224, 79], tap: { name: "Desk", opens: "Today", action: "today" }, price: 42 },
  { id: "complete_home_gym", name: "Home gym set", cat: "gym", src: "furniture/gym/complete_home_gym.png", layer: floor, size: [503, 420], solid: [-201, -80, 402, 80], price: 45 },
  { id: "dumbbell_rack", name: "Dumbbell rack", cat: "gym", src: "furniture/gym/dumbbell_rack.png", layer: floor, size: [175, 150], solid: [-70, -33, 140, 33], price: 24 },
  { id: "gym_potted_plant", name: "Gym plant", cat: "gym", src: "furniture/gym/gym_potted_plant.png", layer: floor, size: [130, 160], solid: [-52, -35, 104, 35], price: 21 },
  { id: "gym_wall_art", name: "Dumbbell picture", cat: "gym", src: "furniture/gym/gym_wall_art.png", layer: "wall", size: [103, 120], price: 18 },
  { id: "gym_wall_shelf", name: "Gym wall shelf", cat: "gym", src: "furniture/gym/gym_wall_shelf.png", layer: "wall", size: [261, 150], price: 27 },
  { id: "incline_bench", name: "Incline bench", cat: "gym", src: "furniture/gym/incline_bench.png", layer: floor, size: [187, 200], solid: [-75, -44, 150, 44], price: 27 },
  { id: "pink_exercise_mat", name: "Pink exercise mat", cat: "gym", src: "furniture/gym/pink_exercise_mat.png", layer: "ground", size: [220, 50], price: 18 },
  { id: "resistance_band_towel_rail", name: "Bands & towel rail", cat: "gym", src: "furniture/gym/resistance_band_towel_rail.png", layer: "wall", size: [256, 110], price: 24 },
  { id: "rolled_yoga_mat", name: "Rolled yoga mat", cat: "gym", src: "furniture/gym/rolled_yoga_mat.png", layer: floor, size: [69, 160], solid: [-28, -35, 55, 35], price: 18 },
  { id: "arched_floor_lamp", name: "Arched floor lamp", cat: "lighting", src: "furniture/lighting/arched_floor_lamp.png", layer: floor, size: [210, 300], solid: [-84, -66, 168, 66], price: 33 },
  { id: "floor_lamp", name: "Floor lamp", cat: "lighting", src: "furniture/lighting/floor_lamp.png", layer: floor, size: [129, 320], solid: [-52, -70, 103, 70], price: 30 },
  { id: "heart_table_lamp", name: "Heart table lamp", cat: "lighting", src: "furniture/lighting/heart_table_lamp.png", layer: floor, size: [103, 130], solid: [-41, -29, 82, 29], price: 18 },
  { id: "shoji_lantern", name: "Paper lantern", cat: "lighting", src: "furniture/lighting/shoji_lantern.png", layer: floor, size: [99, 150], solid: [-40, -33, 79, 33], price: 21 },
  { id: "hanging_terrarium", name: "Hanging terrarium", cat: "plants", src: "furniture/plants/hanging_terrarium.png", layer: "wall", size: [90, 120], price: 18 },
  { id: "hanging_trailing_plant", name: "Hanging trailing plant", cat: "plants", src: "furniture/plants/hanging_trailing_plant.png", layer: "wall", size: [135, 170], price: 24 },
  { id: "macrame_hanging_plant", name: "Macramé plant", cat: "plants", src: "furniture/plants/macrame_hanging_plant.png", layer: "wall", size: [125, 180], price: 24 },
  { id: "small_hanging_plant", name: "Small hanging plant", cat: "plants", src: "furniture/plants/small_hanging_plant.png", layer: "wall", size: [114, 120], price: 18 },
  { id: "potted_cherry_blossom", name: "Potted cherry blossom", cat: "plants", src: "furniture/plants/potted_cherry_blossom.png", layer: floor, size: [179, 260], solid: [-72, -57, 143, 57], price: 30 },
  { id: "cream_oval_rug", name: "Cream oval rug", cat: "rugs", src: "furniture/rugs/cream_oval_rug.png", layer: "ground", size: [300, 144], price: 30 },
  { id: "flower_round_rug", name: "Flower round rug", cat: "rugs", src: "furniture/rugs/flower_round_rug.png", layer: "ground", size: [360, 286], price: 42 },
  { id: "gingham_mat", name: "Gingham mat", cat: "rugs", src: "furniture/rugs/gingham_mat.png", layer: "ground", size: [240, 151], price: 27 },
  { id: "gingham_rectangular_rug", name: "Gingham rug", cat: "rugs", src: "furniture/rugs/gingham_rectangular_rug.png", layer: "ground", size: [440, 220], price: 42 },
  { id: "pink_border_oval_rug", name: "Pink oval rug", cat: "rugs", src: "furniture/rugs/pink_border_oval_rug.png", layer: "ground", size: [300, 176], price: 33 },
  { id: "pink_flower_rug", name: "Pink flower rug", cat: "rugs", src: "furniture/rugs/pink_flower_rug.png", layer: "ground", size: [240, 167], price: 27 },
  { id: "tatami_mat", name: "Tatami mat", cat: "rugs", src: "furniture/rugs/tatami_mat.png", layer: "ground", size: [280, 150], price: 30 },
  { id: "armchair", name: "Armchair", cat: "seating", src: "furniture/seating/armchair.png", layer: floor, size: [198, 190], solid: [-79, -42, 158, 42], price: 27 },
  { id: "cream_floor_chair", name: "Cream floor chair", cat: "seating", src: "furniture/seating/cream_floor_chair.png", layer: floor, size: [174, 140], solid: [-70, -31, 139, 31], price: 24 },
  { id: "flower_beanbag", name: "Flower beanbag", cat: "seating", src: "furniture/seating/flower_beanbag.png", layer: floor, size: [178, 170], solid: [-71, -37, 142, 37], price: 24 },
  { id: "pink_floor_chair", name: "Pink floor chair", cat: "seating", src: "furniture/seating/pink_floor_chair.png", layer: floor, size: [172, 140], solid: [-69, -31, 138, 31], price: 24 },
  { id: "pink_floor_cushion", name: "Pink floor cushion", cat: "seating", src: "furniture/seating/pink_floor_cushion.png", layer: "ground", size: [110, 74], price: 15 },
  { id: "round_pouf", name: "Round pouf", cat: "seating", src: "furniture/seating/round_pouf.png", layer: floor, size: [135, 90], price: 18 },
  { id: "shark_beanbag", name: "Shark beanbag", cat: "seating", src: "furniture/seating/shark_beanbag.png", layer: floor, size: [193, 150], solid: [-77, -33, 154, 33], price: 24 },
  { id: "sofa_and_ottoman", name: "Sofa & ottoman", cat: "seating", src: "furniture/seating/sofa_and_ottoman.png", layer: floor, size: [450, 190], solid: [-180, -42, 360, 42], price: 39 },
  { id: "tufted_ottoman", name: "Tufted ottoman", cat: "seating", src: "furniture/seating/tufted_ottoman.png", layer: floor, size: [140, 130], solid: [-56, -29, 112, 29], price: 21 },
  { id: "arched_display_alt", name: "Arched cabinet (cream)", cat: "storage", src: "furniture/storage/arched_display_alt.png", layer: floor, size: [436, 400], solid: [-174, -80, 349, 80], price: 45 },
  { id: "arched_glass_display_cabinet", name: "Arched glass cabinet", cat: "storage", src: "furniture/storage/arched_glass_display_cabinet.png", layer: floor, size: [501, 400], solid: [-200, -80, 401, 80], price: 45 },
  { id: "blanket_basket", name: "Blanket basket", cat: "storage", src: "furniture/storage/blanket_basket.png", layer: floor, size: [127, 90], price: 18 },
  { id: "book_basket", name: "Book basket", cat: "storage", src: "furniture/storage/book_basket.png", layer: floor, size: [109, 100], solid: [-44, -22, 87, 22], price: 18 },
  { id: "coat_rack", name: "Coat rack", cat: "storage", src: "furniture/storage/coat_rack.png", layer: floor, size: [189, 300], solid: [-76, -66, 151, 66], price: 33 },
  { id: "cubby_display_alt", name: "Tall cubby shelf", cat: "storage", src: "furniture/storage/cubby_display_alt.png", layer: floor, size: [351, 420], solid: [-140, -80, 281, 80], price: 45 },
  { id: "cubby_display_mini", name: "Cubby shelf (small)", cat: "storage", src: "furniture/storage/cubby_display_mini.png", layer: floor, size: [276, 300], solid: [-110, -66, 221, 66], price: 39 },
  { id: "dresser_and_mirror", name: "Dresser & mirror", cat: "storage", src: "furniture/storage/dresser_and_mirror.png", layer: floor, size: [439, 300], solid: [-176, -66, 351, 66], price: 45 },
  { id: "empty_woven_basket", name: "Woven basket", cat: "storage", src: "furniture/storage/empty_woven_basket.png", layer: floor, size: [82, 70], price: 15 },
  { id: "gingham_laundry_hamper", name: "Gingham hamper", cat: "storage", src: "furniture/storage/gingham_laundry_hamper.png", layer: floor, size: [136, 170], solid: [-54, -37, 109, 37], price: 24 },
  { id: "glass_display_mini", name: "Glass cabinet (small)", cat: "storage", src: "furniture/storage/glass_display_mini.png", layer: floor, size: [371, 300], solid: [-148, -66, 297, 66], price: 42 },
  { id: "heart_storage_chest", name: "Heart storage chest", cat: "storage", src: "furniture/storage/heart_storage_chest.png", layer: floor, size: [237, 140], solid: [-95, -31, 190, 31], price: 27 },
  { id: "nine_cubby_display_cabinet", name: "Nine-cubby cabinet", cat: "storage", src: "furniture/storage/nine_cubby_display_cabinet.png", layer: floor, size: [416, 420], solid: [-166, -80, 333, 80], price: 45 },
  { id: "rolling_cart", name: "Rolling cart", cat: "storage", src: "furniture/storage/rolling_cart.png", layer: floor, size: [150, 220], solid: [-60, -48, 120, 48], price: 27 },
  { id: "three_drawer_chest", name: "Three drawer chest", cat: "storage", src: "furniture/storage/three_drawer_chest.png", layer: floor, size: [231, 230], solid: [-92, -51, 185, 51], price: 33 },
  { id: "wardrobe", name: "Wardrobe", cat: "storage", src: "furniture/storage/wardrobe.png", layer: floor, size: [313, 460], solid: [-125, -80, 250, 80], price: 45 },
  { id: "decorated_coffee_table", name: "Coffee table", cat: "tables", src: "furniture/tables/decorated_coffee_table.png", layer: floor, size: [285, 150], solid: [-114, -33, 228, 33], price: 30 },
  { id: "floral_kotatsu_set", name: "Kotatsu table", cat: "tables", src: "furniture/tables/floral_kotatsu_set.png", layer: floor, size: [443, 140], solid: [-177, -31, 354, 31], price: 33 },
  { id: "arched_glass_wall_display", name: "Arched wall cabinet", cat: "wall", src: "furniture/wall/arched_glass_wall_display.png", layer: "wall", size: [415, 330], price: 45 },
  { id: "cat_print", name: "Cat picture", cat: "wall", src: "furniture/wall/cat_print.png", layer: "wall", size: [123, 110], price: 18 },
  { id: "central_alcove_display_cupboard", name: "Alcove wall cupboard", cat: "wall", src: "furniture/wall/central_alcove_display_cupboard.png", layer: "wall", size: [425, 300], price: 45 },
  { id: "cherry_blossom_landscape_print", name: "Cherry blossom picture", cat: "wall", src: "furniture/wall/cherry_blossom_landscape_print.png", layer: "wall", size: [147, 100], price: 18 },
  { id: "floating_shelf_heart_frame", name: "Heart frame shelf", cat: "wall", src: "furniture/wall/floating_shelf_heart_frame.png", layer: "wall", size: [260, 130], price: 27 },
  { id: "floating_shelf_plant_books", name: "Plant & books shelf", cat: "wall", src: "furniture/wall/floating_shelf_plant_books.png", layer: "wall", size: [258, 140], price: 27 },
  { id: "floating_shelves_and_cupboard", name: "Shelves & cupboard", cat: "wall", src: "furniture/wall/floating_shelves_and_cupboard.png", layer: "wall", size: [397, 300], price: 45 },
  { id: "flower_print", name: "Flower picture (pink)", cat: "wall", src: "furniture/wall/flower_print.png", layer: "wall", size: [115, 110], price: 18 },
  { id: "folding_shoji_screen", name: "Folding screen", cat: "wall", src: "furniture/wall/folding_shoji_screen.png", layer: floor, size: [320, 280], solid: [-128, -62, 256, 62], price: 39 },
  { id: "hanging_photo_garland", name: "Photo garland", cat: "wall", src: "furniture/wall/hanging_photo_garland.png", layer: "wall", size: [303, 120], price: 27 },
  { id: "nine_cubby_wall_display", name: "Nine-cubby wall shelf", cat: "wall", src: "furniture/wall/nine_cubby_wall_display.png", layer: "wall", size: [350, 320], price: 42 },
  { id: "overhead_arch_mini", name: "Arch wall shelf (small)", cat: "wall", src: "furniture/wall/overhead_arch_mini.png", layer: "wall", size: [230, 190], price: 30 },
  { id: "overhead_arch_shelves", name: "Arch wall shelves", cat: "wall", src: "furniture/wall/overhead_arch_shelves.png", layer: "wall", size: [377, 260], price: 42 },
  { id: "overhead_fluted_glass_cupboard", name: "Fluted glass cupboard", cat: "wall", src: "furniture/wall/overhead_fluted_glass_cupboard.png", layer: "wall", size: [399, 220], price: 39 },
  { id: "overhead_fluted_mini", name: "Fluted cupboard (small)", cat: "wall", src: "furniture/wall/overhead_fluted_mini.png", layer: "wall", size: [277, 180], price: 30 },
  { id: "overhead_glass_display", name: "Glass wall cabinet", cat: "wall", src: "furniture/wall/overhead_glass_display.png", layer: "wall", size: [369, 260], price: 39 },
  { id: "overhead_glass_mini", name: "Glass wall cabinet (small)", cat: "wall", src: "furniture/wall/overhead_glass_mini.png", layer: "wall", size: [229, 190], price: 30 },
  { id: "overhead_three_door_cupboard", name: "Three-door cupboard", cat: "wall", src: "furniture/wall/overhead_three_door_cupboard.png", layer: "wall", size: [355, 250], price: 39 },
  { id: "overhead_three_door_mini", name: "Three-door cupboard (small)", cat: "wall", src: "furniture/wall/overhead_three_door_mini.png", layer: "wall", size: [242, 180], price: 30 },
  { id: "shoji_window", name: "Paper window", cat: "wall", src: "furniture/wall/shoji_window.png", layer: "wall", size: [310, 260], price: 39 },
  { id: "sunset_mountain_print", name: "Sunset picture", cat: "wall", src: "furniture/wall/sunset_mountain_print.png", layer: "wall", size: [126, 110], price: 18 },
];
export const FURNITURE_BY_ID = Object.fromEntries(FURNITURE.map(f => [f.id, f]));
export const STORE_ITEMS = FURNITURE.filter(f => f.price);
// General Store sections, in order; pieces without a cat are the original room set
export const STORE_CATEGORIES = [
  ["room", "Room basics"], ["desks", "Desks"], ["seating", "Seating"], ["tables", "Tables"], ["storage", "Storage"],
  ["wall", "Wall"], ["lighting", "Lighting"], ["plants", "Plants"], ["rugs", "Rugs"], ["decor", "Decor"], ["gym", "Gym"],
];
export const storeCategory = item => item.cat || "room";

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
  const box = f.layer === "wall" ? [Math.round(768 - w / 2), 70, w, h] : [Math.round(768 - w / 2), 760 - h, w, h]; // rugs ("ground") land mid-floor too
  return { uid: `${itemId}-${n}`, item: itemId, box };
}
