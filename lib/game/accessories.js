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
  { id: "gold_crown", name: "Gold crown", price: 30 },
  { id: "pink_gem_tiara", name: "Gem tiara", price: 30 },
];
// Fine-tuning from the fitting page (design/v2-plan/accessory-fit.html), pasted by you.
// Offsets are in accessory pixels: x is left/right, y is up/down (positive = down), size multiplies.
// ACCESSORY_FIT applies to that accessory on every dog (its x mirrors when the dog faces left).
// DOG_FIT applies to every accessory on that dog, separately for each way the dog faces on screen (front/right/left/back), plus "nap" for sleeping.
export const ACCESSORY_FIT = {
  bunny_ears: { x: 0, y: 4, size: 1.26 },
  small_pink_bow: { x: 0, y: 0, size: 1.2 },
  daisy_headband: { x: 0, y: -1, size: 1.38 },
  star_headband: { x: 0, y: 0, size: 1.1 },
  heart_antennae: { x: 0, y: 8, size: 1.12 },
  large_pink_bow: { x: 0, y: 6, size: 1.3 },
  leaf_crown: { x: 0, y: 12, size: 1.16 },
  pink_flower_crown: { x: 0, y: -2, size: 1.1 },
  cat_ears: { x: 0, y: 8, size: 1.24 },
  angel_halo: { x: 0, y: 11, size: 1.16 },
  party_hat: { x: 0, y: 8, size: 1.3 },
  gold_crown: { x: 0, y: 8, size: 1.28 },
  pink_gem_tiara: { x: 0, y: 6, size: 1.2 },
};
export const DOG_FIT = {
  westie: {
    front: { x: -11, y: 26, size: 1 },
    right: { x: 6, y: 25, size: 1 },
    left: { x: -6, y: 25, size: 1 },
    back: { x: 0, y: 26, size: 1 },
    nap: { x: 0, y: 42, size: 1 },
  },
  cream: {
    front: { x: 0, y: 17, size: 1 },
    right: { x: -9, y: 13, size: 1 },
    left: { x: 9, y: 13, size: 1 },
    back: { x: 0, y: 17, size: 1 },
    nap: { x: 0, y: 24, size: 1 },
  },
  bernie: {
    front: { x: 0, y: 8, size: 1 },
    right: { x: -3, y: 10, size: 1 },
    left: { x: 3, y: 10, size: 1 },
    back: { x: 0, y: 8, size: 1 },
    nap: { x: 0, y: 23, size: 1 },
  },
  charcoal: {
    front: { x: 0, y: 14, size: 1 },
    right: { x: 0, y: 16, size: 1 },
    left: { x: 0, y: 16, size: 1 },
    back: { x: 0, y: 14, size: 1 },
    nap: { x: 0, y: 22, size: 1 },
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
