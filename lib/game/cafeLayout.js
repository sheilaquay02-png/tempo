/* Tempo Café: the focus-timer scene (opened from the Café in Tempo Town).
   You sit at a table with your laptop (seated frames from the café pack, table and chair included);
   the dogs wander around the café floor. Same format as roomLayout.js. */
export const CAFE_LAYOUT = {
  assetBase: "/game/cafe/",
  background: "background/cafe.png",
  size: [1536, 1024],
  walk: [60, 780, 1476, 1010], // the café floor in front of the counter
  castScale: 1,
  youScale: 1.2,               // same size as in your room
  seated: true,                // you stay at your table; taps and keys don't walk you
  naps: true,                  // dogs may nap on the café floor
  objects: [
    // invisible: the space your table and chair take up, so the dogs walk around it
    { id: "my_table", box: [270, 820, 220, 140], layer: "ground", solid: [-115, -70, 230, 75] },
  ],
  cast: { you: [380, 960, "front"], westie: [700, 905, "front"], cream: [880, 965, "sit"], bernie: [1060, 885, "front"], charcoal: [1250, 960, "happy"] },
};
