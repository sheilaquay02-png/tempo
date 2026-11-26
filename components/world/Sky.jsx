// Sky backdrop shared by the 2.5D town and room: gradient, sun or moon + stars, clouds.
import { useId } from "react";

export function Cloud({ x, y, s, col }) {
  return (
    <g>
      {[[0, 0, 1], [0.9, -0.25, 0.8], [1.7, 0.05, 0.9], [0.85, 0.25, 0.95]].map(([dx, dy, r], i) => (
        <circle key={i} cx={x + dx * 28 * s} cy={y + dy * 28 * s} r={24 * s * r} fill={col} />
      ))}
    </g>
  );
}

export function Sky({ top, bottom, night, showSun = true, width = 800, height = 600 }) {
  const id = useId().replace(/:/g, "");
  return (
    <g>
      <defs>
        <linearGradient id={`sky${id}`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0%" stopColor={top} />
          <stop offset="100%" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={width} height={height} fill={`url(#sky${id})`} />
      {night ? (
        <g>
          {Array.from({ length: 28 }, (_, i) => (
            <circle key={i} className="wl-twinkle" cx={(i * 137) % width} cy={((i * 59) % 210) + 10} r={i % 3 ? 1.4 : 2.2} fill="#FFF7D6" style={{ animationDelay: `${(i % 7) * 0.4}s` }} />
          ))}
          {showSun && <><circle cx={690} cy={70} r={26} fill="#FFF1C2" /><circle cx={702} cy={62} r={24} fill={top} /></>}
        </g>
      ) : (
        showSun && <circle cx={690} cy={80} r={30} fill="#FFF3C4" opacity={0.95} />
      )}
    </g>
  );
}
