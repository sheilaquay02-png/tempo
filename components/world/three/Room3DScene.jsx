// Your room in 3D as a cosy diorama: rounded base, two walls, glowing string
// lights, sunset window, plush bed, desk, shelf, you and the dogs.
// Uses the same layout, themes and clickable spots as the 2.5D room.
import { Box, Ball, Cyl, Cone, Tree, useGradientTexture, lighten, useHover } from "./Toys";
import { You3D, Dog3D } from "./Characters3D";
import { ROOM_THEMES } from "../worldData";
import { DEFAULT_LAYOUT, canPlace, ROOM_SPOTS } from "../Room25D";

// 2.5D spot (x, y, z-up) -> 3D (x, y-up, z)
export const ROOM_3D_SPOTS = ROOM_SPOTS.map(s => ({ ...s, pos: [s.at[0], s.at[2] - 0.15, s.at[1]] }));
export const ROOM_VIEW = { target: [3.4, 1.7, 3.4], span: 9.2 };

function Pickable({ id, decorate, selected, onSelect, children }) {
  const [, handlers] = useHover(decorate ? () => onSelect?.(selected === id ? null : id) : null);
  return <group {...handlers}>{children}</group>;
}

function Plush({ p, color, ears = "round", s = 1, rotY = 0 }) {
  return (
    <group position={p} scale={s} rotation={[0, rotY, 0]}>
      <Ball p={[0, 0.16, 0]} r={0.17} s={[1, 0.9, 0.9]} color={color} />
      <Ball p={[0, 0.38, 0.02]} r={0.16} color={color} />
      {ears === "bunny"
        ? [-0.07, 0.07].map(x => <Ball key={x} p={[x, 0.6, 0]} r={0.05} s={[0.8, 2.4, 0.6]} color={color} />)
        : [-0.12, 0.12].map(x => <Ball key={x} p={[x, 0.5, 0]} r={0.055} color={lighten(color, 0.92)} />)}
      {[-0.055, 0.055].map(x => <Ball key={`e${x}`} p={[x, 0.4, 0.15]} r={0.018} color="#2A1C1A" rough={0.2} />)}
      <Ball p={[0, 0.35, 0.15]} r={0.03} s={[1.3, 0.8, 0.6]} color="#FFFFFF" />
    </group>
  );
}

