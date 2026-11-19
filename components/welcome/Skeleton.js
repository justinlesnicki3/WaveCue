import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Path, Circle, Ellipse, G, Line, Rect } from 'react-native-svg';

// A chilled-out skeleton, drawn clean but anatomically structured: sitting on the sand, leaning
// back against the palm trunk with his legs stretched out, one knee up and an arm resting on
// it, wearing headphones. His head nods gently to the beat.
//
// Anatomy (simplified): skull with a separate jaw, vertebrae, individual ribs, sternum and
// collarbone, hip bone, paired forearm / lower-leg bones, kneecaps, jointed fingers and toes.
//
// Drawn in a SKELETON_VIEW_W x SKELETON_VIEW_H grid. The ground is at y = SKELETON_GROUND_Y and
// his back (the side that leans on the tree) is the left edge.
export const SKELETON_VIEW_W = 160;
export const SKELETON_VIEW_H = 110;
export const SKELETON_GROUND_Y = 104;

const BONE = '#ece6d6';
const BONE_SHADE = '#c6bca4';
const BONE_DEEP = '#9d927b'; // far-side bones, a step back in the shadow
const INK = '#24222c';
const CAVITY = '#1a1820';
const PHONES = '#2a2a33';
const PHONES_ACCENT = '#e0463c';
const RIM = '#8f9cc0'; // soft moonlight edge, same as the island

const NECK = { x: 24, y: 44 }; // the head nods around this point
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

// spine: pelvis up to the base of the skull, leaning back against the tree
const SPINE = [[43, 92], [39, 80], [31, 62], [25, 45]];
function spineAt(t) {
  const u = 1 - t;
  const [p0, p1, p2, p3] = SPINE;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}
// unit direction up the spine (toward the head) at t
const spineDir = (t) => unit(sub(spineAt(Math.min(1, t + 0.01)), spineAt(Math.max(0, t - 0.01))));

// ---------- bones ----------
// A long bone: shaft with a pair of rounded knobs (condyles) at each end, like a real femur or
// humerus, plus a soft shade along one side so it reads as round.
function Bone({ from, to, w = 3.6, color = BONE }) {
  const n = normal(unit(sub(to, from)));
  const knobs = [from, to].flatMap((p) => [add(p, mul(n, w * 0.34)), add(p, mul(n, -w * 0.34))]);
  const r = w * 0.52;
  const shade = [add(from, mul(n, -w * 0.22)), add(to, mul(n, -w * 0.22))];
  return (
    <G>
      <Line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={INK} strokeWidth={w + OUTLINE} strokeLinecap="round" />
      {knobs.map((k, i) => (
        <Circle key={`o${i}`} cx={k[0]} cy={k[1]} r={r + OUTLINE / 2} fill={INK} />
      ))}
      <Line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={color} strokeWidth={w} strokeLinecap="round" />
      {knobs.map((k, i) => (
        <Circle key={`b${i}`} cx={k[0]} cy={k[1]} r={r} fill={color} />
      ))}
      <Line
        x1={shade[0][0]}
        y1={shade[0][1]}
        x2={shade[1][0]}
        y2={shade[1][1]}
        stroke={color === BONE ? BONE_SHADE : BONE_DEEP}
        strokeWidth={w * 0.28}
        strokeLinecap="round"
        opacity={0.8}
      />
    </G>
  );
}

// Two slimmer bones side by side (radius + ulna, tibia + fibula)
function PairedBone({ from, to, w = 3.4, color = BONE }) {
  const n = normal(unit(sub(to, from)));
  const off = w * 0.42;
  return (
    <G>
      <Bone from={add(from, mul(n, off))} to={add(to, mul(n, off * 0.8))} w={w * 0.5} color={color} />
      <Bone from={add(from, mul(n, -off))} to={add(to, mul(n, -off * 0.8))} w={w * 0.62} color={color} />
    </G>
  );
}

