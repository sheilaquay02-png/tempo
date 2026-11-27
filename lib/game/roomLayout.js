/* Cozy Room layout (from the approved V2 prototype). Every object is its own entry and can be moved,
   swapped or removed later without touching the engine.
   box:   [x, y, w, h] in scene pixels; the picture is scaled to fit (aspect kept), standing on the
          box's bottom edge, centred. Its anchor (feet) is that bottom-centre point.
   layer: "ground" | "wall" | "object" (depth-sorted with the characters) | "front" (over characters)
   solid: collision footprint [x, y, w, h] relative to the anchor.
   tap:   { name, opens, action } — action is what the app does when the piece is tapped:
          "tasks" | "calendar" | "today" | "night" | "dogs" | "town". The game never changes data itself. */
export const ROOM_LAYOUT = {
  assetBase: "/game/room/",
  background: "backgrounds/room_empty.png",
  size: [1536, 1024],
  walk: [60, 460, 1476, 1010], // the floor area characters may walk on
  castScale: 1,
  youScale: 1.2, // you are drawn 20% bigger in the room
  naps: true,    // dogs may curl up for a nap here
  objects: [
    { id: "flower_art", src: "room/flower_wall_art_angled.png", box: [14, 95, 150, 250], layer: "wall" },
    { id: "storage_shelf", src: "room/storage_shelf_group.png", box: [150, 60, 350, 235], layer: "wall", tap: { name: "Storage shelf", opens: "Tasks", action: "tasks" } },
    { id: "window_seat", src: "room/window_seat.png", box: [470, 0, 570, 420], layer: "object", solid: [-270, -110, 540, 110], tap: { name: "Window", opens: "Calendar", action: "calendar" } },
    { id: "books_shelf", src: "room/books_wall_shelf.png", box: [1030, 30, 400, 230], layer: "wall", tap: { name: "Bookshelf", opens: "Tasks", action: "tasks" } },
    { id: "heart_art", src: "room/heart_wall_art.png", box: [1432, 110, 100, 180], layer: "wall" },
    { id: "bed", src: "room/bed.png", box: [118, 200, 275, 360], layer: "object", solid: [-130, -170, 260, 170], tap: { name: "Bed", opens: "Goodnight (night mode)", action: "night" } },
    { id: "nightstand", src: "room/nightstand_lamp.png", box: [385, 225, 132, 235], layer: "object", solid: [-60, -60, 120, 60], tap: { name: "Bedside lamp", opens: "Day / night", action: "night" } },
    { id: "desk", src: "room/desk_workspace_group.png", box: [1000, 40, 400, 445], layer: "object", solid: [-190, -110, 380, 110], tap: { name: "Desk and computer", opens: "Today", action: "today" } },
    { id: "plant_window", src: "room/small_potted_plant.png", box: [885, 310, 110, 125], layer: "object", solid: [-40, -30, 80, 30] },
    { id: "plant_left", src: "room/large_floor_plant.png", box: [0, 280, 160, 300], layer: "object", solid: [-55, -45, 110, 45] },
    { id: "cabinet", src: "room/bookshelf_cabinet.png", box: [1378, 220, 230, 520], layer: "object", solid: [-110, -90, 220, 90], tap: { name: "Cabinet", opens: "Tasks", action: "tasks" } },
    { id: "pet_station", src: "room/pet_feeding_station.png", box: [930, 640, 260, 175], layer: "object", solid: [-120, -60, 240, 60], tap: { name: "Food and water", opens: "Call the dogs", action: "dogs" } },
    { id: "plant_bottom_left", src: "room/potted_plant_variant.png", box: [110, 820, 120, 204], layer: "front" },
    { id: "plant_bottom_right", src: "room/large_floor_plant.png", box: [1420, 780, 150, 244], layer: "front" },
    { id: "door", box: [640, 960, 260, 64], layer: "ground", tap: { name: "Door", opens: "Tempo Town (coming soon)", action: "town" } },
  ],
  cast: { you: [760, 640, "front"], westie: [610, 700, "sit"], cream: [880, 700, "sleep"], bernie: [690, 760, "happy"], charcoal: [820, 800, "sleep"] },
};
