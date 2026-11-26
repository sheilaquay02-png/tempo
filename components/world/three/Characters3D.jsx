// You (pink shark onesie, long dark hair with a centre part and brown ends)
// and the four dogs, as soft vinyl-toy figures: big heads, glossy eyes, blush.
// Each figure stands on y = 0 and faces +z. Built about 1.6 units tall.
import { Ball, Pill, Cone, Soft } from "./Toys";
import { CAST } from "../worldData";

// Point on the front of a sphere (centre c, radius r) at screen offset (dx, dy).
const onFace = (c, r, dx, dy, out = 0) => {
  const dz = Math.sqrt(Math.max(0, r * r - dx * dx - dy * dy));
  return [c[0] + dx, c[1] + dy, c[2] + dz + out];
};

function ToyEye({ p, s = 1, col = "#2A1C1A" }) {
  return (
    <group position={p} scale={s}>
      <Ball p={[0, 0, 0]} r={0.075} s={[0.85, 1.1, 0.45]} color={col} rough={0.18} />
      <Ball p={[0.022, 0.03, 0.03]} r={0.022} color="#FFFFFF" rough={0.2} glow="#FFFFFF" glowAmt={0.4} />
      <Ball p={[-0.02, -0.03, 0.03]} r={0.011} color="#FFFFFF" rough={0.2} />
    </group>
  );
}

function Smile({ p, w = 0.05, col = "#B65A6A" }) {
  return (
    <mesh position={p} rotation={[0, 0, Math.PI]}>
      <torusGeometry args={[w, 0.011, 8, 16, Math.PI]} />
      <Soft color={col} rough={0.4} />
    </mesh>
  );
}

export function You3D({ position = [0, 0, 0], rotY = 0, scale = 1, wave = true }) {
  const c = CAST.you;
  const head = [0, 1.08, 0];
  const faceC = [0, 1.0, 0.26];
  const faceR = 0.4;
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={scale}>
      {/* slippers + legs */}
      {[-0.13, 0.13].map(x => <Ball key={x} p={[x, 0.07, 0.04]} r={0.11} s={[1, 0.7, 1.35]} color={c.onesieDark} />)}
      {/* body: soft onesie with a pale belly */}
      <Pill p={[0, 0.38, 0]} r={0.28} len={0.18} color={c.onesie} s={[1, 1, 0.9]} />
      <Ball p={[0, 0.34, 0.12]} r={0.17} s={[1, 1.15, 0.6]} color={c.belly} />
      {/* arms: left down, right waving */}
      <Pill p={[-0.29, 0.42, 0.02]} r={0.075} len={0.16} rot={[0, 0, -0.45]} color={c.onesie} />
      <Ball p={[-0.35, 0.3, 0.04]} r={0.07} color={c.skin} />
      {wave
        ? <><Pill p={[0.3, 0.55, 0.02]} r={0.075} len={0.16} rot={[0, 0, -2.5]} color={c.onesie} /><Ball p={[0.37, 0.67, 0.04]} r={0.07} color={c.skin} /></>
        : <><Pill p={[0.29, 0.42, 0.02]} r={0.075} len={0.16} rot={[0, 0, 0.45]} color={c.onesie} /><Ball p={[0.35, 0.3, 0.04]} r={0.07} color={c.skin} /></>}
      {/* shark tail */}
      <Cone p={[0, 0.25, -0.3]} r={0.11} h={0.3} rot={[-1.9, 0, 0]} color={c.onesie} />
      <Ball p={[0, 0.2, -0.46]} r={0.08} s={[0.4, 1.3, 1]} color={c.onesieDark} />
      {/* hood */}
      <Ball p={head} r={0.55} color={c.onesie} seg={40} />
      <Ball p={[0, 1.13, -0.04]} r={0.53} s={[1, 1, 0.98]} color={c.onesie} seg={36} />
      {/* dorsal fin on top of the hood */}
      <mesh position={[0, 1.66, -0.08]} rotation={[0.25, 0, 0]} scale={[0.35, 1, 1]} castShadow>
        <coneGeometry args={[0.16, 0.34, 20]} />
        <Soft color={c.onesieDark} />
      </mesh>
      {/* sleepy shark eyes on the hood + little teeth around the face opening */}
      {[-0.3, 0.3].map(x => <Ball key={x} p={[x, 1.42, 0.34]} r={0.035} color="#3A2A2E" rough={0.2} />)}
      {Array.from({ length: 9 }, (_, i) => {
        const a = Math.PI * (0.18 + (i / 8) * 0.64);
        return <Cone key={i} p={[Math.cos(a) * 0.43, 1.0 + Math.sin(a) * 0.43, 0.38]} r={0.03} h={0.07} rot={[0.4, 0, a - Math.PI / 2 + Math.PI]} color="#FFFFFF" seg={8} />;
      })}
      {/* hair: dark cap, centre-parted fringe and long side hair with brown ends */}
      <Ball p={[0, 1.06, 0.2]} r={0.44} color={c.hair} seg={32} />
      {/* face */}
      <Ball p={faceC} r={faceR} color={c.skin} seg={40} />
      <Ball p={[-0.13, 1.3, 0.5]} r={0.17} s={[1.25, 0.6, 0.55]} color={c.hair} />
      <Ball p={[0.13, 1.3, 0.5]} r={0.17} s={[1.25, 0.6, 0.55]} color={c.hair} />
      {[-0.37, 0.37].map(x => (
        <group key={x}>
          <Pill p={[x, 0.78, 0.3]} r={0.1} len={0.5} color={c.hair} />
          <Pill p={[x, 0.46, 0.3]} r={0.1} len={0.12} color={c.hairEnds} />
        </group>
      ))}
      <ToyEye p={onFace(faceC, faceR, -0.14, 0.02, -0.01)} />
      <ToyEye p={onFace(faceC, faceR, 0.14, 0.02, -0.01)} />
      <Ball p={onFace(faceC, faceR, -0.23, -0.1, -0.02)} r={0.055} s={[1.3, 0.75, 0.4]} color="#F6A8BF" />
      <Ball p={onFace(faceC, faceR, 0.23, -0.1, -0.02)} r={0.055} s={[1.3, 0.75, 0.4]} color="#F6A8BF" />
      <Smile p={onFace(faceC, faceR, 0, -0.12, -0.005)} w={0.035} />
    </group>
  );
}