// Wrist bones plus four jointed fingers fanning out along angleDeg
function Hand({ at, angleDeg, spread = 24, length = 7, color = BONE }) {
  const fingers = [-1.5, -0.5, 0.5, 1.5].map((k) => {
    const a = ((angleDeg + k * (spread / 3)) * Math.PI) / 180;
    const l = length * (1 - Math.abs(k) * 0.12);
    const dir = [Math.cos(a), Math.sin(a)];
    const base = add(at, mul(dir, 2.4));
    return [base, add(base, mul(dir, l * 0.5)), add(base, mul(dir, l))];
  });
  return (
    <G>
      {/* wrist */}
      <Ellipse cx={at[0]} cy={at[1]} rx={3} ry={2.4} fill={color} stroke={INK} strokeWidth={1.1} />
      {fingers.map(([base, mid, tip], i) => (
        <G key={i}>
          <Line x1={base[0]} y1={base[1]} x2={mid[0]} y2={mid[1]} stroke={INK} strokeWidth={2.9} strokeLinecap="round" />
          <Line x1={mid[0]} y1={mid[1]} x2={tip[0]} y2={tip[1]} stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
          <Line x1={base[0]} y1={base[1]} x2={mid[0]} y2={mid[1]} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
          <Line x1={mid[0]} y1={mid[1]} x2={tip[0]} y2={tip[1]} stroke={color} strokeWidth={1.1} strokeLinecap="round" />
          {/* knuckle */}
          <Circle cx={mid[0]} cy={mid[1]} r={0.75} fill={BONE_SHADE} />
        </G>
      ))}
    </G>
  );
}

// Heel bone with five toe bones fanning forward along angleDeg
function Foot({ at, angleDeg, color = BONE }) {
  const a = (angleDeg * Math.PI) / 180;
  const dir = [Math.cos(a), Math.sin(a)];
  const n = normal(dir);
  const heel = add(at, mul(dir, -2));
  const toes = [-2, -1, 0, 1, 2].map((k) => {
    const start = add(add(at, mul(dir, 3)), mul(n, k * 0.9));
    const len = 9 - Math.abs(k) * 1.1;
    const tip = add(add(start, mul(dir, len)), mul(n, k * 0.8));
    return [start, add(start, mul(sub(tip, start), 0.6)), tip];
  });
  return (
    <G>
      <Ellipse cx={heel[0]} cy={heel[1]} rx={3.6} ry={2.8} fill={color} stroke={INK} strokeWidth={1.1} />
      <Ellipse cx={at[0] + dir[0] * 2} cy={at[1] + dir[1] * 2} rx={3} ry={2.6} fill={color} stroke={INK} strokeWidth={1.1} />
      {toes.map(([s, m, t], i) => (
        <G key={i}>
          <Line x1={s[0]} y1={s[1]} x2={t[0]} y2={t[1]} stroke={INK} strokeWidth={2.7} strokeLinecap="round" />
          <Line x1={s[0]} y1={s[1]} x2={m[0]} y2={m[1]} stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <Line x1={m[0] + dir[0] * 0.5} y1={m[1] + dir[1] * 0.5} x2={t[0]} y2={t[1]} stroke={color} strokeWidth={1.1} strokeLinecap="round" />
        </G>
      ))}
    </G>
  );
}

// ---------- torso ----------
function Spine() {
  // individual vertebrae: small rounded blocks along the spine curve, with gaps between them
  const blocks = [];
  for (let i = 0; i < 15; i++) {
    const t = 0.06 + (i / 14) * 0.9;
    const p = spineAt(t);
    const d = spineDir(t);
    const angle = (Math.atan2(d[1], d[0]) * 180) / Math.PI;
    const size = 2.9 - t * 0.9; // bigger low in the back, smaller up the neck
    blocks.push({ p, angle, size });
  }
  return (
    <G>
      {blocks.map(({ p, angle, size }, i) => (
        <Rect
          key={i}
          x={p[0] - size * 0.75}
          y={p[1] - size}
          width={size * 1.5}
          height={size * 2}
          rx={size * 0.6}
          fill={BONE}
          stroke={INK}
          strokeWidth={1}
          transform={`rotate(${(angle + 90).toFixed(1)} ${p[0].toFixed(2)} ${p[1].toFixed(2)})`}
        />
      ))}
    </G>
  );
}

// Individual ribs curving from the spine around to the front, plus sternum and collarbone
function buildRibs() {
  const ts = [0.82, 0.76, 0.7, 0.64, 0.58, 0.52, 0.46];
  const lengths = [14, 18, 20, 21, 20, 15, 10]; // last ones are short "floating" ribs
  return ts.map((t, i) => {
    const s = spineAt(t);
    const d = spineDir(t);
    const n = normal(d); // points forward (to the right) since he faces right
    const L = lengths[i];
    const end = add(add(s, mul(n, L)), mul(d, -L * 0.38)); // droops down toward the front
    const ctrl = add(add(s, mul(n, L * 0.55)), mul(d, L * 0.22)); // arches up first
    return { d: `M${f(s)} Q${f(ctrl)} ${f(end)}`, end, s };
  });
}
const RIBS = buildRibs();

