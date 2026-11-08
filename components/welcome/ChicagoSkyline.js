import React, { useMemo } from 'react';
import Svg, { Rect, Polygon, Line, Circle, G } from 'react-native-svg';
import { seededRandom } from './seededRandom';

// Everything is drawn in a 400 x 260 grid, ground line at y = 256, then scaled to the screen.
export const SKYLINE_VIEW_W = 400;
export const SKYLINE_VIEW_H = 260;
const GROUND = 256;

// Rooftops the spotlights shine from (grid coordinates)
export const SPOTLIGHT_ANCHORS = {
  willis: { x: 148, y: 36 },
  hancock: { x: 303, y: 42 },
};

const OUTLINE = '#1b1636';
const LIT = '#ffd36e';

// [x, topY, width, color]
const BACK_ROW = [
  [0, 150, 22, '#2e3166'], [20, 136, 22, '#363a75'], [44, 160, 26, '#2e3166'],
  [118, 132, 16, '#363a75'], [172, 118, 22, '#2e3166'], [190, 104, 16, '#363a75'],
  [232, 112, 14, '#2e3166'], [274, 124, 14, '#363a75'], [328, 138, 22, '#2e3166'],
  [350, 112, 20, '#363a75'], [370, 146, 30, '#2e3166'],
];

const FRONT_ROW = [
  [0, 190, 26, '#6b5ca5'], [24, 172, 28, '#e8b49a'], [52, 198, 22, '#4a6fb5'],
  [72, 178, 20, '#b9a1d6'], [113, 186, 15, '#5e9fcf'], [166, 162, 30, '#7c86c9'],
  [196, 200, 12, '#e8b49a'], [230, 182, 14, '#4a6fb5'], [269, 172, 16, '#e8b49a'],
  [322, 176, 24, '#6b5ca5'], [346, 152, 26, '#5e9fcf'], [372, 186, 28, '#b9a1d6'],
];

function litWindows(rand, x, top, w, { prob = 0.35, gapX = 6, gapY = 8 } = {}) {
  const out = [];
  for (let wy = top + 6; wy < GROUND - 8; wy += gapY) {
    for (let wx = x + 3; wx < x + w - 4; wx += gapX) {
      if (rand() < prob) out.push({ x: wx, y: wy });
    }
  }
  return out;
}

function Building({ x, top, w, color, windows }) {
  return (
    <G>
      <Rect x={x} y={top} width={w} height={GROUND - top} fill={color} stroke={OUTLINE} strokeWidth={1.2} />
      {windows.map((p, i) => (
        <Rect key={i} x={p.x} y={p.y} width={2.6} height={3.6} fill={LIT} />
      ))}
    </G>
  );
}

// Point on Hancock's tapered edge at height y
function hancockEdges(y) {
  const t = (GROUND - y) / (GROUND - 42);
  return { left: 284 + 6 * t, right: 322 - 6 * t };
}

