// 2.5D drawings of the owner (pink shark onesie) and her four dogs.
// Each sprite draws in its own box: you 200x230 (feet at y=206), dogs 170x190
// (feet at y=184). Place them with <Sprite> so the feet land on a floor point.
import { CAST } from "./worldData";

const Eyes = ({ x1, x2, y, r, col, hl = "#FFFFFF" }) => (
  <>
    {[x1, x2].map(x => (
      <g key={x}>
        <circle cx={x} cy={y} r={r} fill={col} />
        <circle cx={x + r * 0.35} cy={y - r * 0.4} r={r * 0.35} fill={hl} />
      </g>
    ))}
  </>
);

const fluffCircles = (cx, cy, R, n, r, col) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return <circle key={i} cx={cx + Math.cos(a) * R} cy={cy + Math.sin(a) * R} r={r} fill={col} />;
  });

function StripedScarf({ cx, y, w }) {
  const n = Math.round(w / 8);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => <rect key={i} x={cx - w / 2 + i * 8} y={y} width={8} height={13} fill={i % 2 ? "#FFFFFF" : "#D33B3B"} />)}
      <rect x={cx - w / 2} y={y} width={w} height={13} rx={6} fill="none" stroke="#B82F2F" strokeWidth={1.2} />
      {[0, 1, 2, 3].map(i => <rect key={`t${i}`} x={cx + w * 0.18} y={y + 11 + i * 7} width={12} height={7} fill={i % 2 ? "#FFFFFF" : "#D33B3B"} />)}
      <circle cx={cx + w * 0.18 + 6} cy={y + 44} r={7} fill="#D33B3B" />
    </g>
  );
}

function DogBase({ body, paws }) {
  return (
    <>
      <ellipse cx={85} cy={182} rx={44} ry={7} fill="#000" opacity={0.08} />
      <ellipse cx={85} cy={142} rx={40} ry={38} fill={body} />
      <ellipse cx={68} cy={176} rx={13} ry={9} fill={paws || body} />
      <ellipse cx={102} cy={176} rx={13} ry={9} fill={paws || body} />
    </>
  );
}

export function YouSprite({ wave = false }) {
  const c = CAST.you;
  return (
    <g>
      <ellipse cx={100} cy={212} rx={52} ry={8} fill="#000" opacity={0.08} />
      <path d="M136 176 q32 -4 40 -32 q-16 10 -24 6 q8 -12 6 -26 q-12 20 -26 32 z" fill={c.onesieDark} />
      <rect x={58} y={118} width={84} height={84} rx={36} fill={c.onesie} />
      <ellipse cx={100} cy={166} rx={27} ry={30} fill={c.belly} />
      <ellipse cx={80} cy={204} rx={16} ry={8} fill={c.onesieDark} />
      <ellipse cx={120} cy={204} rx={16} ry={8} fill={c.onesieDark} />
      <ellipse cx={60} cy={156} rx={11} ry={19} fill={c.onesie} transform="rotate(18 60 156)" />
      <g transform={wave ? "rotate(-14 142 140)" : undefined}>
        <ellipse cx={142} cy={130} rx={10} ry={18} fill={c.onesie} transform="rotate(-28 142 130)" />
        <circle cx={151} cy={113} r={8} fill={c.skin} />
        <rect x={146} y={92} width={5} height={17} rx={2.5} fill={c.skin} transform="rotate(-12 148 100)" />
        <rect x={153} y={93} width={5} height={16} rx={2.5} fill={c.skin} transform="rotate(14 155 101)" />
      </g>
      <circle cx={100} cy={80} r={60} fill={c.onesie} />
      <path d="M92 24 q12 -32 34 -22 q-12 8 -8 26 z" fill={c.onesieDark} />
      <Eyes x1={70} x2={130} y={44} r={4.5} col="#2B1E1E" />
      <circle cx={100} cy={88} r={45} fill={c.hair} />
      {Array.from({ length: 11 }, (_, i) => {
        const a = Math.PI * (1.08 + i * 0.084);
        const a2 = a + 0.06, a3 = a - 0.06;
        return <polygon key={i} points={`${100 + Math.cos(a3) * 45},${88 + Math.sin(a3) * 45} ${100 + Math.cos(a2) * 45},${88 + Math.sin(a2) * 45} ${100 + Math.cos(a) * 36},${88 + Math.sin(a) * 36}`} fill="#FFFFFF" />;
      })}
      <path d="M60 92 q-6 34 4 58 l14 0 q-6 -26 -2 -56 z" fill={c.hair} />
      <path d="M62 128 q0 12 2 22 l14 0 q-3 -10 -3 -22 z" fill={c.hairEnds} />
      <path d="M140 92 q6 34 -4 58 l-14 0 q6 -26 2 -56 z" fill={c.hair} />
      <path d="M138 128 q0 12 -2 22 l-14 0 q3 -10 3 -22 z" fill={c.hairEnds} />
      <ellipse cx={100} cy={100} rx={31} ry={31} fill={c.skin} />
      <path d="M100 66 q-28 2 -33 40 q8 -26 33 -32 z" fill={c.hair} />
      <path d="M100 66 q28 2 33 40 q-8 -26 -33 -32 z" fill={c.hair} />
      <Eyes x1={88} x2={112} y={102} r={6.2} col="#2A1C1A" />
      <ellipse cx={80} cy={113} rx={6} ry={3.6} fill="#F6A8BF" opacity={0.75} />
      <ellipse cx={120} cy={113} rx={6} ry={3.6} fill="#F6A8BF" opacity={0.75} />
      <path d="M95 117 q5 4 10 0" stroke="#C26E7C" strokeWidth={2.4} fill="none" strokeLinecap="round" />
    </g>
  );
}

