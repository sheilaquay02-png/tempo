// Dog head accessories: sold at the Pet Shop in Tempo Town, worn via the pet bowl menu in your room.
// Pictures: public/game/accessories/<id>/{front,side}.png (192×192, bottom-centre anchor 96,176).
// Hats (art: "hat", Tempo_Pet_Hats_v2): {front,side,back}.png on a 288×256 canvas, anchor 144,240,
// drawn about twice as big as the first set (so scale 0.6), side view facing right; the back picture is
// worn on top when the dog walks away. Hats have their own fitting page (design/v2-plan/hat-fit.html).
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
  { id: "pink_beret", name: "Pink beret", price: 21, art: "hat" },
  { id: "cream_beanie", name: "Cream beanie", price: 21, art: "hat", flipSide: true },
  { id: "paw_cap", name: "Paw cap", price: 21, art: "hat", flipSide: true },
  { id: "sailor_hat", name: "Sailor hat", price: 21, art: "hat", flipSide: true },
  { id: "strawberry_hat", name: "Strawberry hat", price: 24, art: "hat", flipSide: true },
  { id: "flower_sunhat", name: "Flower sunhat", price: 24, art: "hat", flipSide: true },
  { id: "star_sleep_cap", name: "Star sleep cap", price: 24, art: "hat" },
  { id: "frog_hat", name: "Frog hat", price: 27, art: "hat", flipSide: true },
  { id: "bear_hat", name: "Bear hat", price: 27, art: "hat", flipSide: true },
];
// Fine-tuning from the fitting page (design/v2-plan/accessory-fit.html), pasted by you.
// Offsets are in accessory pixels: x is left/right, y is up/down (positive = down), size multiplies.
// ACCESSORY_FIT applies to that accessory on every dog (its x mirrors when the dog faces left).
// (Hat ids go in ACCESSORY_FIT too, from the hat fitting page.)
// DOG_FIT applies to every first-set accessory on that dog, separately for each way the dog faces on screen (front/right/left/back), plus "nap" for sleeping.
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
  // hats (from the hat fitting page)
  star_sleep_cap: { x: 0, y: 29, size: 1.22 },
  sailor_hat: { x: 0, y: -10, size: 1 },
  paw_cap: { x: 0, y: 1, size: 1 },
  strawberry_hat: { x: 0, y: 8, size: 1 },
  flower_sunhat: { x: 0, y: 4, size: 1 },
  frog_hat: { x: 0, y: 10, size: 1 },
  bear_hat: { x: 0, y: 14, size: 1 },
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
// HAT_DOG_FIT is the same idea for hats only, from the separate hat fitting page.
export const HAT_DOG_FIT = {
  westie: {
    front: { x: -16, y: 60, size: 1.32 },
    right: { x: -30, y: 60, size: 1.2 },
    left: { x: 30, y: 60, size: 1.2 },
    back: { x: 0, y: 60, size: 1.32 },
    nap: { x: -27, y: 60, size: 1.2 },
  },
  cream: {
    front: { x: 0, y: 45, size: 1.36 },
    right: { x: -26, y: 50, size: 1.36 },
    left: { x: 26, y: 50, size: 1.36 },
    back: { x: 0, y: 54, size: 1.36 },
    nap: { x: -13, y: 60, size: 1.3 },
  },
  bernie: {
    front: { x: 0, y: 34, size: 1.32 },
    right: { x: -35, y: 31, size: 1.3 },
    left: { x: 35, y: 31, size: 1.3 },
    back: { x: 0, y: 34, size: 1.32 },
    nap: { x: -13, y: 60, size: 1.24 },
  },
  charcoal: {
    front: { x: 0, y: 42, size: 1.3 },
    right: { x: -23, y: 38, size: 1.4 },
    left: { x: 23, y: 38, size: 1.4 },
    back: { x: 0, y: 42, size: 1.3 },
    nap: { x: 0, y: 60, size: 1.3 },
  },
};
// HAT_ONE_FIT: extra nudges for one hat only, per dog and direction (hat page: "Only <hat>"), added on top.
export const HAT_ONE_FIT = {};

export const ACCESSORY_BY_ID = Object.fromEntries(ACCESSORIES.map(a => [a.id, a]));
// picture canvas and anchor for each art style (w, h, anchor x, anchor y, has a back view)
const ART = { head: { w: 192, h: 192, ax: 96, ay: 176, back: false, scale: 1, sideFacesLeft: false }, hat: { w: 288, h: 256, ax: 144, ay: 240, back: true, scale: 0.6, sideFacesLeft: false } };
// flipSide: that hat's side picture was drawn facing the other way, so it is mirrored
export const accessoryArt = id => {
  const item = ACCESSORY_BY_ID[id], art = ART[item?.art] || ART.head;
  return item?.flipSide ? { ...art, sideFacesLeft: !art.sideFacesLeft } : art;
};
// which per-dog settings an accessory uses: hats have their own
export const dogFitFor = id => (ACCESSORY_BY_ID[id]?.art === "hat" ? HAT_DOG_FIT : DOG_FIT);

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
