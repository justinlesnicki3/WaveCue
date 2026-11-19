import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Path, Circle, Ellipse, G, Line, Rect } from 'react-native-svg';

// A chilled-out skeleton facing the viewer, drawn clean with a bit of real bone structure:
// sitting on the sand, leaning back against the palm trunk, legs stretched out to the right
// with one knee up and an arm resting on it, wearing headphones. His head nods to the beat.
//
// Drawn in a SKELETON_VIEW_W x SKELETON_VIEW_H grid. The ground is at y = SKELETON_GROUND_Y and
// his back (the side that leans on the tree) is the left edge.
export const SKELETON_VIEW_W = 160;
export const SKELETON_VIEW_H = 110;
export const SKELETON_GROUND_Y = 104;

const BONE = '#ece6d6';
const BONE_SHADE = '#c6bca4';
const INK = '#24222c';
const CAVITY = '#1a1820';
const PHONES = '#2a2a33';
const PHONES_ACCENT = '#e0463c';
const RIM = '#8f9cc0'; // soft moonlight edge, same as the island

const NECK = { x: 26, y: 45 }; // the head nods around this point
const BEAT_MS = 500; // 120 BPM
const OUTLINE = 2.2; // extra width of the dark outline around each bone

// ---------- geometry helpers ----------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const unit = (a) => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};
const normal = (a) => [-a[1], a[0]];
const f = (p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;

// center line of the body: pelvis up to the neck, leaning back against the tree
const SPINE = [[44, 91], [40, 79], [32, 61], [26, 45]];
function spineAt(t) {
  const u = 1 - t;
  const [p0, p1, p2, p3] = SPINE;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}
const spineDir = (t) => unit(sub(spineAt(Math.min(1, t + 0.01)), spineAt(Math.max(0, t - 0.01))));

// the body's "right" (viewer's right) at the shoulders, perpendicular to the leaning spine
const ACROSS = mul(normal(spineDir(0.88)), 1);
const CHEST_TOP = spineAt(0.88);
const SHOULDER_R = add(CHEST_TOP, mul(ACROSS, 13)); // viewer's right
const SHOULDER_L = add(CHEST_TOP, mul(ACROSS, -12)); // viewer's left, against the tree

// ---------- bones ----------
// A long bone: shaft with a pair of rounded knobs at each end
function Bone({ from, to, w = 3.6 }) {
  const n = normal(unit(sub(to, from)));
  const knobs = [from, to].flatMap((p) => [add(p, mul(n, w * 0.3)), add(p, mul(n, -w * 0.3))]);
  const r = w * 0.5;
  const shade = [add(from, mul(n, -w * 0.22)), add(to, mul(n, -w * 0.22))];
  return (
    <G>
      <Line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={INK} strokeWidth={w + OUTLINE} strokeLinecap="round" />
      {knobs.map((k, i) => (
        <Circle key={`o${i}`} cx={k[0]} cy={k[1]} r={r + OUTLINE / 2} fill={INK} />
      ))}
      <Line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={BONE} strokeWidth={w} strokeLinecap="round" />
      {knobs.map((k, i) => (
        <Circle key={`b${i}`} cx={k[0]} cy={k[1]} r={r} fill={BONE} />
      ))}
      <Line
        x1={shade[0][0]}
        y1={shade[0][1]}
        x2={shade[1][0]}
        y2={shade[1][1]}
        stroke={BONE_SHADE}
        strokeWidth={w * 0.26}
        strokeLinecap="round"
        opacity={0.8}
      />
    </G>
  );
}

// Wrist plus four two-part fingers fanning out along angleDeg
function Hand({ at, angleDeg, spread = 24, length = 7 }) {
  const fingers = [-1.5, -0.5, 0.5, 1.5].map((k) => {
    const a = ((angleDeg + k * (spread / 3)) * Math.PI) / 180;
    const l = length * (1 - Math.abs(k) * 0.12);
    const dir = [Math.cos(a), Math.sin(a)];
    const base = add(at, mul(dir, 2.2));
    return [base, add(base, mul(dir, l * 0.5)), add(base, mul(dir, l))];
  });
  return (
    <G>
      {fingers.map(([base, , tip], i) => (
        <Line key={`o${i}`} x1={base[0]} y1={base[1]} x2={tip[0]} y2={tip[1]} stroke={INK} strokeWidth={2.9} strokeLinecap="round" />
      ))}
      {fingers.map(([base, mid, tip], i) => (
        <G key={`b${i}`}>
          <Line x1={base[0]} y1={base[1]} x2={mid[0]} y2={mid[1]} stroke={BONE} strokeWidth={1.3} strokeLinecap="round" />
          <Line x1={mid[0]} y1={mid[1]} x2={tip[0]} y2={tip[1]} stroke={BONE} strokeWidth={1.1} strokeLinecap="round" />
        </G>
      ))}
      <Ellipse cx={at[0]} cy={at[1]} rx={3} ry={2.4} fill={BONE} stroke={INK} strokeWidth={1.1} />
    </G>
  );
}

// Heel with four toes pointing along angleDeg
function Foot({ at, angleDeg }) {
  const a = (angleDeg * Math.PI) / 180;
  const dir = [Math.cos(a), Math.sin(a)];
  const n = normal(dir);
  const toes = [-1.5, -0.5, 0.5, 1.5].map((k) => {
    const start = add(add(at, mul(dir, 2.5)), mul(n, k * 1.1));
    const tip = add(add(start, mul(dir, 9 - Math.abs(k) * 1.2)), mul(n, k * 0.7));
    return [start, tip];
  });
  return (
    <G>
      {toes.map(([s, t], i) => (
        <Line key={`o${i}`} x1={s[0]} y1={s[1]} x2={t[0]} y2={t[1]} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      ))}
      {toes.map(([s, t], i) => (
        <Line key={`b${i}`} x1={s[0]} y1={s[1]} x2={t[0]} y2={t[1]} stroke={BONE} strokeWidth={1.4} strokeLinecap="round" />
      ))}
      <Ellipse cx={at[0]} cy={at[1]} rx={3.8} ry={3} fill={BONE} stroke={INK} strokeWidth={1.1} />
    </G>
  );
}

// ---------- torso (seen from the front) ----------
// Lower spine: a few vertebrae showing between the ribs and the hips
function LowerSpine() {
  const blocks = [0.1, 0.2, 0.3, 0.4].map((t) => {
    const p = spineAt(t);
    const d = spineDir(t);
    return { p, angle: (Math.atan2(d[1], d[0]) * 180) / Math.PI };
  });
  return (
    <G>
      {blocks.map(({ p, angle }, i) => (
        <Rect
          key={i}
          x={p[0] - 2.8}
          y={p[1] - 2.2}
          width={5.6}
          height={4.4}
          rx={1.8}
          fill={BONE}
          stroke={INK}
          strokeWidth={1}
          transform={`rotate(${(angle + 90).toFixed(1)} ${p[0].toFixed(2)} ${p[1].toFixed(2)})`}
        />
      ))}
    </G>
  );
}

// Ribs curving out and down on both sides of the breastbone, like a real ribcage from the front
function buildRibs() {
  const levels = [0.84, 0.78, 0.72, 0.66, 0.6, 0.54];
  const widths = [10, 13.5, 15, 15.5, 14.5, 12];
  const ribs = [];
  levels.forEach((t, i) => {
    const s = spineAt(t);
    const d = spineDir(t);
    const n = normal(d);
    const L = widths[i];
    for (const side of [1, -1]) {
      const out = mul(n, side * L);
      const ctrl = add(add(s, mul(n, side * L * 0.75)), mul(d, L * 0.18)); // arches up and out
      const end = add(add(s, out), mul(d, -L * 0.42)); // then curves down at the side
      ribs.push(`M${f(s)} Q${f(ctrl)} ${f(end)}`);
    }
  });
  return ribs;
}
const RIBS = buildRibs();

function RibCage() {
  return (
    <G>
      {RIBS.map((d, i) => (
        <Path key={`o${i}`} d={d} fill="none" stroke={INK} strokeWidth={2.4 + OUTLINE} strokeLinecap="round" />
      ))}
      {RIBS.map((d, i) => (
        <Path key={`b${i}`} d={d} fill="none" stroke={BONE} strokeWidth={2.4} strokeLinecap="round" />
      ))}
    </G>
  );
}

function Sternum() {
  // breastbone down the middle of the chest
  const a = spineAt(0.87);
  const b = spineAt(0.6);
  return (
    <G>
      <Line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={INK} strokeWidth={3.4 + OUTLINE} strokeLinecap="round" />
      <Line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={BONE} strokeWidth={3.4} strokeLinecap="round" />
    </G>
  );
}

function Collarbones() {
  const top = spineAt(0.87);
  return (
    <G>
      {[SHOULDER_L, SHOULDER_R].map((sh, i) => {
        const mid = add(mul(add(top, sh), 0.5), mul(spineDir(0.88), 1.8));
        const d = `M${f(top)} Q${f(mid)} ${f(sh)}`;
        return (
          <G key={i}>
            <Path d={d} fill="none" stroke={INK} strokeWidth={2.2 + OUTLINE} strokeLinecap="round" />
            <Path d={d} fill="none" stroke={BONE} strokeWidth={2.2} strokeLinecap="round" />
          </G>
        );
      })}
    </G>
  );
}

const HIP_L = [37, 95];
const HIP_R = [51, 94];

function Pelvis() {
  // hip bones from the front: wide flaring wings on top, narrowing down to the hip sockets,
  // with the arch and an opening on each side at the bottom
  return (
    <G>
      <Path
        d="M30,84 C33,82 38,83 41,86 L44,88 L47,86 C50,83 55,82 58,84 C58,88 55,91 53,93 C52,96 50,98.6 47,99.2 L44,97.6 L41,99.2 C38,98.6 36,96 35,93 C33,91 30,88 30,84 Z"
        fill={BONE}
        stroke={INK}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      {/* sacrum: the wedge in the middle where the spine meets the hips */}
      <Path d="M44,88.4 L41.6,92.6 L44,95 L46.4,92.6 Z" fill={BONE_SHADE} stroke={INK} strokeWidth={0.8} strokeLinejoin="round" />
      {/* wing ridges */}
      <Path d="M32,85.2 C35,84 38.6,85 40.6,87.4" fill="none" stroke={BONE_SHADE} strokeWidth={1.2} strokeLinecap="round" />
      <Path d="M56,85.2 C53,84 49.4,85 47.4,87.4" fill="none" stroke={BONE_SHADE} strokeWidth={1.2} strokeLinecap="round" />
      {/* openings on each side */}
      <Ellipse cx={39.6} cy={95.6} rx={1.9} ry={1.4} fill={CAVITY} />
      <Ellipse cx={48.4} cy={95.6} rx={1.9} ry={1.4} fill={CAVITY} />
    </G>
  );
}

function Body() {
  return (
    <G>
      {/* straight leg: from the left hip out along the sand, foot up */}
      <Bone from={HIP_L} to={[88, 97]} w={4.4} />
      <Bone from={[88, 97]} to={[124, 99]} w={3.8} />
      <Ellipse cx={88.4} cy={94.4} rx={2.5} ry={1.9} fill={BONE} stroke={INK} strokeWidth={1} />
      <Foot at={[127, 98.5]} angleDeg={-64} />

      {/* raised leg: from the right hip up to the knee, foot flat on the sand */}
      <Bone from={HIP_R} to={[77, 71]} w={4.3} />
      <Bone from={[77, 71]} to={[92, 97]} w={3.8} />
      <Ellipse cx={79} cy={69.4} rx={2.5} ry={1.9} fill={BONE} stroke={INK} strokeWidth={1} />
      <Foot at={[94, 99.5]} angleDeg={-6} />

      <LowerSpine />
      <Pelvis />
      <RibCage />
      <Sternum />
      <Collarbones />

      {/* left arm (by the tree): down to the sand */}
      <Circle cx={SHOULDER_L[0]} cy={SHOULDER_L[1]} r={2.9} fill={BONE} stroke={INK} strokeWidth={1.1} />
      <Bone from={SHOULDER_L} to={[13, 78]} w={3.3} />
      <Bone from={[13, 78]} to={[19, 96]} w={3} />
      <Hand at={[20, 98]} angleDeg={20} />

      {/* right arm: forearm across to the raised knee */}
      <Circle cx={SHOULDER_R[0]} cy={SHOULDER_R[1]} r={2.9} fill={BONE} stroke={INK} strokeWidth={1.1} />
      <Bone from={SHOULDER_R} to={[53, 67]} w={3.4} />
      <Bone from={[53, 67]} to={[72, 69]} w={3.1} />
      <Hand at={[74, 69]} angleDeg={72} spread={28} />
    </G>
  );
}

// ---------- head (front view, turned a touch to the right) ----------
function Head() {
  return (
    <G>
      {/* cranium and upper face */}
      <Path
        d="M26,13 C35,13 39,20 38.6,27 C38.4,30.4 37,32.6 35.6,34.6 L34.6,38.8 L18.4,38.8 L17.2,34.6 C15.4,32.6 13.6,30.2 13.4,27 C13,20 17,13 26,13 Z"
        fill={BONE}
        stroke={INK}
        strokeWidth={1.3}
      />
      {/* soft shading down one side of the skull */}
      <Path d="M15.6,30 C14.6,25 15.6,19 19,16.4" fill="none" stroke={BONE_SHADE} strokeWidth={2} strokeLinecap="round" />
      {/* eye sockets */}
      <Path d="M17.6,27 C17.6,24 20.4,23 22.6,23.8 C24.2,24.6 24.4,27.6 23.2,29.2 C21.8,30.6 17.6,30.4 17.6,27 Z" fill={CAVITY} />
      <Path d="M28.6,23.8 C30.8,23 34,24 34,27 C34,30.4 30,30.6 28.6,29.2 C27.4,27.6 27.4,24.6 28.6,23.8 Z" fill={CAVITY} />
      {/* nose */}
      <Path d="M25.8,30.6 C24.6,32.2 24.6,33.8 25.4,34.4 L26.8,34.4 C27.6,33.8 27.6,32.2 26.6,30.6 Z" fill={CAVITY} />
      {/* cheekbones */}
      <Path d="M17.2,32.4 C18.8,33.6 20.6,33.8 22,33.2" fill="none" stroke={BONE_SHADE} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M35,32.4 C33.4,33.6 31.6,33.8 30.2,33.2" fill="none" stroke={BONE_SHADE} strokeWidth={1.4} strokeLinecap="round" />
      {/* upper teeth */}
      <Path d="M19.4,36.8 L33.4,36.8" stroke={INK} strokeWidth={0.8} />
      {[21.4, 23.6, 25.8, 28, 30.2, 32.2].map((x) => (
        <Line key={`u${x}`} x1={x} y1={36.8} x2={x} y2={38.8} stroke={INK} strokeWidth={0.7} />
      ))}

      {/* jaw */}
      <Path
        d="M18.4,38.8 L18.8,41.6 C20,44.8 23,46 26,46 C29,46 32,44.8 33.4,41.6 L34.6,38.8 Z"
        fill={BONE}
        stroke={INK}
        strokeWidth={1.2}
      />
      {[21.4, 23.6, 25.8, 28, 30.2, 32.2].map((x) => (
        <Line key={`l${x}`} x1={x} y1={38.8} x2={x} y2={40.8} stroke={INK} strokeWidth={0.7} />
      ))}
      <Path d="M19.6,40.8 L33.2,40.8" stroke={BONE_SHADE} strokeWidth={0.8} />

      {/* headphone band over the top of the skull */}
      <Path d="M12.4,28 C10,8 41,7 39.6,28" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <Path d="M12.4,28 C10,8 41,7 39.6,28" fill="none" stroke={PHONES} strokeWidth={3} strokeLinecap="round" />
      {/* ear cups on both sides */}
      {[7.4, 35.6].map((x) => (
        <G key={x}>
          <Rect x={x} y={23} width={9} height={14} rx={4.2} fill={PHONES} stroke={INK} strokeWidth={1.4} />
          <Rect x={x + 2.1} y={26} width={4.8} height={8} rx={2.4} fill={PHONES_ACCENT} />
        </G>
      ))}
    </G>
  );
}

export default function Skeleton({ width }) {
  const height = (width / SKELETON_VIEW_W) * SKELETON_VIEW_H;
  const nod = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // a small, relaxed nod on every beat
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(nod, { toValue: 1, duration: BEAT_MS * 0.35, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(nod, { toValue: 0, duration: BEAT_MS * 0.65, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const rotate = nod.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '5deg'] });
  // the neck, in pixels: [x, y, z]. (A long percentage string like "40.909090%" crashes
  // React Native's parser on phones, so use plain numbers.)
  const scale = width / SKELETON_VIEW_W;
  const origin = [Math.round(NECK.x * scale * 10) / 10, Math.round(NECK.y * scale * 10) / 10, 0];
  const viewBox = `0 0 ${SKELETON_VIEW_W} ${SKELETON_VIEW_H}`;

  return (
    <View style={{ width, height }} pointerEvents="none">
      {/* soft moonlight outline behind the whole figure so it reads on the dark scene */}
      <Svg width={width} height={height} viewBox={viewBox} style={{ position: 'absolute', opacity: 0.35 }}>
        <G stroke={RIM} strokeWidth={4} fill="none" strokeLinecap="round">
          <Path d={`M${SPINE[0].join(',')} C${SPINE.slice(1).map((p) => p.join(',')).join(' ')}`} />
          <Path d="M37,95 L124,99" />
        </G>
      </Svg>
      <Svg width={width} height={height} viewBox={viewBox} style={{ position: 'absolute' }}>
        <Body />
      </Svg>
      <Animated.View
        style={{ position: 'absolute', width, height, transformOrigin: origin, transform: [{ rotate }] }}
      >
        <Svg width={width} height={height} viewBox={viewBox}>
          <Head />
        </Svg>
      </Animated.View>
    </View>
  );
}
