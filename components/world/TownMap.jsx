// 2.5D town map (layout B: compact neighbourhood) with layout A's evening sky.
// Buildings are clickable: My Home opens the room; the others open sample panels.
import { createScene, makeIso, HotspotLabel } from "./isoKit";
import { Sky, Cloud } from "./Sky";
import { Sprite } from "./CastSprites";

export const TOWN_BUILDINGS = [
  { id: "calendar", label: "Calendar Tower", action: { panel: "calendar" }, hull: [1.2, 1.2, 0, 3, 2.6, 6], labelAt: [2.75, 2.55, 6.6] },
  { id: "tasks", label: "Task Studio", action: { panel: "tasks" }, hull: [9, 1.3, 0, 3, 2.6, 3.7], labelAt: [10.5, 2.6, 4.4] },
  { id: "home", label: "My Home", action: { go: "room" }, hull: [1.4, 9.2, 0, 2.8, 2.6, 3.4], labelAt: [2.8, 10.5, 4.1] },
  { id: "budget", label: "Budget Shop", action: { panel: "budget" }, hull: [12.2, 9, 0, 1.5, 3, 2.7], labelAt: [12.95, 10.5, 3.4] },
];

function hullPoints(P, [x, y, z, w, d, h]) {
  return [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z), P(x, y + d, z + h)]
    .map(p => p.map(v => v.toFixed(1)).join(",")).join(" ");
}

export default function TownMap({ night = false, onAction, activeId }) {
  const iso = makeIso(400, 160, 24);
  const sc = createScene(iso, night ? { color: "#4B3E7A", amt: 0.28 } : null);
  const glow = night;
  const { P } = iso;

  sc.box(0, 0, -1.6, 14, 14, 1.6, "#D9A98E", { ground: true });
  sc.flat([[0, 0], [14, 0], [14, 14], [0, 14]], 0, "#C3E8BC");
  sc.flat([[6.2, 0], [7.8, 0], [7.8, 14], [6.2, 14]], 0.01, "#D9D2E6");
  sc.flat([[0, 6.2], [14, 6.2], [14, 7.8], [0, 7.8]], 0.01, "#D9D2E6");
  sc.flat([[10.4, 7.8], [11.4, 7.8], [11.4, 14], [10.4, 14]], 0.02, "#A8D8EE");
  sc.box(10.2, 9.6, 0, 1.4, 1, 0.25, "#F2D7C5", { bias: 0.5 });
  sc.flat([[8.4, 8.4], [10, 8.4], [10, 13.4], [8.4, 13.4]], 0.02, "#B5E1AE");
  {
    const [cx, cy] = P(9.2, 10.6, 0);
    sc.add("G", <g><ellipse cx={cx} cy={cy} rx={16} ry={9} fill={sc.T("#A8D8EE")} stroke={sc.T("#FFFFFF")} strokeWidth={3} /><circle cx={cx} cy={cy - 6} r={3.5} fill={sc.T("#FFFFFF")} /></g>);
  }
  // Calendar Tower
  sc.box(1.2, 1.2, 0, 3, 2.6, 2.2, "#C6B9EE", { windows: 2, glow, door: true }); sc.roof(1.2, 1.2, 2.2, 3, 2.6, 0.1, "#9C8BDA");
  sc.box(2.1, 1.9, 2.2, 1.3, 1.3, 2.6, "#C6B9EE", { windows: 1, glow }); sc.roof(2.1, 1.9, 4.8, 1.3, 1.3, 1.2, "#9C8BDA");
  {
    const [cx, cy] = P(3.4, 2.55, 4.1);
    sc.add(2.1 + 1.9 + 1.3 + 8.7, <circle cx={cx} cy={cy} r={8} fill="#FFF6EA" stroke="#7D6CBC" strokeWidth={2} />);
  }
  // Task Studio, My Home, Budget Shop
  sc.box(9, 1.3, 0, 3, 2.6, 2.3, "#CEEBD1", { windows: 2, glow, door: true }); sc.roof(9, 1.3, 2.3, 3, 2.6, 1.4, "#8FC9A0");
  sc.box(1.4, 9.2, 0, 2.8, 2.6, 2, "#F7C7BA", { windows: 2, glow, door: true }); sc.roof(1.4, 9.2, 2, 2.8, 2.6, 1.4, "#E8A0B8");
  sc.box(12.2, 9, 0, 1.5, 3, 1.7, "#FCE3B0", { windows: 2, glow, door: true }); sc.roof(12.2, 9, 1.7, 1.5, 3, 1, "#F2B36F");
  [[5, 1], [5, 4.6], [12.6, 4.6], [4.8, 12.6], [1, 5], [9, 5]].forEach(([x, y]) => sc.tree(x, y, 0, 0.42, y > 8 ? "#A9DDB1" : "#F2A6C4"));
  [[8.8, 12.8], [9.6, 8.9]].forEach(([x, y]) => sc.tree(x, y, 0, 0.36, "#9FD5A8"));

  // You walking the dogs along the main road.
  const walkers = [["you", 6.9, 9.6, 0.2], ["westie", 7.3, 10.5, 0.12], ["cream", 6.6, 10.9, 0.13], ["bernie", 7.5, 11.4, 0.13], ["grey", 6.8, 11.8, 0.13]];
  walkers.forEach(([who, x, y, s]) => {
    const [px, py] = P(x, y, 0);
    sc.add(x + y + 0.6, <Sprite who={who} x={px} y={py} scale={s} />);
  });

  const cloudCol = night ? "#E9D3EE" : "#FFFFFF";
  return (
    <svg viewBox="0 0 800 600" className="wl-svg" role="img" aria-label={`Tempo Town, ${night ? "evening" : "daytime"}`}>
      <Sky top={night ? "#6D5BA8" : "#CDEBF5"} bottom={night ? "#E7B7D8" : "#FFF1E8"} night={night} />
      <g className="wl-drift"><Cloud x={60} y={90} s={1} col={cloudCol} /></g>
      <g className="wl-drift wl-drift-slow"><Cloud x={520} y={120} s={0.9} col={cloudCol} /></g>
      {sc.render()}
      {TOWN_BUILDINGS.map(b => (
        <polygon key={b.id} className="wl-hit" points={hullPoints(P, b.hull)} fill="transparent" onClick={() => onAction?.(b.action, b)} aria-hidden="true" />
      ))}
      {TOWN_BUILDINGS.map(b => {
        const [x, y] = P(...b.labelAt);
        return <HotspotLabel key={b.id} x={x} y={y} text={b.label} active={activeId === b.id} onClick={() => onAction?.(b.action, b)} />;
      })}
    </svg>
  );
}
