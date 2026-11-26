// Tiny isometric SVG kit for the 2.5D town and room (Phase 2 prototype).
// Shapes are collected with a depth and drawn back-to-front; "ground" shapes
// (terrain, floors, walls) always draw first, in the order they were added.

const C = Math.cos(Math.PI / 6);
const S = Math.sin(Math.PI / 6);

export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (f < 1) { r *= f; g *= f; b *= f; } else { r += (255 - r) * (f - 1); g += (255 - g) * (f - 1); b += (255 - b) * (f - 1); }
  return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

export function mix(a, b, t) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  return "#" + [16, 8, 0].map(s => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0")).join("");
}

export function makeIso(ox, oy, s) {
  const P = (x, y, z) => [ox + (x - y) * C * s, oy + (x + y) * S * s - z * s];
  const pts = list => list.map(p => P(...p).map(v => v.toFixed(1)).join(",")).join(" ");
  return { P, pts, s };
}

export function createScene(iso, tint) {
  const items = [];
  let groundSeq = 0;
  let key = 0;
  const T = c => (tint ? mix(c, tint.color, tint.amt) : c);
  const add = (depth, node) => items.push({ depth: depth === "G" ? -100000 + groundSeq++ : depth, node, key: key++ });
  const { pts, P } = iso;

  const api = {
    T,
    add,
    box(x, y, z, w, d, h, col, opt = {}) {
      const depth = opt.ground ? "G" : x + y + w / 2 + d / 2 + z * 0.02 + (opt.bias || 0);
      const wc = opt.glow ? "#FFE6A8" : T("#FFFFFF");
      const windows = [];
      for (let i = 0; i < (opt.windows || 0); i++) {
        const wy = y + (d * (i + 1)) / (opt.windows + 1);
        windows.push(<polygon key={`wr${i}`} points={pts([[x + w + 0.01, wy - 0.18, z + h * 0.45], [x + w + 0.01, wy + 0.18, z + h * 0.45], [x + w + 0.01, wy + 0.18, z + h * 0.72], [x + w + 0.01, wy - 0.18, z + h * 0.72]])} fill={wc} opacity={opt.glow ? 1 : 0.85} />);
      }
      if (opt.windows) {
        const wx = x + w * 0.5;
        windows.push(<polygon key="wl" points={pts([[wx - 0.2, y + d + 0.01, z + h * 0.45], [wx + 0.2, y + d + 0.01, z + h * 0.45], [wx + 0.2, y + d + 0.01, z + h * 0.72], [wx - 0.2, y + d + 0.01, z + h * 0.72]])} fill={wc} opacity={opt.glow ? 1 : 0.85} />);
      }
      add(depth, (
        <g>
          <polygon points={pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={T(shade(col, 1.12))} />
          <polygon points={pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={T(shade(col, 0.9))} />
          <polygon points={pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} fill={T(shade(col, 0.76))} />
          {windows}
          {opt.door && <polygon points={pts([[x + w * 0.35, y + d + 0.01, z], [x + w * 0.6, y + d + 0.01, z], [x + w * 0.6, y + d + 0.01, z + h * 0.38], [x + w * 0.35, y + d + 0.01, z + h * 0.38]])} fill={T(shade(col, 0.62))} />}
        </g>
      ));
    },
    roof(x, y, z, w, d, rh, col) {
      const ax = x + w / 2, ay = y + d / 2, az = z + rh;
      add(x + y + w / 2 + d / 2 + z * 0.02 + 0.01, (
        <g>
          <polygon points={pts([[x - 0.12, y + d + 0.12, z], [x + w + 0.12, y + d + 0.12, z], [ax, ay, az]])} fill={T(shade(col, 0.95))} />
          <polygon points={pts([[x + w + 0.12, y - 0.12, z], [x + w + 0.12, y + d + 0.12, z], [ax, ay, az]])} fill={T(shade(col, 0.8))} />
        </g>
      ));
    },
    tree(x, y, z, r, col) {
      const [px, py] = P(x, y, z);
      const s = iso.s;
      add(x + y + z * 0.02 + 0.3, (
        <g>
          <rect x={px - s * 0.08} y={py - s * 0.45} width={s * 0.16} height={s * 0.45} rx={2} fill={T("#B98A63")} />
          <circle cx={px} cy={py - s * (0.45 + r)} r={s * r} fill={T(col)} />
          <circle cx={px - s * r * 0.3} cy={py - s * (0.45 + r * 1.25)} r={s * r * 0.45} fill={T(shade(col, 1.18))} opacity={0.8} />
        </g>
      ));
    },
    flat(points, z, col, depth = "G", opacity = 1) {
      add(depth, <polygon points={pts(points.map(p => [p[0], p[1], z]))} fill={T(col)} opacity={opacity} />);
    },
    render() {
      return [...items].sort((a, b) => a.depth - b.depth).map(i => <g key={i.key}>{i.node}</g>);
    },
  };
  return api;
}

// Speech-bubble label used for clickable spots.
export function HotspotLabel({ x, y, text, onClick, active }) {
  const w = text.length * 7.4 + 24;
  return (
    <g className="wl-hotspot" onClick={onClick} role="button" tabIndex={0} aria-label={text}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}>
      <rect x={x - w / 2} y={y - 28} width={w} height={25} rx={12.5} fill={active ? "#B8306A" : "#D9467F"} />
      <polygon points={`${x - 5},${y - 4} ${x + 5},${y - 4} ${x},${y + 3}`} fill={active ? "#B8306A" : "#D9467F"} />
      <text x={x} y={y - 11} textAnchor="middle" fontFamily="Nunito, system-ui, sans-serif" fontSize={12.5} fontWeight={800} fill="#fff">{text}</text>
    </g>
  );
}