function RibCage({ far = false }) {
  // the far side's ribs sit a little behind and in shadow, which gives the cage depth
  const shift = far ? [1.6, -1.4] : [0, 0];
  const color = far ? BONE_DEEP : BONE;
  return (
    <G>
      {RIBS.map((r, i) => (
        <G key={i} transform={`translate(${shift[0]} ${shift[1]})`}>
          <Path d={r.d} fill="none" stroke={INK} strokeWidth={2.4 + OUTLINE} strokeLinecap="round" />
          <Path d={r.d} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
        </G>
      ))}
    </G>
  );
}

function Sternum() {
  // breastbone joining the front ends of the upper ribs
  const pts = RIBS.slice(0, 5).map((r) => r.end);
  const d = `M${pts.map(f).join(' L')}`;
  return (
    <G>
      <Path d={d} fill="none" stroke={INK} strokeWidth={3 + OUTLINE} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={d} fill="none" stroke={BONE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </G>
  );
}

const SHOULDER_NEAR = [34, 50];
const SHOULDER_FAR = [26, 49];

function Clavicle() {
  const a = RIBS[0].end;
  const b = SHOULDER_NEAR;
  const mid = add(mul(add(a, b), 0.5), [0, -2]);
  const d = `M${f(a)} Q${f(mid)} ${f(b)}`;
  return (
    <G>
      <Path d={d} fill="none" stroke={INK} strokeWidth={2.2 + OUTLINE} strokeLinecap="round" />
      <Path d={d} fill="none" stroke={BONE} strokeWidth={2.2} strokeLinecap="round" />
    </G>
  );
}

function Pelvis() {
  // near hip bone seen from the side: flared upper wing (ilium), hip socket, and the
  // loop of the pubis/ischium around its opening
  return (
    <G>
      {/* sacrum at the base of the spine */}
      <Path d="M38,86 C40,84 44,85 45,88 L44,94 C42,95 40,94 39,92 Z" fill={BONE_SHADE} stroke={INK} strokeWidth={1.1} />
      <Path
        d="M35,87 C34,80 42,77 50,79 C56,80 58,85 55,89 C53,91 53,94 56,97 C57,99 55,101 52,100.6 L46,99.6 C43,99 42,97 41,95.5 C38,94.6 35.4,92 35,87 Z"
        fill={BONE}
        stroke={INK}
        strokeWidth={1.3}
      />
      {/* wing ridge and hip socket */}
      <Path d="M38,86 C41,82 48,81 53,83" fill="none" stroke={BONE_SHADE} strokeWidth={1.3} strokeLinecap="round" />
      <Circle cx={50.5} cy={93} r={2.6} fill={BONE_SHADE} stroke={INK} strokeWidth={0.9} />
      {/* opening in the lower hip bone */}
      <Ellipse cx={47} cy={97.4} rx={2.2} ry={1.3} fill={CAVITY} />
    </G>
  );
}

function Body() {
  return (
    <G>
      {/* ---- far side (behind the body, in shadow) ---- */}
      <Bone from={SHOULDER_FAR} to={[19, 74]} w={3.2} color={BONE_DEEP} />
      <PairedBone from={[19, 74]} to={[25, 95]} w={3.2} color={BONE_DEEP} />
      <Hand at={[26, 98]} angleDeg={18} color={BONE_DEEP} />
      <RibCage far />

      {/* far leg: knee up, foot flat on the sand */}
      <Bone from={[46, 92]} to={[76, 72]} w={4.2} />
      <PairedBone from={[76, 72]} to={[92, 98]} w={4} />
      <Ellipse cx={78.4} cy={70.2} rx={2.6} ry={2} fill={BONE} stroke={INK} strokeWidth={1} />
      <Foot at={[93, 100]} angleDeg={-6} />

      <Spine />
      <Pelvis />

      {/* near leg: stretched out along the sand, foot up */}
      <Bone from={[50, 94]} to={[89, 96]} w={4.4} />
      <PairedBone from={[89, 96]} to={[125, 99]} w={4.2} />
      <Ellipse cx={89.6} cy={93.6} rx={2.6} ry={1.9} fill={BONE} stroke={INK} strokeWidth={1} />
      <Foot at={[127, 99]} angleDeg={-64} />

      {/* ---- near side ---- */}
      <RibCage />
      <Sternum />
      <Clavicle />

      {/* near arm: shoulder down to the elbow, forearm across to the raised knee */}
      <Circle cx={SHOULDER_NEAR[0]} cy={SHOULDER_NEAR[1]} r={2.9} fill={BONE} stroke={INK} strokeWidth={1.1} />
      <Bone from={SHOULDER_NEAR} to={[50, 69]} w={3.4} />
      <PairedBone from={[50, 69]} to={[70, 70]} w={3.4} />
      <Hand at={[72, 70]} angleDeg={72} spread={28} />
    </G>
  );
}

// ---------- head ----------
function Head() {
  return (
    <G>
      {/* cranium and upper face, facing a little to the right */}
      <Path
        d="M12,34 C7,26 10,14 22,12 C31,11 38,16 39,23 C39.6,25 38.6,26.6 37.6,27.2 C38.6,29 38.8,31.6 37.8,33.2 C38.4,34.6 37.8,36 36.6,36.6 L35.8,39.4 L26,39.8 C24,37.2 21,36.2 18,37 C15,38 13,37 12,34 Z"
        fill={BONE}
        stroke={INK}
        strokeWidth={1.3}
      />
      {/* temple line and shading toward the back of the skull */}
      <Path d="M15,22 C18,17 25,15 31,17" fill="none" stroke={BONE_SHADE} strokeWidth={1.2} strokeLinecap="round" />
      <Path d="M13,32 C11,26 13,19 17,16" fill="none" stroke={BONE_SHADE} strokeWidth={2.2} strokeLinecap="round" />
      {/* brow ridge */}
      <Path d="M26.4,22.6 C30,21 34.6,21.4 37.8,24" fill="none" stroke={INK} strokeWidth={1} strokeLinecap="round" />
      {/* eye sockets: near one full, far one seen edge-on */}
      <Path d="M27,26.4 C27,22.8 31.6,22.4 34,24.2 C35.4,25.6 35,29.6 32.4,30.4 C29.6,31.2 27,29.6 27,26.4 Z" fill={CAVITY} />
      <Ellipse cx={37.4} cy={26.6} rx={1.3} ry={2.8} fill={CAVITY} />
      {/* cheekbone and its arch back toward the ear */}
      <Path d="M24,32.4 C27,34.2 31,34.4 34.2,33" fill="none" stroke={BONE_SHADE} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M19,33 C21,32 23,32 25,32.6" fill="none" stroke={INK} strokeWidth={0.9} strokeLinecap="round" />
      {/* nose cavity */}
      <Path d="M35.6,29.6 C34.4,31.2 34.6,33.2 35.8,33.8 C36.8,33.2 37.2,31.4 36.4,29.6 Z" fill={CAVITY} />
      {/* upper teeth */}
      <Path d="M27,37.6 L36,37.4" stroke={INK} strokeWidth={0.8} />
      {[28.6, 30.4, 32.2, 34].map((x) => (
        <Line key={`u${x}`} x1={x} y1={37.5} x2={x} y2={39.6} stroke={INK} strokeWidth={0.7} />
      ))}

      {/* jawbone (mandible): up the back toward the ear, forward to the chin */}
      <Path
        d="M18,37.4 C18.6,41.6 21.6,45 26.6,45.6 L34.4,44.8 C35.8,44.4 36.2,42.8 35.6,41.4 L35.4,40.2 L26.4,40.6 C24.4,40.6 22.8,39.6 21.4,38.4 Z"
        fill={BONE}
        stroke={INK}
        strokeWidth={1.2}
      />
      {/* lower teeth */}
      {[28.6, 30.4, 32.2, 34].map((x) => (
        <Line key={`l${x}`} x1={x} y1={40.5} x2={x} y2={42.4} stroke={INK} strokeWidth={0.7} />
      ))}
      <Path d="M27,42.4 L35.4,42.2" stroke={BONE_SHADE} strokeWidth={0.8} />

      {/* headphone band resting over the top of the skull */}
      <Path d="M14,26 C11,7 33,3 37,15" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <Path d="M14,26 C11,7 33,3 37,15" fill="none" stroke={PHONES} strokeWidth={3} strokeLinecap="round" />

      {/* near ear cup, over the ear opening */}
      <Rect x={10.5} y={24} width={10} height={14} rx={4.5} fill={PHONES} stroke={INK} strokeWidth={1.4} />
      <Rect x={13.1} y={27} width={4.8} height={8} rx={2.4} fill={PHONES_ACCENT} />
      {/* far ear cup peeking out on the other side */}
      <Path d="M36,14 C40,14 41.4,19.6 38.6,22.4" fill={PHONES} stroke={INK} strokeWidth={1.2} />
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

  const rotate = nod.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '6deg'] });
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
          <Path d="M50,95 L125,99" />
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
