// Tempo Town in 3D — layout B (compact neighbourhood) on a floating toy island,
// with layout A's evening sky. Clicking a building opens its panel; My Home opens your room.
import { Box, Roof, Cyl, Cone, Ball, Tree, Cloud, lighten } from "./Toys";
import { You3D, Dog3D } from "./Characters3D";

export const TOWN_SPOTS = [
  { id: "calendar", label: "Calendar Tower", action: { panel: "calendar" }, pos: [2.75, 5.6, 2.5] },
  { id: "tasks", label: "Task Studio", action: { panel: "tasks" }, pos: [10.5, 3.2, 2.6] },
  { id: "home", label: "My Home", action: { go: "room" }, pos: [2.8, 3.1, 10.5] },
  { id: "budget", label: "Budget Shop", action: { panel: "budget" }, pos: [12.95, 2.7, 10.5] },
];
export const TOWN_VIEW = { target: [7, 0.8, 7], span: 13.5 };

// Windows on the two faces the camera sees (+x and +z).
function Windows({ x, z, w, d, rows = [0.55], night, cols = 2, frame = "#FFFFFF" }) {
  const glass = night ? "#FFE3A3" : "#BFE6F5";
  const glow = night ? "#FFCF7A" : undefined;
  const out = [];
  rows.forEach((y, r) => {
    for (let i = 0; i < cols; i++) {
      const cx = x + (w * (i + 1)) / (cols + 1);
      out.push(<Box key={`f${r}${i}`} x={cx - 0.19} y={y - 0.02} z={z + d - 0.02} w={0.38} h={0.42} d={0.06} color={frame} r={0.04} shadow={false} />);
      out.push(<Box key={`g${r}${i}`} x={cx - 0.14} y={y + 0.03} z={z + d + 0.01} w={0.28} h={0.32} d={0.04} color={glass} r={0.03} glow={glow} glowAmt={0.9} shadow={false} />);
      const cz = z + (d * (i + 1)) / (cols + 1);
      out.push(<Box key={`F${r}${i}`} x={x + w - 0.02} y={y - 0.02} z={cz - 0.19} w={0.06} h={0.42} d={0.38} color={frame} r={0.04} shadow={false} />);
      out.push(<Box key={`G${r}${i}`} x={x + w + 0.01} y={y + 0.03} z={cz - 0.14} w={0.04} h={0.32} d={0.28} color={glass} r={0.03} glow={glow} glowAmt={0.9} shadow={false} />);
    }
  });
  return <>{out}</>;
}

function Door({ x, z, w, d, color }) {
  return (
    <>
      <Box x={x + w * 0.38} y={0} z={z + d - 0.02} w={w * 0.24} h={0.5} d={0.07} color={color} r={0.05} />
      <Ball p={[x + w * 0.56, 0.25, z + d + 0.06]} r={0.025} color="#E6C56E" />
    </>
  );
}

function Awning({ x, z, w, y, colA, colB }) {
  const n = Math.max(3, Math.round(w / 0.3));
  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <Box key={i} x={x + (i * w) / n} y={y} z={z} w={w / n + 0.005} h={0.08} d={0.38} color={i % 2 ? colB : colA} r={0.03} />
      ))}
    </group>
  );
}

function StreetLamp({ x, z, night }) {
  return (
    <group>
      <Cyl p={[x, 0.45, z]} r={0.035} h={0.9} color="#8C84A8" seg={10} />
      <Ball p={[x, 0.95, z]} r={0.09} color={night ? "#FFE7A8" : "#FFF6E0"} glow={night ? "#FFD27A" : undefined} glowAmt={1.6} />
    </group>
  );
}

function Balloon({ p }) {
  return (
    <group position={p}>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} rotation={[0, (i / 8) * Math.PI * 2, 0]} castShadow>
          <sphereGeometry args={[0.55, 16, 16, 0, Math.PI / 4]} />
          <meshStandardMaterial color={i % 2 ? "#FFFFFF" : "#F49AC1"} roughness={0.55} />
        </mesh>
      ))}
      <Cyl p={[0, -0.75, 0]} r={0.16} r2={0.12} h={0.2} color="#C99868" seg={12} />
    </group>
  );
}

