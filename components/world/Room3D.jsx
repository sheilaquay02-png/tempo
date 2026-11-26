// Real 3D version of the room (react-three-fiber). Same layout, themes and
// clickable spots as the 2.5D room. Renders only when something changes
// (frameloop="demand") and caps pixel density to save battery.
// Coordinates: x = along the back wall, z = towards you, y = up (2.5D y -> 3D z).
import { Component, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { Vector3 } from "three";
import { ROOM_THEMES, CAST } from "./worldData";
import { DEFAULT_LAYOUT, MOVABLE, ROOM_SPOTS } from "./Room25D";
import { shade } from "./isoKit";

export function hasWebGL() {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}

class GLBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail?.(); }
  render() { return this.state.failed ? null : this.props.children; }
}

const Mat = ({ color, rough = 0.85, emissive, emissiveIntensity }) => (
  <meshStandardMaterial color={color} roughness={rough} emissive={emissive} emissiveIntensity={emissiveIntensity} />
);

// A box positioned by its corner (x, z on the floor, y up), like the 2.5D kit.
function Block({ x, z, y = 0, w, d, h, color, radius = 0.06, onClick, name }) {
  const [hover, setHover] = useState(false);
  const r = Math.min(radius, w / 2.01, d / 2.01, h / 2.01);
  return (
    <RoundedBox args={[w, h, d]} radius={r} smoothness={3} position={[x + w / 2, y + h / 2, z + d / 2]} castShadow receiveShadow name={name}
      onClick={onClick ? e => { e.stopPropagation(); onClick(); } : undefined}
      onPointerOver={onClick ? e => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; } : undefined}
      onPointerOut={onClick ? () => { setHover(false); document.body.style.cursor = ""; } : undefined}>
      <Mat color={hover ? shade(color, 1.12) : color} />
    </RoundedBox>
  );
}

function Plant({ x, z, potH, r, color }) {
  return (
    <group>
      <Block x={x} z={z} w={potH} d={potH} h={potH} color="#E9D7C6" />
      <mesh position={[x + potH / 2, potH + 0.25, z + potH / 2]} castShadow><cylinderGeometry args={[0.05, 0.06, 0.5]} /><Mat color="#B98A63" /></mesh>
      <mesh position={[x + potH / 2, potH + 0.5 + r, z + potH / 2]} castShadow><sphereGeometry args={[r, 20, 16]} /><Mat color={color} /></mesh>
    </group>
  );
}

function You({ position }) {
  const c = CAST.you;
  return (
    <group position={position} scale={0.55}>
      <mesh position={[0, 0.75, 0]} castShadow><capsuleGeometry args={[0.42, 0.55, 8, 16]} /><Mat color={c.onesie} /></mesh>
      <mesh position={[0, 0.7, 0.3]}><sphereGeometry args={[0.3, 16, 12]} /><Mat color={c.belly} /></mesh>
      <mesh position={[0, 2.0, 0]} castShadow><sphereGeometry args={[0.72, 28, 20]} /><Mat color={c.onesie} /></mesh>
      <mesh position={[0, 2.75, -0.15]} rotation={[-0.35, 0, 0]} castShadow><coneGeometry args={[0.2, 0.45, 12]} /><Mat color={c.onesieDark} /></mesh>
      <mesh position={[0, 1.9, 0.32]}><sphereGeometry args={[0.52, 24, 18]} /><Mat color={c.hair} /></mesh>
      <mesh position={[0, 1.85, 0.5]}><sphereGeometry args={[0.4, 24, 18]} /><Mat color={c.skin} /></mesh>
      {[-0.42, 0.42].map(dx => (
        <group key={dx}>
          <mesh position={[dx, 1.45, 0.38]}><capsuleGeometry args={[0.12, 0.45, 6, 10]} /><Mat color={c.hair} /></mesh>
          <mesh position={[dx, 1.12, 0.38]}><sphereGeometry args={[0.12, 10, 8]} /><Mat color={c.hairEnds} /></mesh>
        </group>
      ))}
      {[-0.14, 0.14].map(dx => <mesh key={dx} position={[dx, 1.85, 0.88]}><sphereGeometry args={[0.065, 10, 8]} /><Mat color="#2A1C1A" rough={0.3} /></mesh>)}
      {[-0.25, 0.25].map(dx => <mesh key={`b${dx}`} position={[dx, 1.72, 0.82]}><sphereGeometry args={[0.06, 10, 8]} /><Mat color="#F6A8BF" /></mesh>)}
      {[-0.3, 0.3].map(dx => <mesh key={`t${dx}`} position={[dx * 1.3, 2.05, 0.6]} rotation={[0.2, 0, 0]}><coneGeometry args={[0.05, 0.12, 4]} /><Mat color="#FFFFFF" /></mesh>)}
      <mesh position={[0, 0.45, -0.55]} rotation={[-1.1, 0, 0]} castShadow><coneGeometry args={[0.2, 0.6, 10]} /><Mat color={c.onesieDark} /></mesh>
    </group>
  );
}

