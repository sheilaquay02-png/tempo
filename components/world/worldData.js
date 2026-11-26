// Phase 2 world prototype (/world-lab): shared themes, cast colours and FAKE
// sample data. Nothing here reads or writes the user's real Tempo data.

export const ROOM_THEMES = {
  kawaii: {
    name: "Cloud Kawaii",
    wallA: "#FBE1E6", wallB: "#F8D3DD", floor: "#F2D2B8", trim: "#FFF6EA",
    bed: "#F7B8C9", blanket: "#FFF0F4", desk: "#CDEBD6", shelf: "#F4E6D8",
    rug: "#F9C6D6", accent: "#B9DDEA", plant: "#9ED8A8", lights: true, monitor: false,
  },
  gamer: {
    name: "Cosy Gamer",
    wallA: "#D9CCF0", wallB: "#CBBDE8", floor: "#B98F86", trim: "#EFE6F7",
    bed: "#E9B9D7", blanket: "#F5E6F2", desk: "#EADFF2", shelf: "#E6DBEF",
    rug: "#C9B6E6", accent: "#8FB7E8", plant: "#8CC79B", lights: true, monitor: true,
  },
  minimal: {
    name: "Warm Minimal",
    wallA: "#FFF4E6", wallB: "#F7E8D6", floor: "#D9B48A", trim: "#FFFDF8",
    bed: "#F2C6BC", blanket: "#FFF9F2", desk: "#E9CFA9", shelf: "#E3C29A",
    rug: "#F4ECE0", accent: "#BFD8B8", plant: "#93C49B", lights: false, monitor: false,
  },
};

// You (pink shark onesie) and the four dogs, from the owner's photos.
export const CAST = {
  you: { label: "You", onesie: "#F49AC1", onesieDark: "#E27BAA", belly: "#FFE6F0", skin: "#FBDCCB", hair: "#2E211E", hairEnds: "#6E4531" },
  westie: { label: "Westie", fur: "#FFFDF6", furShade: "#F1E7D6", ears: "pointy" },
  cream: { label: "Cream doodle", fur: "#FBF2E4", patch: "#EBC79C", scarf: "#2E7D4F", ears: "floppy" },
  bernie: { label: "Bernie doodle", fur: "#2A2526", blaze: "#FFFFFF", scarf: "#D33B3B", ears: "floppy" },
  grey: { label: "Grey doodle", fur: "#4B4748", patch: "#A57650", scarf: "#D33B3B", ears: "floppy" },
};

export const SAMPLE_TASKS = [
  { id: "s1", title: "Walk the dogs", done: true, priority: "high" },
  { id: "s2", title: "Reply to Mia about Saturday", done: false, priority: "medium" },
  { id: "s3", title: "Order dog food", done: false, priority: "high" },
  { id: "s4", title: "Water the plants", done: false, priority: "low" },
  { id: "s5", title: "Plan next week", done: false, priority: "medium" },
];

export const SAMPLE_EVENTS = [
  { id: "e1", time: "09:30", title: "Team check-in", length: "30 min" },
  { id: "e2", time: "13:00", title: "Lunch with Jo", length: "1 h" },
  { id: "e3", time: "16:00", title: "Grooming: Westie", length: "1 h" },
  { id: "e4", time: "19:30", title: "Yoga", length: "45 min" },
];

export const SAMPLE_BUDGET = { spentToday: 42.5, monthLeft: 612, currency: "S$" };

export const SAMPLE_AFFIRMATION = "Small steps still move you forward.";
export const SAMPLE_WEATHER = { icon: "⛅", label: "Partly cloudy", temp: 29 };

// Hotspots shared by the 2.5D and 3D rooms and the town map.
export const PANELS = {
  tasks: { title: "Today's tasks", kind: "tasks" },
  calendar: { title: "Today's calendar", kind: "calendar" },
  budget: { title: "Budget", kind: "budget" },
  affirmation: { title: "Today's affirmation", kind: "affirmation" },
  weather: { title: "Weather", kind: "weather" },
};