export function WestieSprite() {
  const c = CAST.westie;
  return (
    <g>
      <DogBase body={c.fur} paws={c.furShade} />
      <polygon points="52,58 50,10 80,44" fill={c.fur} /><polygon points="58,50 56,22 74,42" fill="#F7B6C6" />
      <polygon points="118,58 120,10 90,44" fill={c.fur} /><polygon points="112,50 114,22 96,42" fill="#F7B6C6" />
      {fluffCircles(85, 84, 40, 14, 10, c.fur)}
      <circle cx={85} cy={84} r={42} fill={c.fur} />
      <Eyes x1={70} x2={100} y={82} r={5} col="#1E1A1A" />
      <ellipse cx={85} cy={98} rx={8} ry={6} fill="#1E1A1A" />
      <path d="M73 106 q12 14 24 0 z" fill="#3A1F24" /><ellipse cx={85} cy={111} rx={6} ry={5} fill="#F28DA6" />
    </g>
  );
}

export function CreamSprite() {
  const c = CAST.cream;
  return (
    <g>
      <DogBase body={c.fur} />
      <circle cx={44} cy={98} r={24} fill={c.fur} /><circle cx={126} cy={98} r={24} fill={c.fur} />
      {fluffCircles(44, 98, 20, 8, 8, c.fur)}{fluffCircles(126, 98, 20, 8, 8, c.fur)}
      {fluffCircles(85, 80, 38, 16, 12, c.fur)}
      <circle cx={85} cy={82} r={40} fill={c.fur} />
      <ellipse cx={70} cy={86} rx={10} ry={8} fill={c.patch} opacity={0.7} />
      <ellipse cx={100} cy={86} rx={10} ry={8} fill={c.patch} opacity={0.7} />
      <Eyes x1={70} x2={100} y={84} r={4.6} col="#2A1E1A" />
      <ellipse cx={85} cy={101} rx={7.5} ry={5.5} fill="#1E1A1A" />
      <path d="M78 110 q7 5 14 0" stroke="#3A2A26" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <rect x={52} y={118} width={66} height={13} rx={6} fill={c.scarf} /><rect x={92} y={126} width={13} height={26} rx={5} fill={c.scarf} />
      <circle cx={98} cy={136} r={7} fill="#9C6B45" /><circle cx={98} cy={138} r={4} fill="#FFFFFF" />
    </g>
  );
}

export function BernieSprite() {
  const c = CAST.bernie;
  return (
    <g>
      <DogBase body={c.fur} paws={c.blaze} />
      <ellipse cx={85} cy={148} rx={15} ry={22} fill={c.blaze} />
      <ellipse cx={46} cy={100} rx={16} ry={26} fill={c.fur} transform="rotate(12 46 100)" />
      <ellipse cx={124} cy={100} rx={16} ry={26} fill={c.fur} transform="rotate(-12 124 100)" />
      <circle cx={85} cy={82} r={40} fill={c.fur} />
      <path d="M85 42 q-5 22 -8 40 q-10 14 8 26 q18 -12 8 -26 q-3 -18 -8 -40 z" fill={c.blaze} />
      <ellipse cx={85} cy={103} rx={17} ry={12} fill={c.blaze} />
      <Eyes x1={68} x2={102} y={82} r={5} col="#3B2A22" />
      <ellipse cx={85} cy={99} rx={7.5} ry={5.5} fill="#1E1A1A" />
      <path d="M79 108 q6 4 12 0" stroke="#3A2A26" strokeWidth={2} fill="none" strokeLinecap="round" />
      <StripedScarf cx={85} y={118} w={72} />
    </g>
  );
}

export function GreySprite() {
  const c = CAST.grey;
  return (
    <g>
      <DogBase body={c.fur} />
      <circle cx={44} cy={100} r={22} fill={c.fur} /><circle cx={126} cy={100} r={22} fill={c.fur} />
      {fluffCircles(44, 100, 18, 8, 8, c.fur)}{fluffCircles(126, 100, 18, 8, 8, c.fur)}
      {fluffCircles(85, 80, 38, 16, 12, c.fur)}
      <circle cx={85} cy={82} r={40} fill={c.fur} />
      <ellipse cx={69} cy={74} rx={8} ry={4} fill={c.patch} /><ellipse cx={101} cy={74} rx={8} ry={4} fill={c.patch} />
      <ellipse cx={85} cy={102} rx={18} ry={13} fill={c.patch} opacity={0.9} />
      <Eyes x1={69} x2={101} y={84} r={5} col="#1E1614" />
      <ellipse cx={85} cy={97} rx={7.5} ry={5.5} fill="#1E1A1A" />
      <path d="M76 106 q9 12 18 0 z" fill="#3A1F24" /><ellipse cx={85} cy={110} rx={5} ry={4} fill="#F28DA6" />
      <ellipse cx={85} cy={150} rx={9} ry={12} fill="#E9E4E2" />
      <StripedScarf cx={85} y={120} w={70} />
    </g>
  );
}

const SPRITES = {
  you: { C: YouSprite, w: 200, feet: 206 },
  westie: { C: WestieSprite, w: 170, feet: 184 },
  cream: { C: CreamSprite, w: 170, feet: 184 },
  bernie: { C: BernieSprite, w: 170, feet: 184 },
  grey: { C: GreySprite, w: 170, feet: 184 },
};

// Place a sprite so its feet stand on screen point (x, y) at the given scale.
export function Sprite({ who, x, y, scale, ...rest }) {
  const s = SPRITES[who];
  const Comp = s.C;
  return (
    <g transform={`translate(${(x - (s.w / 2) * scale).toFixed(1)},${(y - s.feet * scale).toFixed(1)}) scale(${scale})`}>
      <Comp {...rest} />
    </g>
  );
}
