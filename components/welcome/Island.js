import React from 'react';
import Svg, { Path, G, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

// Cartoon desert island with two palm trees, in a clip-art style: thick black outlines,
// peach sand, striped trunks, drooping fronds. Drawn in a 400 x 300 grid and scaled to
// `width`. The bottom of the sand sits at the bottom of the drawing so the waves can
// cover its base.
export const ISLAND_VIEW_W = 400;
export const ISLAND_VIEW_H = 300;

const INK = '#141414';
const SAND = '#f2b184';
const SAND_SHADE = '#e39a6b';
const TRUNK = '#c4743f';
const LEAF_LIGHT = '#7cc97e';
const LEAF_DARK = '#58ad66';
// Soft "moonlight" edge drawn under the black outlines so the island doesn't
// disappear into the black night sky
const RIM = '#7f8db3';
const RIM_EXTRA = 5; // how much wider the rim stroke is than the outline

const SAND_PATH =
  'M30,292 C40,250 120,196 205,192 C290,190 360,240 376,280 C380,292 372,298 352,298 L52,298 C34,298 26,298 30,292 Z';

const FROND_STEPS = 14; // points along each edge of a frond

// One frond: a wide, arching leaf from the crown out to a drooping tip, with jagged
// notched edges and a centre vein (like clip-art palm leaves).
function frond(cx, cy, angleDeg, length, width, droop) {
  const a = (angleDeg * Math.PI) / 180;
  const tx = cx + Math.cos(a) * length;
  const ty = cy + Math.sin(a) * length + droop;
  const len = Math.hypot(tx - cx, ty - cy) || 1;
  // unit vector perpendicular to the leaf, pointing "up" so the leaf arches over
  let nx = -(ty - cy) / len;
  let ny = (tx - cx) / len;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  // arched centre line (quadratic curve bowing upward)
  const qx = (cx + tx) / 2 + nx * width * 0.9;
  const qy = (cy + ty) / 2 + ny * width * 0.9;
  const centre = (t) => [
    (1 - t) * (1 - t) * cx + 2 * (1 - t) * t * qx + t * t * tx,
    (1 - t) * (1 - t) * cy + 2 * (1 - t) * t * qy + t * t * ty,
  ];

  const upper = [];
  const lower = [];
  for (let i = 1; i < FROND_STEPS; i++) {
    const t = i / FROND_STEPS;
    const [px, py] = centre(t);
    const w = width * Math.pow(Math.sin(Math.PI * t), 0.75);
    // every other point pulled in, giving the notched / serrated edge
    const notch = i % 2 ? 1 : 0.62;
    upper.push(`${px + nx * w * notch},${py + ny * w * notch}`);
    lower.push(`${px - nx * w * 0.7 * notch},${py - ny * w * 0.7 * notch}`);
  }

  return {
    leaf: `M${cx},${cy} L${upper.join(' L')} L${tx},${ty} L${lower.reverse().join(' L')} Z`,
    vein: `M${cx},${cy} Q${qx},${qy} ${tx},${ty}`,
  };
}

function PalmCrown({ cx, cy, angles, length }) {
  const leaves = angles.map((deg, i) => {
    const side = Math.cos((deg * Math.PI) / 180); // -1 left ... 1 right
    return {
      // wide leaves; the ones pointing sideways droop the most
      ...frond(cx, cy, deg, length, 17, 34 * Math.abs(side) + 8),
      fill: i % 2 ? LEAF_DARK : LEAF_LIGHT,
    };
  });
  return (
    <G>
      {/* moonlight rim behind all the leaves */}
      {leaves.map((l, i) => (
        <Path key={`r${i}`} d={l.leaf} fill="none" stroke={RIM} strokeWidth={3 + RIM_EXTRA} strokeLinejoin="round" />
      ))}
      {leaves.map((l, i) => (
        <G key={i}>
          <Path d={l.leaf} fill={l.fill} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <Path d={l.vein} fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
        </G>
      ))}
      {/* coconuts */}
      <Circle cx={cx - 6} cy={cy + 8} r={6} fill="#8a5a33" stroke={INK} strokeWidth={2.5} />
      <Circle cx={cx + 6} cy={cy + 9} r={6} fill="#8a5a33" stroke={INK} strokeWidth={2.5} />
    </G>
  );
}

// Trunk from a base point curving up to the crown, with ring stripes
function Trunk({ base, top, bend }) {
  const [bx, by] = base;
  const [tx, ty] = top;
  const half = 9; // half-width at the base
  const topHalf = 6;
  const ctrlX = (bx + tx) / 2 + bend;
  const ctrlY = (by + ty) / 2;
  const outline =
    `M${bx - half},${by} Q${ctrlX - half},${ctrlY} ${tx - topHalf},${ty} ` +
    `L${tx + topHalf},${ty} Q${ctrlX + half},${ctrlY} ${bx + half},${by} Z`;

  // ring stripes along the trunk's centre curve
  const rings = [];
  for (let t = 0.12; t < 0.95; t += 0.14) {
    const x = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * ctrlX + t * t * tx;
    const y = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * ctrlY + t * t * ty;
    const w = half - (half - topHalf) * t;
    rings.push(`M${x - w},${y + 2} Q${x},${y - 3} ${x + w},${y + 2}`);
  }

  return (
    <G>
      <Path d={outline} fill="none" stroke={RIM} strokeWidth={3 + RIM_EXTRA} strokeLinejoin="round" />
      <Path d={outline} fill={TRUNK} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {rings.map((d, i) => (
        <Path key={i} d={d} fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
      ))}
    </G>
  );
}

// Spiky grass tuft at a trunk's base
function Tuft({ x, y }) {
  const d =
    `M${x - 18},${y} L${x - 12},${y - 10} L${x - 8},${y - 3} L${x - 4},${y - 16} ` +
    `L${x},${y - 4} L${x + 5},${y - 14} L${x + 8},${y - 3} L${x + 13},${y - 11} L${x + 18},${y} Z`;
  return <Path d={d} fill={LEAF_DARK} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />;
}

function Island({ width }) {
  const height = (width / ISLAND_VIEW_W) * ISLAND_VIEW_H;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${ISLAND_VIEW_W} ${ISLAND_VIEW_H}`}>
      <Defs>
        <LinearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={SAND} />
          <Stop offset="1" stopColor={SAND_SHADE} />
        </LinearGradient>
      </Defs>

      {/* sand mound (rim first, then the outlined sand on top) */}
      <Path d={SAND_PATH} fill="none" stroke={RIM} strokeWidth={4 + RIM_EXTRA} strokeLinejoin="round" />
      <Path d={SAND_PATH} fill="url(#sand)" stroke={INK} strokeWidth={4} strokeLinejoin="round" />

      {/* back palm (left), then front palm (right) */}
      <Trunk base={[172, 236]} top={[152, 112]} bend={14} />
      <PalmCrown cx={152} cy={110} angles={[-165, -135, -100, -62, -28, 8]} length={78} />

      <Trunk base={[222, 240]} top={[244, 92]} bend={-18} />
      <PalmCrown cx={244} cy={90} angles={[-172, -140, -104, -68, -32, 4, 30]} length={88} />

      <Tuft x={172} y={240} />
      <Tuft x={224} y={244} />
    </Svg>
  );
}

export default React.memo(Island);
