// Dog head accessories: sold at the Pet Shop in Tempo Town, worn via the pet bowl menu in your room.
// Pictures: public/game/accessories/<id>/{front,side}.png (192×192, bottom-centre anchor 96,176).
// Where each one sits on every dog animation frame: public/game/accessories/anchors.json
// (made by scripts/build-accessory-anchors.mjs). Owning an accessory once lets any dog wear it.
// Prices are whole numbers of finished tasks at 3 🌸 each.

export const ACCESSORIES = [
  { id: "small_pink_bow", name: "Small pink bow", price: 9 },
  { id: "daisy_headband", name: "Daisy headband", price: 9 },
  { id: "star_headband", name: "Star headband", price: 12 },
  { id: "heart_antennae", name: "Heart antennae", price: 12 },
  { id: "large_pink_bow", name: "Big pink bow", price: 12 },
  { id: "leaf_crown", name: "Leaf crown", price: 15 },
  { id: "pink_flower_crown", name: "Flower crown", price: 15 },
  { id: "cat_ears", name: "Cat ears", price: 15 },
  { id: "bunny_ears", name: "Bunny ears", price: 18 },
  { id: "angel_halo", name: "Angel halo", price: 18 },
  { id: "party_hat", name: "Party hat", price: 18 },
  { id: "pink_beret", name: "Pink beret", price: 21 },
  { id: "cream_beanie", name: "Cream beanie", price: 21 },
  { id: "paw_baseball_cap", name: "Paw cap", price: 21 },
  { id: "sailor_hat", name: "Sailor hat", price: 21 },
  { id: "star_sleep_cap", name: "Star sleep cap", price: 24 },
  { id: "strawberry_hat", name: "Strawberry hat", price: 24 },
  { id: "flower_sunhat", name: "Flower sunhat", price: 24 },
  { id: "frog_hat", name: "Frog hat", price: 27 },
  { id: "bear_hat", name: "Bear hat", price: 27 },
  { id: "gold_crown", name: "Gold crown", price: 30 },
  { id: "pink_gem_tiara", name: "Gem tiara", price: 30 },
];
// Fine-tuning from the fitting page (design/v2-plan/accessory-fit.html), pasted by you.
// Offsets are in accessory pixels: x is left/right, y is up/down (positive = down), size multiplies.
// ACCESSORY_FIT applies to that accessory on every dog (its x mirrors when the dog faces left).
// DOG_FIT applies to every accessory on that dog, separately for each way the dog faces on screen (front/right/left/back), plus "nap" for sleeping.
export const ACCESSORY_FIT = {
  bunny_ears: { x: 0, y: 9, size: 1 },
};
export const DOG_FIT = {
  westie: {
    front: { x: -15, y: 22, size: 1 },
    right: { x: 6, y: 12, size: 1 },
    left: { x: -6, y: 12, size: 1 },
    back: { x: 0, y: 22, size: 1 },
  },
};

export const ACCESSORY_BY_ID = Object.fromEntries(ACCESSORIES.map(a => [a.id, a]));

// the four dogs, as the game names them, with the folder their pictures live in
export const DOGS = [
  { key: "westie", name: "Westie", folder: "westie" },
  { key: "cream", name: "Cream", folder: "bernedoodle_cream" },
  { key: "bernie", name: "Bernie", folder: "bernedoodle_black_white" },
  { key: "charcoal", name: "Charcoal", folder: "bernedoodle_charcoal" },
];

export const ownsAccessory = (game, id) => Boolean((game?.owned || {})[id]);

// Buying an accessory: spend blossoms; owning it once is enough for every dog.
export function buyAccessory(game, item) {
  if (!item || ownsAccessory(game, item.id) || (game?.blossoms || 0) < item.price) return null;
  return { ...game, blossoms: game.blossoms - item.price, owned: { ...(game.owned || {}), [item.id]: 1 } };
}

// Put an accessory on a dog (or take it off with null). Only accessories you own can be worn.
export function wearAccessory(game, dogKey, id) {
  if (!DOGS.some(d => d.key === dogKey)) return game;
  if (id && !ownsAccessory(game, id)) return game;
  return { ...game, pets: { ...(game?.pets || {}), [dogKey]: id || null } };
}
