// Weather over Tempo Town: now and then a gentle rain (or snow in winter) drifts across the square.
// It's picked from the date and the time of day, in 3-hour spells, so it stays the same while you
// play and looks the same on every device. Nothing is saved.

export const WEATHER_CHANCE = 0.3;       // about 3 spells in 10 have weather
const SNOW_MONTHS = new Set([11, 0, 1]); // December, January, February (0 = January)

// a small stable hash → 0..1
function unit(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

// "rain" | "snow" | null for a given moment (local time)
export function weatherAt(date = new Date()) {
  const spell = Math.floor(date.getHours() / 3);
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}#${spell}`;
  if (unit(key) >= WEATHER_CHANCE) return null;
  return SNOW_MONTHS.has(date.getMonth()) ? "snow" : "rain";
}