function Dog({ who, position, rotY = 0 }) {
  const c = CAST[who];
  const fur = c.fur;
  const patch = c.patch || c.blaze || c.furShade || fur;
  const scarf = c.scarf;
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={0.42}>
      <mesh position={[0, 0.5, 0]} scale={[1, 0.85, 1.2]} castShadow><sphereGeometry args={[0.5, 20, 16]} /><Mat color={fur} rough={1} /></mesh>
      <mesh position={[0, 1.15, 0.35]} castShadow><sphereGeometry args={[0.45, 22, 18]} /><Mat color={fur} rough={1} /></mesh>
      <mesh position={[0, 1.02, 0.72]} scale={[1, 0.75, 0.8]}><sphereGeometry args={[0.2, 14, 10]} /><Mat color={who === "westie" ? fur : patch} /></mesh>
      <mesh position={[0, 1.08, 0.86]}><sphereGeometry args={[0.07, 10, 8]} /><Mat color="#1E1A1A" rough={0.3} /></mesh>
      {[-0.16, 0.16].map(dx => <mesh key={dx} position={[dx, 1.25, 0.74]}><sphereGeometry args={[0.055, 10, 8]} /><Mat color="#1E1A1A" rough={0.3} /></mesh>)}
      {who === "westie"
        ? [-0.22, 0.22].map(dx => <mesh key={`e${dx}`} position={[dx, 1.6, 0.3]} rotation={[0, 0, -dx]}><coneGeometry args={[0.12, 0.32, 8]} /><Mat color={fur} /></mesh>)
        : [-0.42, 0.42].map(dx => <mesh key={`e${dx}`} position={[dx, 1.05, 0.3]} scale={[0.6, 1.1, 0.8]}><sphereGeometry args={[0.25, 14, 10]} /><Mat color={fur} rough={1} /></mesh>)}
      {who === "bernie" && <mesh position={[0, 1.35, 0.68]} scale={[0.35, 1, 0.4]}><sphereGeometry args={[0.2, 12, 10]} /><Mat color="#FFFFFF" /></mesh>}
      {who === "grey" && [-0.16, 0.16].map(dx => <mesh key={`p${dx}`} position={[dx, 1.36, 0.72]} scale={[1, 0.5, 0.5]}><sphereGeometry args={[0.07, 10, 8]} /><Mat color={c.patch} /></mesh>)}
      {scarf && <mesh position={[0, 0.82, 0.32]} rotation={[Math.PI / 2 - 0.3, 0, 0]}><torusGeometry args={[0.36, 0.08, 10, 24]} /><Mat color={scarf} /></mesh>}
      {[-0.22, 0.22].map(dx => <mesh key={`f${dx}`} position={[dx, 0.1, 0.4]}><sphereGeometry args={[0.15, 10, 8]} /><Mat color={who === "bernie" ? "#FFFFFF" : fur} /></mesh>)}
    </group>
  );
}

// Keep the whole room in view on any screen size, and work out where the
// clickable labels sit on screen (drawn as normal buttons over the canvas).
function FitCamera({ onLabels }) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    camera.zoom = Math.max(20, Math.min(size.width / 11.5, size.height / 9));
    camera.lookAt(3.2, 1.2, 3.2);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    invalidate();
    onLabels?.(ROOM_SPOTS.map(spot => {
      const [x, y, z] = spot.at;
      const v = new Vector3(x, z, y).project(camera);
      return { spot, left: ((v.x + 1) / 2) * size.width, top: ((1 - v.y) / 2) * size.height };
    }));
  }, [camera, size.width, size.height, invalidate, onLabels]);
  return null;
}

