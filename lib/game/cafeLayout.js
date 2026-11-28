/* Tempo Café: the focus-timer scene (opened from the Café in Tempo Town).
   You sit at a table with your laptop (seated frames from the café pack, table and chair included);
   the dogs wander around the café floor. Same format as roomLayout.js. */
export const CAFE_LAYOUT = {
  assetBase: "/game/cafe/",
  background: "background/cafe.png",
  size: [1536, 1024],
  walk: [60, 780, 1476, 1010], // the café floor in front of the counter
  castScale: 1.5,              // everyone drawn 50% bigger than in your room, so the café feels close-up
  youScale: 1.76,              // you: twice your first café size, then 10% bigger (1.5 × 1.76 = 2.64)
  seated: true,                // you stay at your table; taps and keys don't walk you
  naps: true,                  // dogs may nap on the café floor
  objects: [
    // invisible: the space your table and chair take up, so the dogs walk around it
    { id: "my_table", box: [548, 795, 440, 210], layer: "ground", solid: [-225, -130, 450, 135] },
  ],
  // you at your table in the middle of the café; two dogs on each side
  cast: { you: [768, 995, "front"], westie: [300, 930, "front"], cream: [470, 990, "sit"], bernie: [1080, 905, "front"], charcoal: [1260, 985, "happy"] },
};
