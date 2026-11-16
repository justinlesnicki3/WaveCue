import React, { useMemo } from 'react';
import Svg, {
  Path,
  G,
  Circle,
  Ellipse,
  Rect,
  Line,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  ClipPath,
} from 'react-native-svg';
import { seededRandom } from './seededRandom';

// A small desert island at night, drawn in a more realistic, sketched style: a low sand mound
// with little dunes, craters and speckled texture, one tall leaning palm with feathery fronds,
// and a treasure chest overflowing with vinyl records. Drawn in a 400 x 340 grid and scaled to
// `width`. The bottom of the sand sits at the bottom of the drawing so the waves can cover it.
// The open sand to the right of the trunk is left free for a character (and his smoke) later.
export const ISLAND_VIEW_W = 400;
export const ISLAND_VIEW_H = 340;

// grid points where future additions go (e.g. the character sitting by the palm)
export const ISLAND_SPOTS = { seat: { x: 270, y: 280 } };

const INK = '#2a1d12';
const SAND_LIGHT = '#dcc092';
const SAND_DARK = '#9c7a52';
const TRUNK_LIGHT = '#9a7148';
const TRUNK_DARK = '#5b3f24';
const LEAF_COLORS = ['#3f7a40', '#55924f', '#6aa35d', '#4a8646'];
const RIM = '#8f9cc0'; // soft moonlight edge so shapes read against the black sky

// Small mound rising gently toward the palm, with a few little dunes along the top
const SAND_PATH =
  'M30,334 C44,316 66,304 92,297 C110,292 124,292 140,286 C156,279 172,276 188,272 ' +
  'C202,266 218,264 234,268 C250,270 262,276 278,278 C296,281 312,290 328,298 ' +
  'C348,306 364,318 374,334 L374,340 L30,340 Z';

// Point on a cubic curve
function cubic(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

// ---------- palm ----------
const TRUNK = { base: [214, 276], c1: [204, 222], c2: [196, 150], top: [246, 104] };
const CROWN = [246, 102];

function buildTrunk() {
  const { base, c1, c2, top } = TRUNK;
  const left = [];
  const right = [];
  const rings = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = cubic(base, c1, c2, top, t);
    const q = cubic(base, c1, c2, top, Math.min(1, t + 0.01));
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const half = 8 - 4.5 * t; // tapers toward the crown
    left.push([p[0] + nx * half, p[1] + ny * half]);
    right.push([p[0] - nx * half, p[1] - ny * half]);
    // fine growth rings across the trunk
    if (i % 2 === 0 && i > 0 && i < steps) {
      rings.push(
        `M${p[0] + nx * half},${p[1] + ny * half} Q${p[0] + dx * 0.8},${p[1] + dy * 0.8 + 1.5} ${p[0] - nx * half},${p[1] - ny * half}`
      );
    }
  }
  const outline =
    `M${left.map((p) => p.join(',')).join(' L')} ` +
    `L${right.reverse().map((p) => p.join(',')).join(' L')} Z`;
  return { outline, rings };
}