export default function Town3D({ night, onAction }) {
  const act = id => { const s = TOWN_SPOTS.find(x => x.id === id); onAction?.(s.action, s); };
  const road = night ? "#A9A3C3" : "#CFC9DE";
  const tint = c => (night ? lighten(c, 0.85) : c);
  return (
    <group>
      {/* floating island: grass, soil and a blue base */}
      <Box x={-0.25} y={-1.25} z={-0.25} w={14.5} h={0.55} d={14.5} color="#A6D6EE" r={0.2} />
      <Box x={-0.15} y={-0.75} z={-0.15} w={14.3} h={0.45} d={14.3} color="#F3DFC6" r={0.18} />
      <Box x={0} y={-0.32} z={0} w={14} h={0.32} d={14} color={tint("#B4E3A4")} r={0.16} />

      {/* roads with dashed lines and zebra crossings */}
      <Box x={6.2} y={0} z={0} w={1.6} h={0.04} d={14} color={road} r={0.02} />
      <Box x={0} y={0} z={6.2} w={14} h={0.04} d={1.6} color={road} r={0.02} />
      {Array.from({ length: 7 }, (_, i) => i * 2 + 0.4).filter(v => v < 5.6 || v > 8).map(v => (
        <group key={v}>
          <Box x={6.95} y={0.04} z={v} w={0.1} h={0.01} d={0.7} color="#FFFFFF" r={0.005} shadow={false} />
          <Box x={v} y={0.04} z={6.95} w={0.7} h={0.01} d={0.1} color="#FFFFFF" r={0.005} shadow={false} />
        </group>
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <group key={`zc${i}`}>
          <Box x={6.35 + i * 0.28} y={0.04} z={8} w={0.16} h={0.01} d={0.5} color="#FFFFFF" r={0.005} shadow={false} />
          <Box x={8} y={0.04} z={6.35 + i * 0.28} w={0.5} h={0.01} d={0.16} color="#FFFFFF" r={0.005} shadow={false} />
        </group>
      ))}

      {/* stream, bridge and park with a pond */}
      <Box x={10.4} y={-0.06} z={7.8} w={1} h={0.08} d={6.2} color="#8FD0EE" r={0.04} rough={0.25} />
      <Box x={10.2} y={0.04} z={9.6} w={1.4} h={0.16} d={1} color="#F2D7C5" r={0.06} />
      <Box x={10.2} y={0.2} z={9.6} w={1.4} h={0.12} d={0.08} color="#FFFFFF" r={0.03} />
      <Box x={10.2} y={0.2} z={10.52} w={1.4} h={0.12} d={0.08} color="#FFFFFF" r={0.03} />
      <Box x={8.4} y={0} z={8.4} w={1.6} h={0.03} d={5} color={tint("#C5EDB5")} r={0.02} />
      <Cyl p={[9.2, 0.07, 10.6]} r={0.6} h={0.14} color="#FFFFFF" seg={32} />
      <Cyl p={[9.2, 0.1, 10.6]} r={0.5} h={0.12} color="#8FD0EE" seg={32} />
      <Cyl p={[9.2, 0.3, 10.6]} r={0.06} h={0.4} color="#FFFFFF" seg={12} />

      {/* Calendar Tower */}
      <group>
        <Box x={1.2} y={0} z={1.2} w={3} h={1.6} d={2.6} color="#C6B9EE" onClick={() => act("calendar")} />
        <Windows x={1.2} z={1.2} w={3} d={2.6} rows={[0.85]} night={night} />
        <Door x={1.2} z={1.2} w={3} d={2.6} color="#8E7CCB" />
        <Box x={2.05} y={1.6} z={1.85} w={1.3} h={2.3} d={1.3} color="#D3C8F3" onClick={() => act("calendar")} />
        <Cyl p={[2.7, 3.2, 3.17]} r={0.42} h={0.08} rot={[Math.PI / 2, 0, 0]} color="#FFF6EA" />
        <Box x={2.68} y={3.18} z={3.2} w={0.04} h={0.3} d={0.03} color="#7D6CBC" r={0.01} />
        <Box x={2.68} y={3.18} z={3.2} w={0.22} h={0.04} d={0.03} color="#7D6CBC" r={0.01} />
        <Cone p={[2.7, 4.45, 2.5]} r={1.05} h={1.1} seg={4} rot={[0, Math.PI / 4, 0]} color="#9C8BDA" />
        <Ball p={[2.7, 5.05, 2.5]} r={0.1} color="#F7C873" />
      </group>

      {/* Task Studio */}
      <group>
        <Box x={9} y={0} z={1.3} w={3} h={1.5} d={2.6} color="#CEEBD1" onClick={() => act("tasks")} />
        <Roof x={9} y={1.5} z={1.3} w={3} d={2.6} h={1} color="#8FC9A0" onClick={() => act("tasks")} />
        <Windows x={9} z={1.3} w={3} d={2.6} rows={[0.75]} night={night} />
        <Door x={9} z={1.3} w={3} d={2.6} color="#6FAE82" />
        <Awning x={9.3} z={3.85} w={2.4} y={1.25} colA="#FFFFFF" colB="#8FC9A0" />
        <Box x={10.2} y={2.75} z={2.45} w={0.6} h={0.5} d={0.1} color="#FFFFFF" r={0.06} />
        <Box x={10.35} y={2.9} z={2.56} w={0.1} h={0.18} d={0.04} color="#4FAE6E" r={0.02} rough={0.4} />
        <Box x={10.4} y={2.9} z={2.56} w={0.3} h={0.08} d={0.04} color="#4FAE6E" r={0.02} rough={0.4} />
      </group>

      {/* My Home */}
      <group>
        <Box x={1.4} y={0} z={9.2} w={2.8} h={1.35} d={2.6} color="#F7C7BA" onClick={() => act("home")} />
        <Roof x={1.4} y={1.35} z={9.2} w={2.8} d={2.6} h={1.05} color="#E8A0B8" onClick={() => act("home")} />
        <Box x={3.4} y={1.6} z={9.6} w={0.35} h={0.8} d={0.35} color="#E59A8E" r={0.05} />
        <Windows x={1.4} z={9.2} w={2.8} d={2.6} rows={[0.7]} night={night} />
        <Door x={1.4} z={9.2} w={2.8} d={2.6} color="#C87E90" />
        {Array.from({ length: 8 }, (_, i) => <Box key={i} x={1.3 + i * 0.4} y={0} z={12.3} w={0.1} h={0.34} d={0.1} color="#FFFFFF" r={0.03} />)}
        <Box x={1.3} y={0.2} z={12.31} w={3.0} h={0.06} d={0.08} color="#FFFFFF" r={0.02} />
        <Ball p={[2.8, 1.12, 11.86]} r={0.11} s={[1, 0.95, 0.5]} color="#F2779E" />
      </group>

      {/* Budget Shop */}
      <group>
        <Box x={12.2} y={0} z={9} w={1.5} h={1.25} d={3} color="#FCE3B0" onClick={() => act("budget")} />
        <Roof x={12.2} y={1.25} z={9} w={1.5} d={3} h={0.8} color="#F2B36F" onClick={() => act("budget")} />
        <Windows x={12.2} z={9} w={1.5} d={3} rows={[0.62]} night={night} cols={2} />
        <Door x={12.2} z={9} w={1.5} d={3} color="#D9964F" />
        <Cyl p={[12.95, 1.85, 12.05]} r={0.26} h={0.08} rot={[Math.PI / 2, 0, 0]} color="#F7C873" />
        <Cyl p={[12.95, 1.85, 12.1]} r={0.17} h={0.04} rot={[Math.PI / 2, 0, 0]} color="#F2B36F" />
      </group>

      {/* trees, lamps */}
      {[[5, 1, "#F2A6C4"], [5, 4.6, "#F2A6C4"], [12.6, 4.6, "#F7C1D3"], [4.8, 12.6, "#A9DDB1"], [1, 5, "#F2A6C4"], [9, 5, "#A9DDB1"], [13.2, 0.8, "#A9DDB1"], [0.7, 13.2, "#F2A6C4"]].map(([x, z, c], i) => (
        <Tree key={i} x={x} z={z} color={tint(c)} size={1.1} />
      ))}
      {[[8.8, 12.8], [9.6, 8.9], [0.6, 0.7], [13.3, 13.2]].map(([x, z], i) => <Tree key={`p${i}`} x={x} z={z} kind="pine" color={tint("#8CCB98")} size={1} />)}
      {[[5.9, 5.9], [8.1, 5.9], [5.9, 8.1], [8.1, 8.1]].map(([x, z], i) => <StreetLamp key={i} x={x} z={z} night={night} />)}

      {/* you walking the dogs */}
      <You3D position={[6.8, 0.04, 9.4]} scale={0.5} />
      <Dog3D who="westie" position={[7.35, 0.04, 9.9]} scale={0.42} />
      <Dog3D who="cream" position={[6.55, 0.04, 10.3]} scale={0.45} />
      <Dog3D who="bernie" position={[7.3, 0.04, 10.75]} scale={0.45} />
      <Dog3D who="grey" position={[6.7, 0.04, 11.2]} scale={0.45} />

      {/* sky */}
      <Cloud p={[1, 6.5, -1]} s={1.8} color={night ? "#E9D3EE" : "#FFFFFF"} />
      <Cloud p={[12.5, 7.2, 1]} s={1.6} color={night ? "#E9D3EE" : "#FFFFFF"} />
      <Cloud p={[-1.5, 4.5, 9]} s={1.5} color={night ? "#E9D3EE" : "#FFFFFF"} />
      <Balloon p={[9.5, 6.4, 4.5]} />
    </group>
  );
}
