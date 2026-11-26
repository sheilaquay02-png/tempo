// 2.5D isometric room: three themes, day/night, clickable spots, you + the dogs,
// and a simple decorate mode (pick a piece, then tap a floor tile to move it).
import { useId } from "react";
import { createScene, makeIso, shade, HotspotLabel } from "./isoKit";
import { Sky } from "./Sky";
import { Sprite } from "./CastSprites";
import { ROOM_THEMES } from "./worldData";

export const ROOM_SIZE = 7;

// Pieces you can move in decorate mode. x/y = the tile the piece sits on.
export const MOVABLE = {
  rug: { label: "Rug", w: 3, d: 2, x: 2, y: 3 },
  chair: { label: "Chair", w: 1, d: 1, x: 5, y: 2 },
  nightstand: { label: "Bedside table", w: 1, d: 1, x: 0, y: 4 },
  plantA: { label: "Big plant", w: 1, d: 1, x: 6, y: 5 },
  plantB: { label: "Small plant", w: 1, d: 1, x: 1, y: 6 },
};

export const DEFAULT_LAYOUT = Object.fromEntries(Object.entries(MOVABLE).map(([k, v]) => [k, { x: v.x, y: v.y }]));

// Tiles that fixed furniture (bed, desk, shelf) or walls cover.
const BLOCKED = new Set(["0,1", "0,2", "0,3", "1,1", "1,2", "1,3", "2,1", "2,2", "2,3", "2,0", "3,0", "4,0", "5,0", "6,0", "4,1", "5,1", "6,1", "3,1"]);

export function canPlace(id, x, y, layout) {
  const m = MOVABLE[id];
  if (!m) return false;
  if (x < 0 || y < 0 || x + m.w > ROOM_SIZE || y + m.d > ROOM_SIZE) return false;
  if (id === "rug") return true; // rugs lie under things
  for (let i = 0; i < m.w; i++) for (let j = 0; j < m.d; j++) {
    const key = `${x + i},${y + j}`;
    if (BLOCKED.has(key)) return false;
    for (const [other, pos] of Object.entries(layout)) {
      if (other === id || other === "rug") continue;
      const o = MOVABLE[other];
      if (x + i >= pos.x && x + i < pos.x + o.w && y + j >= pos.y && y + j < pos.y + o.d) return false;
    }
  }
  return true;
}

export const ROOM_SPOTS = [
  { id: "desk", label: "Desk → Tasks", action: { panel: "tasks" }, at: [5.4, 1.1, 2.6] },
  { id: "calendar", label: "Calendar", action: { panel: "calendar" }, at: [0.36, 1.85, 4.2] },
  { id: "window", label: "Window · weather", action: { panel: "weather" }, at: [4.55, 0.36, 4.15] },
  { id: "board", label: "Affirmation", action: { panel: "affirmation" }, at: [2, 0.36, 4.2] },
  { id: "door", label: "Door → Town", action: { go: "town" }, at: [0.36, 5.5, 3.3] },
];