// Dogs: chunky toy pups (big head, wide muzzle, short legs).
const DOGS = {
  westie: { fur: "#FFFDF6", muzzle: "#FFFFFF", paws: "#F3EBDD", ear: "pointy", earIn: "#F7C1CE", fluffy: true, brow: null, eye: "#1E1A1A" },
  cream: { fur: "#F6E7D0", muzzle: "#FFF7EA", paws: "#FFF7EA", ear: "floppy", earCol: "#E9C79F", fluffy: true, scarf: "#2E7D4F", eye: "#2A1E1A" },
  bernie: { fur: "#2A2526", muzzle: "#FFFFFF", paws: "#FFFFFF", ear: "floppy", blaze: "#FFFFFF", chest: "#FFFFFF", scarf: "stripes", eye: "#3B2A22", brow: "#B07A4E" },
  grey: { fur: "#76706F", muzzle: "#B88A62", paws: "#E7E1DC", ear: "floppy", fluffy: true, brow: "#B88A62", chest: "#E7E1DC", scarf: "stripes", eye: "#1E1614" },
};

function Scarf({ kind }) {
  if (!kind) return null;
  const n = 14;
  return (
    <group position={[0, 0.62, 0.12]} rotation={[0.35, 0, 0]}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const col = kind === "stripes" ? (i % 2 ? "#FFFFFF" : "#D33B3B") : kind;
        return <Ball key={i} p={[Math.cos(a) * 0.24, 0, Math.sin(a) * 0.24]} r={0.075} color={col} seg={12} />;
      })}
      <Ball p={[0.12, -0.12, 0.24]} r={0.07} s={[1, 1.6, 0.7]} color={kind === "stripes" ? "#D33B3B" : kind} seg={12} />
    </group>
  );
}