function RoomScene({ theme, night, layout, onAction }) {
  const t = ROOM_THEMES[theme] || ROOM_THEMES.kawaii;
  const L = { ...DEFAULT_LAYOUT, ...layout };
  const act = id => { const s = ROOM_SPOTS.find(x => x.id === id); if (s) onAction?.(s.action, s); };

  return (
    <>
      <color attach="background" args={[night ? "#3E3460" : "#F6EEF8"]} />
      <ambientLight intensity={night ? 0.45 : 0.75} color={night ? "#9C8FD6" : "#FFFFFF"} />
      <hemisphereLight args={[night ? "#7E6BC4" : "#FFF4F7", night ? "#2D2550" : "#F2D2B8", night ? 0.3 : 0.45]} />
      <directionalLight position={[9, 12, 7]} intensity={night ? 0.3 : 1.6} color={night ? "#B8A8F0" : "#FFF4E6"} castShadow
        shadow-mapSize={[1024, 1024]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
      {night && <pointLight position={[L.nightstand.x + 0.77, 1.6, L.nightstand.y + 0.14]} intensity={6} distance={6} color="#FFD98A" />}

      {/* floor and walls */}
      <Block x={0} z={0} y={-0.3} w={7} d={7} h={0.3} color={t.floor} radius={0.02} />
      <Block x={0} z={0} w={0.35} d={7} h={5} color={t.wallB} radius={0.02} />
      <Block x={0} z={0} w={7} d={0.35} h={5} color={t.wallA} radius={0.02} />
      {/* window */}
      <Block x={3.6} z={0.3} y={2} w={1.9} d={0.08} h={1.6} color={night ? "#33306A" : "#BEE3F3"} radius={0.03} onClick={() => act("window")} />
      {/* calendar */}
      <Block x={0.3} z={1.2} y={2.3} w={0.08} d={1.3} h={1.3} color="#FFFFFF" radius={0.02} onClick={() => act("calendar")} />
      <Block x={0.36} z={1.2} y={3.3} w={0.05} d={1.3} h={0.3} color="#D9467F" radius={0.01} />
      {/* door */}
      <Block x={0.3} z={4.9} w={0.1} d={1.2} h={2.6} color={shade(t.shelf, 0.85)} radius={0.03} onClick={() => act("door")} />
      {/* noticeboard */}
      <Block x={1.2} z={0.3} y={2.6} w={1.6} d={0.08} h={1} color="#E9CFA9" radius={0.03} onClick={() => act("board")} />
      <Block x={1.4} z={0.36} y={2.8} w={0.7} d={0.04} h={0.6} color="#FFF6B8" radius={0.01} />
      {/* string lights */}
      {t.lights && Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[0.5 + i * 0.47, 4.55 - Math.sin(i * 0.9) * 0.12, 0.42]}>
          <sphereGeometry args={[0.07, 10, 8]} /><Mat color="#FFE29A" emissive="#FFD27A" emissiveIntensity={night ? 1.6 : 0.3} />
        </mesh>
      ))}
      {/* rug */}
      <mesh position={[L.rug.x + 1.5, 0.01, L.rug.y + 1]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.6, 1, 1]} receiveShadow>
        <circleGeometry args={[1, 40]} /><Mat color={t.rug} rough={1} />
      </mesh>
      {/* bed */}
      <Block x={0.36} z={1} w={0.24} d={2.6} h={1.7} color={shade(t.shelf, 0.92)} />
      <Block x={0.6} z={1} w={2.1} d={2.6} h={0.5} color={shade(t.shelf, 0.98)} />
      <Block x={0.64} z={1.05} y={0.5} w={2} d={2.5} h={0.32} color={t.blanket} radius={0.12} />
      <Block x={1.45} z={1.02} y={0.56} w={1.27} d={2.56} h={0.3} color={t.bed} radius={0.12} />
      <Block x={0.74} z={1.2} y={0.82} w={0.6} d={1.05} h={0.24} color="#FFFFFF" radius={0.1} />
      <Block x={0.74} z={2.38} y={0.82} w={0.6} d={1.05} h={0.24} color="#FFFFFF" radius={0.1} />
      {/* bedside table + lamp */}
      <Block x={L.nightstand.x + 0.42} z={L.nightstand.y - 0.2} w={0.7} d={0.7} h={0.8} color={t.shelf} />
      <mesh position={[L.nightstand.x + 0.77, 1.35, L.nightstand.y + 0.14]}>
        <sphereGeometry args={[0.2, 16, 12]} /><Mat color={night ? "#FFE29A" : "#FFF1D6"} emissive="#FFD98A" emissiveIntensity={night ? 1.2 : 0} />
      </mesh>
      {/* desk (opens tasks) */}
      <Block x={4.2} z={0.5} w={2.4} d={1.2} h={1.35} color={t.desk} onClick={() => act("desk")} />
      {t.monitor
        ? <Block x={5.1} z={0.6} y={1.35} w={1.1} d={0.15} h={0.8} color="#3D3552" onClick={() => act("desk")} />
        : <Block x={5} z={0.8} y={1.35} w={0.9} d={0.6} h={0.08} color="#F4F0F6" onClick={() => act("desk")} />}
      {/* chair */}
      <Block x={L.chair.x} z={L.chair.y + 0.1} w={0.8} d={0.8} h={0.7} color={shade(t.accent, 1.05)} />
      <Block x={L.chair.x} z={L.chair.y + 0.7} y={0.7} w={0.8} d={0.15} h={0.8} color={shade(t.accent, 1.05)} />
      {/* bookshelf */}
      <Block x={2.9} z={0.45} w={1} d={0.8} h={2.6} color={t.shelf} />
      {Array.from({ length: 12 }, (_, k) => {
        const s = Math.floor(k / 4), b = k % 4, cols = ["#F2A6C4", "#C6B9EE", "#CEEBD1", "#F7C7BA"];
        return <Block key={k} x={3.1 + b * 0.19} z={1.1} y={0.4 + s * 0.75} w={0.14} d={0.18} h={0.5} color={cols[(b + s) % 4]} radius={0.02} />;
      })}
      {/* plants */}
      <Plant x={L.plantA.x + 0.2} z={L.plantA.y + 0.3} potH={0.5} r={0.38} color={t.plant} />
      <Plant x={L.plantB.x + 0.1} z={L.plantB.y + 0.2} potH={0.4} r={0.3} color={t.plant} />
      {/* you + the dogs */}
      <You position={[4.5, 0, 3.35]} />
      <Dog who="westie" position={[3.5, 0, 4.7]} />
      <Dog who="cream" position={[2.3, 0, 5.4]} rotY={0.3} />
      <Dog who="bernie" position={[4.9, 0, 5.7]} rotY={-0.3} />
      <Dog who="grey" position={[1.9, 0, 4.6]} rotY={0.5} />
    </>
  );
}