export default function Room25D({ theme = "kawaii", night = false, layout = DEFAULT_LAYOUT, onAction, decorate = false, selected, onSelect, onPlace, activeId }) {
  const t = ROOM_THEMES[theme] || ROOM_THEMES.kawaii;
  const lampId = `lamp${useId().replace(/:/g, "")}`;
  const iso = makeIso(400, 232, 46);
  const sc = createScene(iso, night ? { color: "#3B2F66", amt: 0.3 } : null);
  const { pts, P } = iso;
  const T = sc.T;
  const L = { ...DEFAULT_LAYOUT, ...layout };

  // floor + boards
  sc.box(0, 0, -0.5, 7, 7, 0.5, t.floor, { ground: true });
  sc.add("G", <g>{Array.from({ length: 6 }, (_, i) => <polyline key={i} points={pts([[i + 1, 0, 0], [i + 1, 7, 0]])} stroke={T(shade(t.floor, 0.92))} strokeWidth={1.2} fill="none" />)}</g>);
  // walls
  sc.box(0, 0, 0, 0.35, 7, 5, t.wallB, { ground: true });
  sc.box(0, 0, 0, 7, 0.35, 5, t.wallA, { ground: true });
  // window
  {
    const wx = 3.6;
    const extras = night
      ? <>{(() => { const [mx, my] = P(wx + 1.3, 0.36, 3.2); return <circle cx={mx} cy={my} r={7} fill="#FFF1C2" />; })()}
        {Array.from({ length: 5 }, (_, i) => { const [sx, sy] = P(wx + 0.2 + i * 0.35, 0.36, 2.4 + ((i * 7) % 5) * 0.22); return <circle key={i} cx={sx} cy={sy} r={1.4} fill="#FFF7D6" />; })}</>
      : (() => { const [cx, cy] = P(wx + 0.7, 0.36, 3.1); return <>{[[0, 0], [12, -4], [22, 2]].map(([dx, dy], i) => <circle key={i} cx={cx + dx} cy={cy + dy} r={8} fill="#FFFFFF" />)}</>; })();
    sc.add("G", <g><polygon points={pts([[wx, 0.36, 2], [wx + 1.9, 0.36, 2], [wx + 1.9, 0.36, 3.6], [wx, 0.36, 3.6]])} fill={night ? "#33306A" : "#BEE3F3"} stroke={T("#FFFFFF")} strokeWidth={4} />{extras}</g>);
  }
  // wall calendar
  sc.add("G", (
    <g>
      <polygon points={pts([[0.36, 1.2, 2.3], [0.36, 2.5, 2.3], [0.36, 2.5, 3.6], [0.36, 1.2, 3.6]])} fill={T("#FFFFFF")} stroke={T(shade(t.wallB, 0.8))} strokeWidth={1.5} />
      <polygon points={pts([[0.36, 1.2, 3.3], [0.36, 2.5, 3.3], [0.36, 2.5, 3.6], [0.36, 1.2, 3.6]])} fill={T("#D9467F")} />
      {Array.from({ length: 12 }, (_, k) => {
        const r = Math.floor(k / 4), q = k % 4, y0 = 1.3 + q * 0.3, z0 = 2.45 + r * 0.27;
        return <polygon key={k} points={pts([[0.37, y0, z0], [0.37, y0 + 0.18, z0], [0.37, y0 + 0.18, z0 + 0.15], [0.37, y0, z0 + 0.15]])} fill={T(q === 2 && r === 1 ? "#F2A6C4" : "#EDE4EE")} />;
      })}
    </g>
  ));
  // door
  {
    const [kx, ky] = P(0.37, 5.15, 1.25);
    sc.add("G", <g><polygon points={pts([[0.36, 4.9, 0], [0.36, 6.1, 0], [0.36, 6.1, 2.6], [0.36, 4.9, 2.6]])} fill={T(shade(t.shelf, 0.85))} /><circle cx={kx} cy={ky} r={3} fill={T("#C9A46A")} /></g>);
  }
  // noticeboard
  sc.add("G", (
    <g>
      <polygon points={pts([[1.2, 0.36, 2.6], [2.8, 0.36, 2.6], [2.8, 0.36, 3.6], [1.2, 0.36, 3.6]])} fill={T("#E9CFA9")} stroke={T("#FFFFFF")} strokeWidth={2} />
      <polygon points={pts([[1.4, 0.37, 2.8], [2.1, 0.37, 2.8], [2.1, 0.37, 3.4], [1.4, 0.37, 3.4]])} fill={T("#FFF6B8")} />
      <polygon points={pts([[2.2, 0.37, 2.9], [2.65, 0.37, 2.9], [2.65, 0.37, 3.35], [2.2, 0.37, 3.35]])} fill={T("#FAD1E0")} />
    </g>
  ));
  // string lights
  if (t.lights) {
    const bulb = night ? "#FFE29A" : "#FFD9A0";
    sc.add("G", (
      <g className={night ? "wl-lights" : undefined}>
        {Array.from({ length: 14 }, (_, i) => { const [lx, ly] = P(0.5 + i * 0.47, 0.38, 4.55 - Math.sin(i * 0.9) * 0.12); return <circle key={`a${i}`} cx={lx} cy={ly} r={3.2} fill={bulb} opacity={night ? 1 : 0.8} />; })}
        {Array.from({ length: 9 }, (_, i) => { const [lx, ly] = P(0.38, 0.6 + i * 0.7, 4.5 - Math.sin(i * 0.9) * 0.12); return <circle key={`b${i}`} cx={lx} cy={ly} r={3.2} fill={bulb} opacity={night ? 1 : 0.8} />; })}
      </g>
    ));
  }
  // rug (movable, lies on the floor)
  {
    const r = L.rug;
    const [rx, ry] = P(r.x + 1.5, r.y + 1, 0);
    sc.add("G", <ellipse cx={rx} cy={ry} rx={96} ry={52} fill={T(t.rug)} className={decorate && selected === "rug" ? "wl-picked" : undefined} />);
  }
  // decorate grid
  if (decorate) {
    sc.add("G", (
      <g>
        {Array.from({ length: 49 }, (_, k) => {
          const x = k % 7, y = Math.floor(k / 7);
          const ok = selected ? canPlace(selected, x, y, L) : false;
          return (
            <polygon key={k} className={`wl-tile${ok ? " ok" : ""}`} points={pts([[x, y, 0.02], [x + 1, y, 0.02], [x + 1, y + 1, 0.02], [x, y + 1, 0.02]])}
              onClick={() => ok && onPlace?.(selected, x, y)} />
          );
        })}
      </g>
    ));
  }
  // bed
  sc.box(0.36, 1, 0, 0.24, 2.6, 1.7, shade(t.shelf, 0.92), { bias: -0.6 });
  sc.box(0.6, 1, 0, 2.1, 2.6, 0.5, shade(t.shelf, 0.98));
  sc.box(0.64, 1.05, 0.5, 2, 2.5, 0.32, t.blanket, { bias: 0.2 });
  sc.box(1.45, 1.02, 0.56, 1.27, 2.56, 0.3, t.bed, { bias: 0.7 });
  sc.box(0.74, 1.2, 0.82, 0.6, 1.05, 0.24, "#FFFFFF", { bias: 2 });
  sc.box(0.74, 2.38, 0.82, 0.6, 1.05, 0.24, "#FFFFFF", { bias: 2.1 });
  // bedside table + lamp (movable)
  {
    const n = L.nightstand, ox = n.x + 0.42, oy = n.y - 0.2;
    sc.box(ox, oy, 0, 0.7, 0.7, 0.8, t.shelf);
    sc.box(ox + 0.23, oy + 0.22, 0.8, 0.24, 0.24, 0.4, "#E9D7C6", { bias: 0.3 });
    const [lx, ly] = P(ox + 0.35, oy + 0.34, 1.45);
    sc.add(ox + oy + 5, (
      <g>
        {night && <circle cx={lx} cy={ly} r={120} fill={`url(#${lampId})`} />}
        <ellipse cx={lx} cy={ly - 4} rx={14} ry={10} fill={night ? "#FFE29A" : T("#FFF1D6")} />
      </g>
    ));
  }
  // desk
  sc.box(4.2, 0.5, 0, 2.4, 1.2, 1.35, t.desk, { bias: 0.2 });
  if (t.monitor) {
    sc.box(5.1, 0.6, 1.35, 1.1, 0.15, 0.8, "#3D3552", { bias: 0.3 });
    sc.add(5.1 + 0.6 + 3, <polygon points={pts([[5.15, 0.76, 1.45], [6.15, 0.76, 1.45], [6.15, 0.76, 2.1], [5.15, 0.76, 2.1]])} fill={night ? "#8FB7E8" : "#B7D4F2"} />);
  } else {
    sc.box(5, 0.8, 1.35, 0.9, 0.6, 0.08, "#F4F0F6", { bias: 0.3 });
    sc.box(5, 0.8, 1.43, 0.9, 0.06, 0.55, "#E7E0EE", { bias: 0.3 });
  }
  // chair (movable)
  {
    const c = L.chair, ox = c.x, oy = c.y + 0.1;
    sc.box(ox, oy, 0, 0.8, 0.8, 0.7, shade(t.accent, 1.05));
    sc.box(ox, oy + 0.6, 0.7, 0.8, 0.15, 0.8, shade(t.accent, 1.05));
  }
  // bookshelf
  sc.box(2.9, 0.45, 0, 1, 0.8, 2.6, t.shelf, { bias: -0.2 });
  sc.add(2.9 + 0.45 + 1.3, (
    <g>
      {Array.from({ length: 12 }, (_, k) => {
        const s = Math.floor(k / 4), b = k % 4, z = 0.4 + s * 0.75, cols = ["#F2A6C4", "#C6B9EE", "#CEEBD1", "#F7C7BA"];
        return <polygon key={k} points={pts([[3.15 + b * 0.17, 1.26, z], [3.29 + b * 0.17, 1.26, z], [3.29 + b * 0.17, 1.26, z + 0.5], [3.15 + b * 0.17, 1.26, z + 0.5]])} fill={T(cols[(b + s) % 4])} />;
      })}
    </g>
  ));
  // plants (movable)
  {
    const a = L.plantA; sc.box(a.x + 0.2, a.y + 0.3, 0, 0.5, 0.5, 0.5, "#E9D7C6"); sc.tree(a.x + 0.45, a.y + 0.55, 0.5, 0.38, t.plant);
    const b = L.plantB; sc.box(b.x + 0.1, b.y + 0.2, 0, 0.4, 0.4, 0.4, "#E9D7C6"); sc.tree(b.x + 0.3, b.y + 0.4, 0.4, 0.3, t.plant);
  }
  // you + the four dogs
  [["you", 4.5, 3.35, 0.36, { wave: true }], ["westie", 3.5, 4.7, 0.22], ["cream", 2.3, 5.4, 0.24], ["bernie", 4.9, 5.7, 0.24], ["grey", 1.9, 4.6, 0.25]]
    .forEach(([who, x, y, s, extra]) => {
      const [px, py] = P(x, y, 0);
      sc.add(x + y + 0.6, <g className={who === "you" ? "wl-bob" : undefined}><Sprite who={who} x={px} y={py} scale={s} {...extra} /></g>);
    });

  // decorate: clickable footprints for movable pieces
  const pickers = decorate ? Object.entries(MOVABLE).map(([id, m]) => {
    const pos = L[id];
    const z = id === "rug" ? 0.03 : 0.9;
    return (
      <polygon key={id} className={`wl-pick${selected === id ? " on" : ""}`} role="button" tabIndex={0} aria-label={`Move ${m.label}`}
        points={pts([[pos.x, pos.y, z], [pos.x + m.w, pos.y, z], [pos.x + m.w, pos.y + m.d, z], [pos.x, pos.y + m.d, z]])}
        onClick={() => onSelect?.(selected === id ? null : id)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(selected === id ? null : id); } }} />
    );
  }) : null;

  return (
    <svg viewBox="0 0 800 600" className="wl-svg" role="img" aria-label={`Your room, ${t.name}, ${night ? "night" : "day"}`}>
      <defs>
        <radialGradient id={lampId}>
          <stop offset="0%" stopColor="#FFE7A8" stopOpacity={0.65} />
          <stop offset="100%" stopColor="#FFE7A8" stopOpacity={0} />
        </radialGradient>
      </defs>
      <Sky top={night ? "#3E3460" : "#F6EEF8"} bottom={night ? "#6A5A8E" : "#FDF6F0"} night={night} showSun={false} />
      {sc.render()}
      {pickers}
      {!decorate && ROOM_SPOTS.map(s => {
        const [x, y] = P(...s.at);
        return <HotspotLabel key={s.id} x={x} y={y} text={s.label} active={activeId === s.id} onClick={() => onAction?.(s.action, s)} />;
      })}
    </svg>
  );
}
