/* Tempo Town layout (from the approved V2 prototype, with the user's own fountain and bench positions).
   Same format as roomLayout.js. Buildings are shortcuts only: everything they open is also one tap away
   in the normal menus, so walking is never required.
   tap.action: "tasks" | "calendar" | "today" | "budget" | "room" (My House) | "dogs" | "note" (shows tap.note). */
export const TOWN_LAYOUT = {
  assetBase: "/game/town/",
  background: "backgrounds/town_bg.png",
  size: [1680, 960],
  // grass + paving above the canal
  walk: [30, 300, 1650, 750],
  castScale: 0.66,
  dogScale: 0.8,  // dogs drawn 20% smaller in town
  objects: [
    // top row: each building's door sits on a path stub coming up from the top path
    { id: "pergola", src: "town/structures/park_pergola.png", box: [195, 20, 215, 195], layer: "object", tap: { name: "Park", opens: "A quiet walk", action: "note", note: "A lovely spot for a stroll with the dogs 🌳" } },
    { id: "cafe", src: "town/buildings/cafe.png", box: [470, -10, 290, 265], layer: "object", solid: [-130, -60, 260, 60], tap: { name: "Café", opens: "Take a break", action: "note", note: "Time for a little break ☕ Stretch, sip something warm." } },
    { id: "town_hall", src: "town/buildings/town_hall.png", box: [805, -25, 320, 290], layer: "object", solid: [-140, -70, 280, 70], tap: { name: "Town Hall", opens: "Tasks", action: "tasks" } },
    { id: "library", src: "town/buildings/library.png", box: [1320, -10, 270, 260], layer: "object", solid: [-125, -60, 250, 60], tap: { name: "Library", opens: "Calendar", action: "calendar" } },
    { id: "cherry_tl", src: "town/nature/cherry_tree.png", box: [0, 40, 180, 160], layer: "object" },
    { id: "tree_t1", src: "town/nature/green_tree.png", box: [385, 120, 120, 130], layer: "object" },
    { id: "tree_t2", src: "town/nature/green_tree.png", box: [1160, 90, 140, 160], layer: "object" },
    { id: "tree_t3", src: "town/nature/green_tree.png", box: [1520, 120, 160, 175], layer: "object" },
    { id: "notice", src: "town/structures/notice_board.png", box: [1110, 210, 95, 95], layer: "object", tap: { name: "Notice board", opens: "Today", action: "today" } },
    { id: "hedge_t1", src: "town/nature/flower_hedge.png", box: [365, 255, 135, 60], layer: "object" },
    { id: "hedge_t2", src: "town/nature/flower_hedge.png", box: [1215, 255, 135, 60], layer: "object" },
    // middle row: buildings sit on the stubs that rise from the lower path
    { id: "general_store", src: "town/buildings/general_store.png", box: [80, 345, 250, 235], layer: "object", solid: [-115, -55, 230, 55], tap: { name: "General Store", opens: "Decorations (coming later)", action: "note", note: "The General Store opens later, with decorations for your room." } },
    { id: "pet_shop", src: "town/buildings/pet_shop.png", box: [345, 345, 215, 235], layer: "object", solid: [-95, -55, 190, 55], tap: { name: "Pet Shop", opens: "Pet accessories (coming later)", action: "note", note: "The Pet Shop opens later, with treats and accessories for the dogs." } },
    { id: "bank", src: "town/buildings/bank.png", box: [1220, 360, 250, 220], layer: "object", solid: [-110, -55, 220, 55], tap: { name: "Bank", opens: "Budget", action: "budget" } },
    { id: "my_house", src: "town/buildings/my_house.png", box: [1490, 390, 200, 190], layer: "object", solid: [-85, -45, 170, 45], tap: { name: "My House", opens: "Back to your room", action: "room" } },
    // the square
    { id: "fountain", src: "town/structures/fountain.png", box: [735, 357, 245, 190], layer: "object", solid: [-110, -80, 220, 80], tap: { name: "Fountain", opens: "Call the dogs", action: "dogs" } },
    { id: "bench_1", src: "town/props/bench.png", box: [1430, 579, 90, 60], layer: "object", solid: [-40, -20, 80, 20] },
    { id: "bench_2", src: "town/props/bench.png", box: [1486, 334, 90, 60], layer: "object", solid: [-40, -20, 80, 20] },
    { id: "bench_3", src: "town/props/bench.png", box: [279, 587, 90, 60], layer: "object", solid: [-40, -20, 80, 20] },
    { id: "bench_4", src: "town/props/bench.png", box: [1196, 337, 90, 60], layer: "object", solid: [-40, -20, 80, 20] },
    { id: "lamp_1", src: "town/props/street_lamp_banner.png", box: [530, 300, 70, 150], layer: "object", solid: [-15, -12, 30, 12] },
    { id: "lamp_2", src: "town/props/street_lamp_banner.png", box: [1115, 300, 70, 150], layer: "object", solid: [-15, -12, 30, 12] },
    { id: "lamp_3", src: "town/props/street_lamp_banner.png", box: [530, 555, 70, 150], layer: "object", solid: [-15, -12, 30, 12] },
    { id: "lamp_4", src: "town/props/street_lamp_banner.png", box: [1115, 555, 70, 150], layer: "object", solid: [-15, -12, 30, 12] },
    { id: "tree_m1", src: "town/nature/green_tree.png", box: [-15, 360, 110, 150], layer: "object" },
    { id: "bush_m1", src: "town/nature/pink_flower_bush.png", box: [440, 570, 80, 65], layer: "object" },
    { id: "bush_m2", src: "town/nature/pink_flower_bush.png", box: [1195, 570, 80, 65], layer: "object" },
    // along the canal
    { id: "hedge_b1", src: "town/nature/flower_hedge.png", box: [80, 690, 160, 60], layer: "object" },
    { id: "hedge_b2", src: "town/nature/flower_hedge.png", box: [380, 690, 160, 60], layer: "object" },
    { id: "hedge_b3", src: "town/nature/flower_hedge.png", box: [1190, 690, 160, 60], layer: "object" },
    { id: "hedge_b4", src: "town/nature/flower_hedge.png", box: [1450, 690, 160, 60], layer: "object" },
    { id: "fence_b1", src: "town/props/wood_fence.png", box: [255, 700, 110, 50], layer: "object" },
    { id: "fence_b2", src: "town/props/wood_fence.png", box: [1360, 700, 85, 50], layer: "object" },
    { id: "lily_1", src: "town/nature/lily_cluster.png", box: [380, 800, 110, 55], layer: "ground" },
    { id: "lily_2", src: "town/nature/lily_cluster.png", box: [1230, 805, 110, 55], layer: "ground" },
    { id: "cherry_bl", src: "town/nature/cherry_tree.png", box: [-15, 780, 205, 180], layer: "front" },
    { id: "cherry_br", src: "town/nature/cherry_tree.png", box: [1500, 785, 190, 175], layer: "front" },
    { id: "fence_bot1", src: "town/props/wood_fence.png", box: [300, 905, 270, 55], layer: "front" },
    { id: "fence_bot2", src: "town/props/wood_fence.png", box: [1110, 905, 260, 55], layer: "front" },
    { id: "flowers_b1", src: "town/nature/pink_flower_bush.png", box: [630, 885, 100, 75], layer: "front" },
    { id: "flowers_b2", src: "town/nature/pink_flower_bush.png", box: [1000, 885, 100, 75], layer: "front" },
  ],
  cast: { you: [720, 722, "front"], westie: [795, 722, "front"], cream: [870, 722, "front"], bernie: [945, 722, "front"], charcoal: [1020, 722, "front"] },
};
