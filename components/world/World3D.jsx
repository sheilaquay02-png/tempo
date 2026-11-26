// The 3D world: one canvas that shows either the town or your room.
// Renders only when something changes (frameloop="demand"), caps pixel density,
// and falls back to the light 2.5D version when the device has no WebGL.
import { Component, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer } from "@react-three/drei";
import { Vector3 } from "three";
import Town3D, { TOWN_SPOTS, TOWN_VIEW } from "./three/Town3D";
import Room3DScene, { ROOM_3D_SPOTS, ROOM_VIEW } from "./three/Room3DScene";
import { CastLineup, CAST_SPOTS, CAST_VIEW } from "./three/Characters3D";

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

const DIR = new Vector3(1, 0.86, 1).normalize();

// Frame the scene for the screen size; reset when switching town <-> room.
function FitView({ view, controls }) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const [tx, ty, tz] = view.target;
    camera.position.set(tx + DIR.x * 40, ty + DIR.y * 40, tz + DIR.z * 40);
    camera.zoom = Math.max(14, Math.min(size.width, size.height * 1.15) / view.span);
    camera.lookAt(tx, ty, tz);
    camera.updateProjectionMatrix();
    const c = controls.current;
    if (c) {
      c.target.set(tx, ty, tz);
      c.minZoom = camera.zoom * 0.8;
      c.maxZoom = camera.zoom * 2.4;
      c.update();
    }
    invalidate();
  }, [view, camera, size.width, size.height, controls, invalidate]);
  return null;
}

// Keep the HTML labels pinned to their 3D spots whenever a frame is drawn.
function LabelTracker({ spots, refs }) {
  const v = useRef(new Vector3());
  useFrame(({ camera, size }) => {
    spots.forEach((s, i) => {
      const el = refs.current[i];
      if (!el) return;
      v.current.set(...s.pos).project(camera);
      el.style.left = `${((v.current.x + 1) / 2) * size.width}px`;
      el.style.top = `${((1 - v.current.y) / 2) * size.height}px`;
      el.style.visibility = "visible";
    });
  });
  return null;
}

function Lights({ night }) {
  return (
    <>
      <ambientLight intensity={night ? 0.28 : 0.35} color={night ? "#9C8FD6" : "#FFE9E0"} />
      <hemisphereLight args={[night ? "#7E6BC4" : "#FFF1F6", night ? "#2D2550" : "#E9D3C0", night ? 0.4 : 0.55]} />
      <directionalLight position={[14, 22, 10]} intensity={night ? 0.35 : 1.9} color={night ? "#B8A8F0" : "#FFE6C7"} castShadow
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02}
        shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-camera-near={1} shadow-camera-far={60} />
      <Environment resolution={128} frames={1} environmentIntensity={night ? 0.2 : 0.35}>
        <Lightformer form="rect" intensity={2} position={[0, 6, 6]} scale={[12, 6, 1]} color="#FFFFFF" />
        <Lightformer form="rect" intensity={1.2} position={[-6, 3, 0]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} color={night ? "#B9A8F0" : "#FFE4EE"} />
        <Lightformer form="ring" intensity={1} position={[6, 5, -4]} scale={3} color={night ? "#FFD9A0" : "#DDF0FF"} />
      </Environment>
    </>
  );
}

export default function World3D({ scene = "room", theme = "kawaii", night = false, layout, onAction, onFallback, decorate, selected, onSelect, onPlace }) {
  const [ok] = useState(() => hasWebGL());
  const controls = useRef(null);
  const labelRefs = useRef([]);
  const isTown = scene === "town";
  const isCast = scene === "cast";
  const spots = isTown ? TOWN_SPOTS : isCast ? CAST_SPOTS : ROOM_3D_SPOTS;
  const view = isTown ? TOWN_VIEW : isCast ? CAST_VIEW : ROOM_VIEW;

  if (!ok) {
    return <div className="wl-fallback">This device can&apos;t show 3D, so here is the light version instead.{onFallback && <button type="button" className="wl-btn" onClick={onFallback}>Show light version</button>}</div>;
  }
  return (
    <GLBoundary onFail={onFallback}>
      <div className={`wl-3d-wrap ${isTown ? "town" : "room"}${night ? " night" : ""}`}>
        <Canvas className="wl-canvas" frameloop="demand" dpr={[1, 1.75]} shadows
          orthographic camera={{ position: [30, 28, 30], zoom: 50, near: -100, far: 200 }}
          gl={{ antialias: true, powerPreference: "low-power", alpha: true }}
          aria-label={isTown ? "Tempo Town in 3D" : "Your room in 3D"}>
          <Lights night={night} />
          {isCast && <CastLineup />}
          {isTown && <Town3D night={night} onAction={onAction} />}
          {scene === "room" && <Room3DScene theme={theme} night={night} layout={layout} onAction={onAction} decorate={decorate} selected={selected} onSelect={onSelect} onPlace={onPlace} />}
          <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping={false}
            minPolarAngle={0.55} maxPolarAngle={1.2} minAzimuthAngle={Math.PI / 4 - 0.75} maxAzimuthAngle={Math.PI / 4 + 0.75} />
          <FitView view={view} controls={controls} />
          <LabelTracker spots={spots} refs={labelRefs} />
        </Canvas>
        {!decorate && spots.map((s, i) => (
          <button key={`${scene}-${s.id}`} ref={el => { labelRefs.current[i] = el; }} type="button" className="wl-pill wl-pill-abs"
            style={{ visibility: "hidden" }} onClick={() => onAction?.(s.action, s)}>{s.label}</button>
        ))}
      </div>
    </GLBoundary>
  );
}