export default function Room3DScene({ theme = "kawaii", night, layout, onAction, decorate, selected, onSelect, onPlace }) {
  const t = ROOM_THEMES[theme] || ROOM_THEMES.kawaii;
  const L = { ...DEFAULT_LAYOUT, ...layout };
  const act = id => { const s = ROOM_3D_SPOTS.find(x => x.id === id); onAction?.(s.action, s); };
  const sky = useGradientTexture(night ? [[0, "#2E2A66"], [0.6, "#6B57A8"], [1, "#C98CC0"]] : [[0, "#9CCFF0"], [0.55, "#F8C9D8"], [1, "#FFD9A8"]], night ? "n" : "d");
  const bulb = night ? "#FFE29A" : "#FFE9C2";
  const frame = t.accent;
  const n = L.nightstand, c = L.chair;

  return (
    <group>
      {/* rounded diorama base, floor boards and two walls */}
      <Box x={-0.5} y={-0.5} z={-0.5} w={8} h={0.45} d={8} color={lighten(t.floor, 1.25)} r={0.18} />
      <Box x={0} y={-0.08} z={0} w={7} h={0.08} d={7} color={t.floor} r={0.03} />
      {Array.from({ length: 6 }, (_, i) => <Box key={i} x={i + 0.98} y={-0.005} z={0.05} w={0.03} h={0.01} d={6.9} color={lighten(t.floor, 0.9)} r={0.004} shadow={false} />)}
      <Box x={-0.5} y={-0.08} z={-0.5} w={8} h={4.6} d={0.5} color={t.wallA} r={0.16} />
      <Box x={-0.5} y={-0.08} z={-0.5} w={0.5} h={4.6} d={8} color={t.wallB} r={0.16} />
      <Box x={0} y={-0.05} z={0} w={7} h={0.22} d={0.06} color={t.trim} r={0.03} />
      <Box x={0} y={-0.05} z={0} w={0.06} h={0.22} d={7} color={t.trim} r={0.03} />

      {/* window with sunset (day) or starry (night) sky, curtains and a bow */}
      <group onClick={e => { e.stopPropagation(); act("window"); }}>
        <Box x={3.5} y={1.85} z={-0.02} w={2.1} h={1.8} d={0.14} color={t.trim} r={0.08} />
        <mesh position={[4.55, 2.75, 0.13]}>
          <planeGeometry args={[1.8, 1.5]} />
          <meshBasicMaterial map={sky} toneMapped={false} />
        </mesh>
        {night
          ? <><Ball p={[5.0, 3.15, 0.15]} r={0.14} color="#FFF1C2" glow="#FFF1C2" glowAmt={1} />{[[3.95, 3.25], [4.3, 2.9], [4.8, 3.35], [5.2, 2.6], [4.1, 2.4]].map(([x, y], i) => <Ball key={i} p={[x, y, 0.15]} r={0.025} color="#FFF7D6" glow="#FFF7D6" glowAmt={1} seg={8} />)}</>
          : <><Ball p={[4.55, 2.15, 0.14]} r={0.22} s={[1, 1, 0.3]} color="#FFE7A8" glow="#FFD27A" glowAmt={0.8} /><Ball p={[4.0, 3.1, 0.16]} r={0.13} s={[1.6, 0.8, 0.3]} color="#FFFFFF" /><Ball p={[5.1, 3.25, 0.16]} r={0.11} s={[1.6, 0.8, 0.3]} color="#FFFFFF" /></>}
        <Box x={3.55} y={1.85} z={0.12} w={2} h={0.08} d={0.12} color={t.trim} r={0.03} />
      </group>
      <Box x={3.2} y={1.7} z={0.05} w={0.4} h={2.1} d={0.16} color={lighten(t.bed, 1.15)} r={0.12} />
      <Box x={5.5} y={1.7} z={0.05} w={0.4} h={2.1} d={0.16} color={lighten(t.bed, 1.15)} r={0.12} />
      <Ball p={[4.55, 3.8, 0.12]} r={0.11} s={[1.8, 1, 0.6]} color="#F7C873" />

      {/* calendar on the left wall */}
      <group onClick={e => { e.stopPropagation(); act("calendar"); }}>
        <Box x={-0.02} y={2.2} z={1.2} w={0.08} h={1.3} d={1.3} color="#FFFFFF" r={0.05} />
        <Box x={0.02} y={3.18} z={1.25} w={0.06} h={0.3} d={1.2} color="#D9467F" r={0.03} />
        {Array.from({ length: 12 }, (_, k) => {
          const r = Math.floor(k / 4), q = k % 4;
          return <Box key={k} x={0.05} y={2.35 + r * 0.26} z={1.32 + q * 0.27} w={0.02} h={0.16} d={0.18} color={q === 2 && r === 1 ? "#F2A6C4" : "#EDE4EE"} r={0.01} shadow={false} />;
        })}
      </group>

      {/* door on the left wall */}
      <group onClick={e => { e.stopPropagation(); act("door"); }}>
        <Box x={-0.04} y={0} z={4.85} w={0.12} h={2.7} d={1.3} color={t.trim} r={0.08} />
        <Box x={0} y={0.05} z={4.92} w={0.1} h={2.55} d={1.16} color={lighten(t.shelf, 0.88)} r={0.08} />
        <Ball p={[0.13, 1.25, 5.15]} r={0.05} color="#E6C56E" rough={0.35} />
      </group>

      {/* noticeboard with sticky notes (affirmation) + moon and stars */}
      <group onClick={e => { e.stopPropagation(); act("board"); }}>
        <Box x={1.2} y={2.55} z={-0.02} w={1.6} h={1.05} d={0.1} color="#E9CFA9" r={0.06} />
        <Box x={1.35} y={2.72} z={0.07} w={0.65} h={0.65} d={0.03} color="#FFF6B8" r={0.02} />
        <Box x={2.12} y={2.85} z={0.07} w={0.5} h={0.5} d={0.03} color="#FAD1E0" r={0.02} />
        <Ball p={[1.65, 3.3, 0.1]} r={0.04} color="#D9467F" />
      </group>
      <Ball p={[6.2, 3.3, 0.06]} r={0.32} s={[1, 1, 0.25]} color={t.trim} />
      <Ball p={[6.2, 3.3, 0.1]} r={0.25} s={[1, 1, 0.2]} color={night ? "#8B7BC4" : "#DDEFF7"} rough={0.15} />
      <Cone p={[0.8, 3.9, 0.1]} r={0.1} h={0.18} seg={5} rot={[Math.PI / 2, 0, 0]} color="#F7C873" />
      <Cone p={[2.9, 3.85, 0.1]} r={0.08} h={0.16} seg={5} rot={[Math.PI / 2, 0, 0]} color="#F7C873" />

      {/* string lights along both walls */}
      {t.lights && Array.from({ length: 15 }, (_, i) => (
        <Ball key={`a${i}`} p={[0.3 + i * 0.46, 4.25 - Math.abs(Math.sin(i * 0.9)) * 0.18, 0.12]} r={0.07} color={bulb} glow="#FFC870" glowAmt={night ? 2.2 : 0.55} seg={10} />
      ))}
      {t.lights && Array.from({ length: 15 }, (_, i) => (
        <Ball key={`b${i}`} p={[0.12, 4.25 - Math.abs(Math.sin(i * 0.9)) * 0.18, 0.3 + i * 0.46]} r={0.07} color={bulb} glow="#FFC870" glowAmt={night ? 2.2 : 0.55} seg={10} />
      ))}

      {/* rug + slippers (rug can move) */}
      <Pickable id="rug" decorate={decorate} selected={selected} onSelect={onSelect}>
        <mesh position={[L.rug.x + 1.5, 0.015, L.rug.y + 1]} scale={[1.5, 1, 1]} receiveShadow>
          <cylinderGeometry args={[1, 1, 0.03, 48]} />
          <meshStandardMaterial color={decorate && selected === "rug" ? lighten(t.rug, 1.15) : t.rug} roughness={0.95} />
        </mesh>
      </Pickable>
      <Ball p={[L.rug.x + 1.0, 0.05, L.rug.y + 1.5]} r={0.11} s={[0.8, 0.5, 1.4]} color="#F7D774" />
      <Ball p={[L.rug.x + 1.3, 0.05, L.rug.y + 1.6]} r={0.11} s={[0.8, 0.5, 1.4]} color="#F7D774" />

      {/* bed: arched headboard, rounded frame, mattress, blanket, pillows, plushies */}
      <Box x={0.05} y={0} z={1} w={0.24} h={1.15} d={2.6} color={frame} r={0.1} />
      <mesh position={[0.17, 1.05, 2.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[1.25, 1.25, 0.24, 40, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={frame} roughness={0.6} />
      </mesh>
      <Ball p={[0.17, 1.2, 1.0]} r={0.1} color={lighten(frame, 1.2)} />
      <Ball p={[0.17, 1.2, 3.6]} r={0.1} color={lighten(frame, 1.2)} />
      <Box x={0.3} y={0} z={1} w={2.4} h={0.42} d={2.6} color={frame} r={0.12} />
      <Box x={0.35} y={0.4} z={1.05} w={2.3} h={0.26} d={2.5} color="#FFFFFF" r={0.12} />
      <Box x={1.15} y={0.6} z={0.98} w={1.62} h={0.14} d={2.64} color={t.bed} r={0.07} />
      <Box x={1.0} y={0.6} z={1.02} w={0.4} h={0.16} d={2.56} color={t.blanket} r={0.08} />
      <Box x={0.45} y={0.62} z={1.2} w={0.55} h={0.24} d={1.0} color="#FFFFFF" r={0.12} />
      <Box x={0.45} y={0.62} z={2.4} w={0.55} h={0.24} d={1.0} color={lighten(t.blanket, 0.98)} r={0.12} />
      <Plush p={[0.9, 0.72, 1.6]} color="#F7A8A0" s={0.9} rotY={Math.PI / 2.3} />
      <Plush p={[0.95, 0.72, 2.9]} color="#FFF6EE" ears="bunny" s={0.85} rotY={Math.PI / 2.3} />

      {/* bedside table + mushroom lamp (can move) */}
      <Pickable id="nightstand" decorate={decorate} selected={selected} onSelect={onSelect}>
        <group position={[n.x + 0.42, 0, n.y - 0.2]}>
          <Box x={0} y={0} z={0} w={0.75} h={0.8} d={0.75} color={decorate && selected === "nightstand" ? lighten(t.shelf, 1.15) : t.shelf} r={0.08} />
          <Box x={0.08} y={0.12} z={0.74} w={0.6} h={0.26} d={0.04} color={lighten(t.shelf, 1.08)} r={0.04} />
          <Box x={0.08} y={0.44} z={0.74} w={0.6} h={0.26} d={0.04} color={lighten(t.shelf, 1.08)} r={0.04} />
          <Ball p={[0.38, 0.25, 0.8]} r={0.035} color="#E6C56E" />
          <Ball p={[0.38, 0.57, 0.8]} r={0.035} color="#E6C56E" />
          <Cyl p={[0.37, 0.95, 0.37]} r={0.05} h={0.3} color="#FFF6EA" seg={12} />
          <mesh position={[0.37, 1.12, 0.37]} castShadow>
            <sphereGeometry args={[0.24, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={night ? "#FFD9A0" : "#F9B9CB"} emissive={night ? "#FFC870" : "#000000"} emissiveIntensity={night ? 1.2 : 0} roughness={0.5} />
          </mesh>
          {night && <pointLight position={[0.37, 1.0, 0.6]} intensity={5} distance={5} decay={1.6} color="#FFCF85" />}
        </group>
      </Pickable>

      {/* desk with drawers and a monitor (desk opens tasks) */}
      <group onClick={e => { e.stopPropagation(); act("desk"); }}>
        <Box x={4.2} y={1.15} z={0.4} w={2.5} h={0.14} d={1.25} color={t.desk} r={0.06} />
        <Box x={5.85} y={0} z={0.45} w={0.8} h={1.15} d={1.15} color={t.desk} r={0.08} />
        {[0.18, 0.55].map(y => <Box key={y} x={5.92} y={y} z={1.58} w={0.66} h={0.3} d={0.04} color={lighten(t.desk, 1.08)} r={0.04} />)}
        <Box x={4.3} y={0} z={0.5} w={0.12} h={1.15} d={1.05} color={t.desk} r={0.05} />
        {t.monitor
          ? <><Box x={4.65} y={1.3} z={0.5} w={1.5} h={0.95} d={0.12} color="#3D3552" r={0.08} />
            <Box x={4.73} y={1.38} z={0.6} w={1.34} h={0.79} d={0.03} color={night ? "#8FB7E8" : "#B7D4F2"} r={0.04} glow="#8FB7E8" glowAmt={night ? 0.9 : 0.25} />
            <Box x={4.75} y={1.29} z={1.05} w={0.9} h={0.05} d={0.3} color="#E9E2F4" r={0.02} /></>
          : <><Box x={4.85} y={1.3} z={0.55} w={1.0} h={0.72} d={0.1} color={lighten(t.bed, 1.05)} r={0.1} />
            <Box x={4.93} y={1.38} z={0.64} w={0.84} h={0.56} d={0.03} color={night ? "#C9B6E6" : "#DDEFF7"} r={0.05} glow="#C9B6E6" glowAmt={night ? 0.6 : 0.1} />
            <Box x={4.9} y={1.29} z={0.95} w={0.8} h={0.04} d={0.28} color="#FFFFFF" r={0.02} /></>}
        <Cyl p={[4.45, 1.38, 0.75]} r={0.09} r2={0.07} h={0.18} color="#FFFFFF" seg={14} />
        <Ball p={[4.45, 1.55, 0.75]} r={0.12} color={t.plant} />
      </group>

      {/* chair (can move) */}
      <Pickable id="chair" decorate={decorate} selected={selected} onSelect={onSelect}>
        <group position={[c.x + 0.1, 0, c.y + 0.15]}>
          {[[0.05, 0.05], [0.6, 0.05], [0.05, 0.6], [0.6, 0.6]].map(([x, z], i) => <Box key={i} x={x} y={0} z={z} w={0.1} h={0.5} d={0.1} color={lighten(t.shelf, 0.92)} r={0.04} />)}
          <Box x={0} y={0.48} z={0} w={0.75} h={0.14} d={0.75} color={decorate && selected === "chair" ? lighten(t.accent, 1.2) : lighten(t.accent, 1.05)} r={0.07} />
          <Box x={0} y={0.6} z={0.62} w={0.75} h={0.75} d={0.13} color={lighten(t.accent, 1.05)} r={0.07} />
        </group>
      </Pickable>

      {/* bookshelf */}
      <Box x={2.85} y={0} z={0.35} w={1.05} h={2.6} d={0.85} color={t.shelf} r={0.08} />
      {Array.from({ length: 12 }, (_, k) => {
        const s = Math.floor(k / 4), b = k % 4, cols = ["#F2A6C4", "#C6B9EE", "#CEEBD1", "#F7C7BA"];
        return <Box key={k} x={3.0 + b * 0.2} y={0.35 + s * 0.78} z={1.0} w={0.15} h={0.52 - (b % 2) * 0.08} d={0.22} color={cols[(b + s) % 4]} r={0.03} />;
      })}
      <Plush p={[3.4, 2.6, 0.75]} color="#E9C79F" s={0.75} />

      {/* plants (can move) */}
      <Pickable id="plantA" decorate={decorate} selected={selected} onSelect={onSelect}>
        <group position={[L.plantA.x + 0.45, 0, L.plantA.y + 0.55]}>
          <Cyl p={[0, 0.25, 0]} r={0.26} r2={0.2} h={0.5} color={decorate && selected === "plantA" ? "#FFFFFF" : "#F3E2D2"} />
          <Tree x={0} z={0} y={0.45} size={0.95} color={t.plant} />
        </group>
      </Pickable>
      <Pickable id="plantB" decorate={decorate} selected={selected} onSelect={onSelect}>
        <group position={[L.plantB.x + 0.3, 0, L.plantB.y + 0.4]}>
          <Cyl p={[0, 0.2, 0]} r={0.2} r2={0.16} h={0.4} color={decorate && selected === "plantB" ? "#FFFFFF" : "#F3E2D2"} />
          <Tree x={0} z={0} y={0.35} size={0.75} color={t.plant} />
        </group>
      </Pickable>

      {/* you + the four dogs */}
      <You3D position={[4.5, 0, 3.4]} scale={0.95} rotY={-0.35} />
      <Dog3D who="westie" position={[3.4, 0, 4.7]} scale={0.8} rotY={0.3} />
      <Dog3D who="cream" position={[2.2, 0, 5.4]} scale={0.85} rotY={0.5} />
      <Dog3D who="bernie" position={[4.9, 0, 5.6]} scale={0.85} rotY={-0.4} />
      <Dog3D who="grey" position={[1.9, 0, 4.3]} scale={0.85} rotY={0.8} />

      {/* decorate: floor tiles that light up where the picked piece can go */}
      {decorate && selected && Array.from({ length: 49 }, (_, k) => {
        const x = k % 7, y = Math.floor(k / 7);
        if (!canPlace(selected, x, y, L)) return null;
        return (
          <mesh key={k} position={[x + 0.5, 0.04, y + 0.5]} rotation={[-Math.PI / 2, 0, 0]}
            onClick={e => { e.stopPropagation(); onPlace?.(selected, x, y); }}
            onPointerOver={e => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { document.body.style.cursor = ""; }}>
            <planeGeometry args={[0.9, 0.9]} />
            <meshBasicMaterial color="#D9467F" transparent opacity={0.35} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}
