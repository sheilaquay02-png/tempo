/* Tempo Café: the focus-timer scene (opened from the Café in Tempo Town).
   You sit at a table with your laptop (seated frames from the café pack, table and chair included);
   the dogs wander around the café floor. Same format as roomLayout.js. */
export const CAFE_LAYOUT = {
  assetBase: "/game/cafe/",
  background: "background/cafe.png",
  size: [1536, 1024],
  walk: [60, 780, 1476, 1010], // the café floor in front of the counter
  castScale: 1.5,              // everyone drawn 50% bigger than in your room, so the café feels close-up
  youScale: 1.2,               // you: same proportion to the dogs as in your room
  seated: true,                // you stay at your table; taps and keys don't walk you
  naps: true,                  // dogs may nap on the café floor
  objects: [
    // invisible: the space your table and chair take up, so the dogs walk around it
    { id: "my_table", box: [270, 820, 300, 170], layer: "ground", solid: [-160, -95, 320, 100] },
  ],
  cast: { you: [400, 985, "front"], westie: [740, 930, "front"], cream: [940, 990, "sit"], bernie: [1140, 905, "front"], charcoal: [1340, 985, "happy"] },
};
