"use client";
// Loads the world prototype only in the browser and only on /world-lab.
import dynamic from "next/dynamic";

const WorldLab = dynamic(() => import("./WorldLab"), {
  ssr: false,
  loading: () => <div style={{ padding: 40, textAlign: "center", fontFamily: "system-ui" }}>Opening Tempo Town…</div>,
});

export default function WorldLabLoader() {
  return <WorldLab />;
}