// One feathery frond: a curved stem with many thin leaflets hanging off both sides
function buildFrond(angleDeg, length, droop, rand) {
  const [cx, cy] = CROWN;
  const a = (angleDeg * Math.PI) / 180;
  const tip = [cx + Math.cos(a) * length, cy + Math.sin(a) * length + droop];
  // stem arches upward before drooping
  const ctrl = [cx + Math.cos(a) * length * 0.5, cy + Math.sin(a) * length * 0.5 - length * 0.22];
  const at = (t) => [
    (1 - t) * (1 - t) * cx + 2 * (1 - t) * t * ctrl[0] + t * t * tip[0],
    (1 - t) * (1 - t) * cy + 2 * (1 - t) * t * ctrl[1] + t * t * tip[1],
  ];

  const leaflets = [];
  const count = 18;
  for (let i = 2; i < count; i++) {
    const t = i / count;
    const p = at(t);
    const q = at(Math.min(1, t + 0.02));
    let dx = q[0] - p[0];
    let dy = q[1] - p[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const size = (8 + 20 * Math.sin(Math.PI * t)) * (1 - 0.25 * t);
    for (const side of [-1, 1]) {
      // angle the leaflet forward along the stem, then let gravity pull it down
      const ang = side * 1.0;
      let lx = dx * Math.cos(ang) - dy * Math.sin(ang);
      let ly = dx * Math.sin(ang) + dy * Math.cos(ang) + 0.75;
      const l = Math.hypot(lx, ly) || 1;
      lx /= l;
      ly /= l;
      const s = size * (0.85 + rand() * 0.3);
      const end = [p[0] + lx * s, p[1] + ly * s];
      const mid = [p[0] + lx * s * 0.5 + dx * 2, p[1] + ly * s * 0.5 + dy * 2 - 1.5];
      leaflets.push({
        d: `M${p[0]},${p[1]} Q${mid[0]},${mid[1]} ${end[0]},${end[1]}`,
        color: LEAF_COLORS[Math.floor(rand() * LEAF_COLORS.length)],
      });
    }
  }
  return {
    stem: `M${cx},${cy} Q${ctrl[0]},${ctrl[1]} ${tip[0]},${tip[1]}`,
    leaflets,
  };
}

const FRONDS = [
  // [angle (0 = right, -90 = up), length, droop]
  [-172, 118, 64],
  [-150, 112, 46],
  [-124, 96, 26],
  [-98, 86, 18],
  [-70, 92, 22],
  [-42, 110, 38],
  [-14, 120, 58],
  [10, 106, 72],
  [168, 96, 80],
];

// ---------- sand detail ----------
function buildSandDetail(rand) {
  // speckles (clipped to the sand)
  const specks = Array.from({ length: 260 }, () => ({
    x: 12 + rand() * 378,
    y: 270 + rand() * 70,
    r: 0.6 + rand() * 1.1,
    dark: rand() < 0.65,
  }));
  // little craters / pits
  const pits = Array.from({ length: 9 }, () => ({
    x: 40 + rand() * 320,
    y: 300 + rand() * 30,
    rx: 4 + rand() * 6,
  }));
  // sketchy dune contour strokes
  const dunes = Array.from({ length: 14 }, () => {
    const x = 30 + rand() * 330;
    const y = 296 + rand() * 34;
    const w = 14 + rand() * 26;
    return `M${x},${y} Q${x + w / 2},${y - 3 - rand() * 3} ${x + w},${y}`;
  });
  return { specks, pits, dunes };
}

// ---------- treasure chest full of records ----------
function Record({ x, y, rx, ry, label }) {
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#111" stroke="#000" strokeWidth={1} />
      <Ellipse cx={x} cy={y} rx={rx * 0.72} ry={ry * 0.72} fill="none" stroke="#2c2c2c" strokeWidth={0.8} />
      <Ellipse cx={x} cy={y} rx={rx * 0.35} ry={ry * 0.35} fill={label} />
      <Ellipse cx={x} cy={y} rx={rx * 0.07} ry={ry * 0.07} fill="#000" />
    </G>
  );
}

function TreasureChest() {
  // box: x 84..140, y 288..318 ; lid opened back
  return (
    <G>
      {/* shadow on the sand */}
      <Ellipse cx={114} cy={320} rx={40} ry={5} fill="#000" opacity={0.25} />

      {/* open lid, tipped back */}
      <Path d="M86,290 L140,290 L146,262 C132,254 100,254 90,262 Z" fill="#5e3a1c" stroke={INK} strokeWidth={1.6} />
      <Path d="M88,272 L144,272" stroke="#3e2410" strokeWidth={1} />
      <Path d="M100,258 L96,290 M128,258 L132,290" stroke="#c9a54a" strokeWidth={2.4} />

      {/* records stacked up out of the chest */}
      <Record x={98} y={284} rx={12} ry={12} label="#d8443a" />
      <Record x={116} y={279} rx={13} ry={13} label="#e9c23f" />
      <Record x={133} y={285} rx={11} ry={11} label="#3fb6d8" />

      {/* chest box */}
      <Rect x={84} y={288} width={56} height={30} rx={2} fill="#7a4a24" stroke={INK} strokeWidth={1.6} />
      <Path d="M84,298 L140,298 M84,308 L140,308" stroke="#5a3418" strokeWidth={1} />
      <Rect x={96} y={288} width={5} height={30} fill="#c9a54a" stroke={INK} strokeWidth={0.8} />
      <Rect x={123} y={288} width={5} height={30} fill="#c9a54a" stroke={INK} strokeWidth={0.8} />
      <Rect x={108} y={296} width={8} height={9} rx={1.5} fill="#e2c15d" stroke={INK} strokeWidth={0.8} />

      {/* records spilling over the front edge and onto the sand */}
      <Record x={90} y={291} rx={9} ry={4} label="#7b56d6" />
      <Record x={150} y={308} rx={11} ry={11} label="#e9c23f" />
      <Record x={66} y={318} rx={12} ry={4.5} label="#d8443a" />
      <Record x={160} y={322} rx={9} ry={3.5} label="#3fb6d8" />

      {/* a few gold glints */}
      <Circle cx={104} cy={287} r={1.6} fill="#ffe27a" />
      <Circle cx={128} cy={289} r={1.3} fill="#ffe27a" />
      <Circle cx={141} cy={296} r={1.4} fill="#ffe27a" />
    </G>
  );
}