export default function Room3D({ theme = "kawaii", night = false, layout, onAction, onFallback }) {
  const [ok] = useState(() => hasWebGL());
  const [labels, setLabels] = useState([]);
  if (!ok) {
    return <div className="wl-fallback">This device can&apos;t show the 3D room, so here is the 2.5D one instead.{onFallback && <button type="button" className="wl-btn" onClick={onFallback}>Show 2.5D room</button>}</div>;
  }
  return (
    <GLBoundary onFail={onFallback}>
      <div className="wl-3d-wrap">
      <Canvas className="wl-canvas" frameloop="demand" dpr={[1, 1.75]} shadows flat
        orthographic camera={{ position: [13, 11, 13], zoom: 58, near: 0.1, far: 100 }}
        onCreated={({ camera }) => { camera.lookAt(3.2, 1.2, 3.2); camera.updateProjectionMatrix(); }}
        gl={{ antialias: true, powerPreference: "low-power" }}
        aria-label={`Your room in 3D, ${night ? "night" : "day"}`}>
        <FitCamera onLabels={setLabels} />
        <RoomScene theme={theme} night={night} layout={layout} onAction={onAction} />
      </Canvas>
      {labels.map(({ spot, left, top }) => (
        <button key={spot.id} type="button" className="wl-pill wl-pill-abs" style={{ left, top }} onClick={() => onAction?.(spot.action, spot)}>{spot.label}</button>
      ))}
      </div>
    </GLBoundary>
  );
}
