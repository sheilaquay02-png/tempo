// Soft "vinyl toy" building blocks shared by the 3D town and room.
// Units: 1 = one floor tile. y is up. Boxes are placed by their corner.
import { useMemo, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { Shape, ExtrudeGeometry, CanvasTexture, SRGBColorSpace } from "three";

export const Soft = ({ color, rough = 0.62, glow, glowAmt = 1, opacity }) => (
  <meshStandardMaterial color={color} roughness={rough} metalness={0}
    emissive={glow || "#000000"} emissiveIntensity={glow ? glowAmt : 0}
    transparent={opacity != null} opacity={opacity ?? 1} />
);

export function lighten(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (f < 1) { r *= f; g *= f; b *= f; } else { r += (255 - r) * (f - 1); g += (255 - g) * (f - 1); b += (255 - b) * (f - 1); }
  return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

// Clickable helper: pointer cursor + gentle highlight.
export function useHover(onClick) {
  const [hover, setHover] = useState(false);
  if (!onClick) return [false, {}];
  return [hover, {
    onClick: e => { e.stopPropagation(); onClick(); },
    onPointerOver: e => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; },
    onPointerOut: () => { setHover(false); document.body.style.cursor = ""; },
  }];
}

export function Box({ x = 0, y = 0, z = 0, w, h, d, color, r = 0.08, glow, glowAmt, onClick, rough, shadow = true }) {
  const [hover, handlers] = useHover(onClick);
  const rad = Math.max(0.005, Math.min(r, w / 2.05, h / 2.05, d / 2.05));
  return (
    <RoundedBox args={[w, h, d]} radius={rad} smoothness={3} position={[x + w / 2, y + h / 2, z + d / 2]}
      castShadow={shadow} receiveShadow {...handlers}>
      <Soft color={hover ? lighten(color, 1.12) : color} glow={glow} glowAmt={glowAmt} rough={rough} />
    </RoundedBox>
  );
}

export function Ball({ p, r, color, s, glow, glowAmt, rough, seg = 24 }) {
  return (
    <mesh position={p} scale={s} castShadow receiveShadow>
      <sphereGeometry args={[r, seg, Math.round(seg * 0.75)]} />
      <Soft color={color} glow={glow} glowAmt={glowAmt} rough={rough} />
    </mesh>
  );
}

export function Pill({ p, r, len, color, rot, s }) {
  return (
    <mesh position={p} rotation={rot} scale={s} castShadow receiveShadow>
      <capsuleGeometry args={[r, len, 8, 16]} />
      <Soft color={color} />
    </mesh>
  );
}

// Soft gable roof running along x. (x, y, z) = corner at the eaves.
export function Roof({ x, y, z, w, d, h, color, onClick }) {
  const [hover, handlers] = useHover(onClick);
  const geo = useMemo(() => {
    const s = new Shape();
    s.moveTo(-d / 2 - 0.12, 0); s.lineTo(0, h); s.lineTo(d / 2 + 0.12, 0); s.lineTo(-d / 2 - 0.12, 0);
    const g = new ExtrudeGeometry(s, { depth: w + 0.16, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 3 });
    g.rotateY(Math.PI / 2);
    g.translate(-0.08, 0, 0);
    return g;
  }, [w, d, h]);
  return (
    <mesh geometry={geo} position={[x, y, z + d / 2]} castShadow receiveShadow {...handlers}>
      <Soft color={hover ? lighten(color, 1.12) : color} />
    </mesh>
  );
}

export function Cone({ p, r, h, color, seg = 24, rot }) {
  return (
    <mesh position={p} rotation={rot} castShadow receiveShadow>
      <coneGeometry args={[r, h, seg]} />
      <Soft color={color} />
    </mesh>
  );
}

export function Cyl({ p, r, r2, h, color, seg = 28, rot, glow, glowAmt, onClick }) {
  const [hover, handlers] = useHover(onClick);
  return (
    <mesh position={p} rotation={rot} castShadow receiveShadow {...handlers}>
      <cylinderGeometry args={[r, r2 ?? r, h, seg]} />
      <Soft color={hover ? lighten(color, 1.12) : color} glow={glow} glowAmt={glowAmt} />
    </mesh>
  );
}

export function Tree({ x, z, y = 0, size = 1, color = "#9ED8A8", kind = "round" }) {
  if (kind === "pine") {
    return (
      <group position={[x, y, z]} scale={size}>
        <Cyl p={[0, 0.12, 0]} r={0.07} h={0.24} color="#B98A63" />
        <Cone p={[0, 0.5, 0]} r={0.32} h={0.55} color={color} />
        <Cone p={[0, 0.82, 0]} r={0.24} h={0.45} color={lighten(color, 1.08)} />
      </group>
    );
  }
  return (
    <group position={[x, y, z]} scale={size}>
      <Cyl p={[0, 0.18, 0]} r={0.07} r2={0.09} h={0.36} color="#B98A63" />
      <Ball p={[0, 0.62, 0]} r={0.34} color={color} />
      <Ball p={[0.16, 0.78, 0.08]} r={0.2} color={lighten(color, 1.1)} />
    </group>
  );
}

export function Cloud({ p, s = 1, color = "#FFFFFF" }) {
  return (
    <group position={p} scale={s}>
      {[[0, 0, 0, 0.55], [0.6, 0.1, 0.1, 0.45], [-0.55, -0.05, 0, 0.42], [0.15, 0.32, -0.05, 0.42], [0.1, -0.05, 0.35, 0.4]].map(([x, y, z, r], i) => (
        <Ball key={i} p={[x, y, z]} r={r} color={color} rough={0.9} />
      ))}
    </group>
  );
}

// Vertical gradient picture (used for windows and the sky through them).
export function useGradientTexture(stops, key) {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = 4; c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, 128);
    stops.forEach(([o, col]) => grad.addColorStop(o, col));
    g.fillStyle = grad; g.fillRect(0, 0, 4, 128);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