function Island({ width }) {
  const height = (width / ISLAND_VIEW_W) * ISLAND_VIEW_H;

  const art = useMemo(() => {
    const rand = seededRandom(1977);
    return {
      trunk: buildTrunk(),
      fronds: FRONDS.map(([a, l, d]) => buildFrond(a, l, d, rand)),
      sand: buildSandDetail(rand),
    };
  }, []);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${ISLAND_VIEW_W} ${ISLAND_VIEW_H}`}>
      <Defs>
        <LinearGradient id="sandShade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={SAND_LIGHT} />
          <Stop offset="1" stopColor={SAND_DARK} />
        </LinearGradient>
        <LinearGradient id="trunkShade" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={TRUNK_LIGHT} />
          <Stop offset="1" stopColor={TRUNK_DARK} />
        </LinearGradient>
        {/* moonlight from the upper right */}
        <RadialGradient id="moonlight" cx="70%" cy="0%" rx="70%" ry="90%">
          <Stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>
        <ClipPath id="sandClip">
          <Path d={SAND_PATH} />
        </ClipPath>
      </Defs>

      {/* ---------- sand ---------- */}
      <Path d={SAND_PATH} fill="none" stroke={RIM} strokeWidth={4} opacity={0.6} />
      <Path d={SAND_PATH} fill="url(#sandShade)" />
      <G clipPath="url(#sandClip)">
        <Path d={SAND_PATH} fill="url(#moonlight)" />
        {art.sand.specks.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.dark ? '#7d603f' : '#f0dcb4'} opacity={0.7} />
        ))}
        {art.sand.pits.map((p, i) => (
          <G key={`p${i}`}>
            <Ellipse cx={p.x} cy={p.y} rx={p.rx} ry={p.rx * 0.32} fill="#7a5c3a" opacity={0.55} />
            <Path
              d={`M${p.x - p.rx},${p.y + 0.5} Q${p.x},${p.y + p.rx * 0.45} ${p.x + p.rx},${p.y + 0.5}`}
              fill="none"
              stroke="#f0dcb4"
              strokeWidth={0.9}
              opacity={0.7}
            />
          </G>
        ))}
        {art.sand.dunes.map((d, i) => (
          <Path key={`d${i}`} d={d} fill="none" stroke="#6e5232" strokeWidth={1.1} strokeLinecap="round" opacity={0.6} />
        ))}
      </G>
      <Path d={SAND_PATH} fill="none" stroke={INK} strokeWidth={1.4} opacity={0.8} />

      {/* ---------- palm trunk ---------- */}
      <Path d={art.trunk.outline} fill="none" stroke={RIM} strokeWidth={4} opacity={0.5} />
      <Path d={art.trunk.outline} fill="url(#trunkShade)" stroke={INK} strokeWidth={1.3} />
      {art.trunk.rings.map((d, i) => (
        <Path key={i} d={d} fill="none" stroke="#3a2614" strokeWidth={0.9} opacity={0.75} />
      ))}

      {/* ---------- treasure chest of vinyl ---------- */}
      <TreasureChest />

      {/* ---------- fronds ---------- */}
      {art.fronds.map((f, i) => (
        <G key={i}>
          {f.leaflets.map((l, j) => (
            <Path key={j} d={l.d} fill="none" stroke={l.color} strokeWidth={2.4} strokeLinecap="round" />
          ))}
          <Path d={f.stem} fill="none" stroke="#2f5a2c" strokeWidth={2.2} strokeLinecap="round" />
        </G>
      ))}

      {/* coconuts tucked under the crown */}
      <Circle cx={CROWN[0] - 5} cy={CROWN[1] + 7} r={5.5} fill="#4b331c" stroke={INK} strokeWidth={1} />
      <Circle cx={CROWN[0] + 5} cy={CROWN[1] + 8} r={5.5} fill="#5a3d22" stroke={INK} strokeWidth={1} />
      <Circle cx={CROWN[0]} cy={CROWN[1] + 13} r={5} fill="#4b331c" stroke={INK} strokeWidth={1} />
    </Svg>
  );
}

export default React.memo(Island);