export function Dog3D({ who, position = [0, 0, 0], rotY = 0, scale = 1 }) {
  const d = DOGS[who];
  const headC = [0, 0.78, 0.2];
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={scale}>
      {/* body + legs */}
      <Ball p={[0, 0.36, -0.06]} r={0.3} s={[1, 0.9, 1.15]} color={d.fur} />
      {d.chest && <Ball p={[0, 0.4, 0.16]} r={0.17} s={[1, 1.2, 0.6]} color={d.chest} />}
      {[[-0.15, 0.16], [0.15, 0.16], [-0.16, -0.24], [0.16, -0.24]].map(([x, z], i) => (
        <group key={i}>
          <Pill p={[x, 0.14, z]} r={0.085} len={0.1} color={d.fur} />
          <Ball p={[x, 0.06, z + 0.04]} r={0.09} s={[1, 0.7, 1.2]} color={d.paws} />
        </group>
      ))}
      <Pill p={[0, 0.5, -0.38]} r={0.05} len={0.14} rot={[-0.7, 0, 0]} color={d.fur} />
      <Scarf kind={d.scarf} />
      {/* head */}
      <Ball p={headC} r={0.3} s={[1.08, 1, 1]} color={d.fur} seg={32} />
      {d.fluffy && [[-0.2, 0.18], [0.2, 0.18], [0, 0.28], [-0.12, 0.25], [0.12, 0.25]].map(([x, y], i) => (
        <Ball key={i} p={[x, headC[1] + y * 0.6, headC[2] - 0.02]} r={0.14} color={d.fur} seg={14} />
      ))}
      {d.blaze && <Ball p={[0, headC[1] + 0.1, headC[2] + 0.22]} r={0.07} s={[0.8, 1.8, 0.5]} color={d.blaze} />}
      {/* wide toy muzzle */}
      <Ball p={[0, headC[1] - 0.1, headC[2] + 0.22]} r={0.16} s={[1.25, 0.8, 0.85]} color={d.muzzle} />
      <Ball p={[0, headC[1] - 0.04, headC[2] + 0.36]} r={0.055} s={[1.2, 0.85, 0.8]} color="#2A2224" rough={0.25} />
      <ToyEye p={[-0.12, headC[1] + 0.05, headC[2] + 0.26]} s={0.85} col={d.eye} />
      <ToyEye p={[0.12, headC[1] + 0.05, headC[2] + 0.26]} s={0.85} col={d.eye} />
      {d.brow && [-0.12, 0.12].map(x => <Ball key={x} p={[x, headC[1] + 0.14, headC[2] + 0.24]} r={0.045} s={[1.3, 0.6, 0.6]} color={d.brow} />)}
      {/* ears */}
      {d.ear === "pointy"
        ? [-1, 1].map(sx => (
          <group key={sx} position={[sx * 0.17, headC[1] + 0.36, headC[2] + 0.02]} rotation={[0, 0, -sx * 0.3]}>
            <Cone p={[0, 0, 0]} r={0.09} h={0.26} color={d.fur} />
            <Cone p={[0, -0.01, 0.03]} r={0.045} h={0.12} color={d.earIn} />
          </group>
        ))
        : [-1, 1].map(sx => (
          <Ball key={sx} p={[sx * 0.29, headC[1] - 0.02, headC[2] - 0.02]} r={0.13} s={[0.55, 1.25, 0.85]} color={d.earCol || d.fur} />
        ))}
    </group>
  );
}

// Close-up line-up of the whole family on a little round stage.
export const CAST_VIEW = { target: [0, 0.75, 0.3], spanW: 6.2, spanH: 4.2 };
export const CAST_SPOTS = [];
export function CastLineup() {
  return (
    <group>
      <mesh position={[0, -0.1, 0.3]} receiveShadow>
        <cylinderGeometry args={[2.6, 2.7, 0.2, 64]} />
        <meshStandardMaterial color="#FBE1E6" roughness={0.7} />
      </mesh>
      <You3D position={[0, 0, 0]} />
      <Dog3D who="westie" position={[-1.05, 0, 0.75]} rotY={0.35} />
      <Dog3D who="cream" position={[1.05, 0, 0.75]} rotY={-0.35} />
      <Dog3D who="bernie" position={[-1.7, 0, -0.35]} rotY={0.5} />
      <Dog3D who="grey" position={[1.7, 0, -0.35]} rotY={-0.5} />
    </group>
  );
}