function ChicagoSkyline({ width }) {
  const height = (width / SKYLINE_VIEW_W) * SKYLINE_VIEW_H;

  const data = useMemo(() => {
    const rand = seededRandom(42);
    return {
      back: BACK_ROW.map(([x, top, w, color]) => ({
        x, top, w, color, windows: litWindows(rand, x, top, w, { prob: 0.12 }),
      })),
      front: FRONT_ROW.map(([x, top, w, color]) => ({
        x, top, w, color, windows: litWindows(rand, x, top, w),
      })),
      willis: litWindows(rand, 128, 92, 40, { prob: 0.18, gapX: 5 }),
      aon: litWindows(rand, 245, 74, 24, { prob: 0.1, gapX: 5 }),
      trees: Array.from({ length: 46 }, (_, i) => ({
        x: i * 9 + rand() * 3,
        r: 5 + rand() * 3,
        c: i % 2 ? '#2f8f4e' : '#3fae5f',
      })),
    };
  }, []);

  const hancockBraces = [];
  for (let y0 = 50; y0 < GROUND - 30; y0 += 34) {
    const a = hancockEdges(y0);
    const b = hancockEdges(y0 + 34);
    hancockBraces.push([a.left, y0, b.right, y0 + 34], [a.right, y0, b.left, y0 + 34]);
  }

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${SKYLINE_VIEW_W} ${SKYLINE_VIEW_H}`}>
      {/* distant buildings */}
      {data.back.map((b, i) => <Building key={`b${i}`} {...b} />)}

      {/* Aon Center: tall pale box with vertical fins */}
      <Rect x={244} y={70} width={26} height={GROUND - 70} fill="#d6deeb" stroke={OUTLINE} strokeWidth={1.2} />
      {[248, 252, 256, 260, 264].map((lx) => (
        <Line key={lx} x1={lx} y1={72} x2={lx} y2={GROUND} stroke="#b3bfd4" strokeWidth={1} />
      ))}
      {data.aon.map((p, i) => <Rect key={`a${i}`} x={p.x} y={p.y} width={2.4} height={3.4} fill={LIT} />)}

      {/* Smurfit-Stone: slanted diamond top */}
      <Polygon points={`92,${GROUND} 92,128 112,108 112,${GROUND}`} fill="#e8a98a" stroke={OUTLINE} strokeWidth={1.2} />
      <Line x1={92} y1={128} x2={112} y2={128} stroke={OUTLINE} strokeWidth={0.8} />

      {/* Willis Tower: stepped bundles + twin antennas */}
      <Line x1={142} y1={36} x2={142} y2={4} stroke="#c9cbe0" strokeWidth={1.8} />
      <Line x1={154} y1={36} x2={154} y2={12} stroke="#c9cbe0" strokeWidth={1.8} />
      <Circle cx={142} cy={4} r={1.6} fill="#ff4d4d" />
      <Circle cx={154} cy={12} r={1.6} fill="#ff4d4d" />
      <Rect x={126} y={90} width={44} height={GROUND - 90} fill="#2b2f55" stroke={OUTLINE} strokeWidth={1.2} />
      <Rect x={131} y={62} width={34} height={30} fill="#2b2f55" stroke={OUTLINE} strokeWidth={1.2} />
      <Rect x={136} y={40} width={24} height={24} fill="#2b2f55" stroke={OUTLINE} strokeWidth={1.2} />
      <Rect x={139} y={34} width={18} height={7} fill="#353a66" stroke={OUTLINE} strokeWidth={1.2} />
      {[136, 143, 150, 157, 164].map((lx) => (
        <Line key={lx} x1={lx} y1={lx > 136 && lx < 160 ? 42 : 92} x2={lx} y2={GROUND} stroke="#3c4278" strokeWidth={1} />
      ))}
      {data.willis.map((p, i) => <Rect key={`w${i}`} x={p.x} y={p.y} width={2.4} height={3.4} fill={LIT} />)}

      {/* Trump Tower: stepped setbacks + spire */}
      <Line x1={218} y1={60} x2={218} y2={26} stroke="#c9d6ea" strokeWidth={1.6} />
      <Rect x={206} y={96} width={24} height={GROUND - 96} fill="#9fb7d9" stroke={OUTLINE} strokeWidth={1.2} />
      <Rect x={210} y={76} width={16} height={21} fill="#a9c0e0" stroke={OUTLINE} strokeWidth={1.2} />
      <Rect x={213} y={60} width={10} height={17} fill="#b4c9e6" stroke={OUTLINE} strokeWidth={1.2} />
      {[211, 216, 221, 226].map((lx) => (
        <Line key={lx} x1={lx} y1={98} x2={lx} y2={GROUND} stroke="#c8d7ee" strokeWidth={1} />
      ))}

      {/* John Hancock: tapered with X-bracing + twin antennas */}
      <Line x1={296} y1={40} x2={296} y2={10} stroke="#c9cbe0" strokeWidth={1.8} />
      <Line x1={310} y1={40} x2={310} y2={14} stroke="#c9cbe0" strokeWidth={1.8} />
      <Circle cx={296} cy={10} r={1.6} fill="#ff4d4d" />
      <Circle cx={310} cy={14} r={1.6} fill="#ff4d4d" />
      <Polygon points={`284,${GROUND} 290,42 316,42 322,${GROUND}`} fill="#23263f" stroke={OUTLINE} strokeWidth={1.2} />
      <Rect x={289} y={38} width={28} height={5} fill="#2f3350" stroke={OUTLINE} strokeWidth={1.2} />
      {hancockBraces.map(([x1, y1, x2, y2], i) => (
        <Line key={`h${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4a5080" strokeWidth={1.2} />
      ))}

      {/* closer, shorter buildings */}
      {data.front.map((b, i) => <Building key={`f${i}`} {...b} />)}

      {/* lakefront trees */}
      <Rect x={0} y={GROUND - 3} width={SKYLINE_VIEW_W} height={SKYLINE_VIEW_H - GROUND + 3} fill="#2f8f4e" />
      {data.trees.map((t, i) => (
        <Circle key={`t${i}`} cx={t.x} cy={GROUND - 1} r={t.r} fill={t.c} stroke="#1f6b3a" strokeWidth={0.8} />
      ))}
    </Svg>
  );
}

export default React.memo(ChicagoSkyline);
