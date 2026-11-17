import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, {
  Path,
  Circle,
  Ellipse,
  Rect,
  G,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { seededRandom } from './seededRandom';

// An original hippie DJ drawn in an ink-sketch style: wild curly hair built from many little
// curl strokes, a full hatched beard, round wire glasses, headphones, and a joint. He sits
// cross-legged and sways. Drawn in a 120 x 120 grid; his seat is the bottom centre.
export const HIPPIE_VIEW = 120;
// where the lit end of the joint is, so the smoke can start there
export const JOINT_TIP = { x: 85, y: 51 };

const INK = '#120c07';
const SKIN = '#e3b994';
const SKIN_SHADE = '#b98a66';
const HAIR = '#1e140c';
const HAIR_STROKE = '#6b4a2e';
const RIM = '#8f9cc0'; // moonlight edge, matches the island

const SWAY_DEG = 4;
const SWAY_MS = 1700;

// ---------- ink-style detail, generated once ----------
function buildInk() {
  const rand = seededRandom(424242);

  // hair: a fairly close-cropped mop of curls hugging the top and sides of the head
  const hairBlobs = [];
  for (let i = 0; i < 14; i++) {
    const a = Math.PI * (1.0 + rand() * 1.0); // upper half only
    const dist = 10.5 + rand() * 3.5;
    hairBlobs.push({
      x: 60 + Math.cos(a) * dist * 1.05,
      y: 39 + Math.sin(a) * dist,
      r: 3.6 + rand() * 2.4,
    });
  }

  // little curl strokes over the hair ("e" loops), like pen scribbles
  const curls = [];
  for (let i = 0; i < 22; i++) {
    const a = Math.PI * (1.0 + rand() * 1.0);
    const dist = 9 + rand() * 6;
    const x = 60 + Math.cos(a) * dist * 1.05;
    const y = 39 + Math.sin(a) * dist;
    const r = 1.3 + rand() * 1.2;
    const flip = rand() < 0.5 ? 1 : 0;
    curls.push(
      `M${x - r},${y} a${r},${r} 0 1,${flip} ${r * 2},0 a${r * 0.7},${r * 0.7} 0 1,${flip} ${-r * 1.2},${r * 0.4}`
    );
  }

  // beard hatching: short downward pen strokes
  const beard = [];
  for (let i = 0; i < 30; i++) {
    const x = 49 + rand() * 22;
    const top = 47 + rand() * 6;
    const len = 4 + rand() * 6;
    // keep strokes inside the beard's rough V shape
    const maxLen = 66 - top - Math.abs(x - 60) * 0.55;
    const l = Math.max(2, Math.min(len, maxLen));
    beard.push(`M${x},${top} q${(rand() - 0.5) * 2},${l / 2} ${(rand() - 0.5) * 1.5},${l}`);
  }

  // shading hatch on the shadowed (left) side of the face
  const faceHatch = [];
  for (let i = 0; i < 7; i++) {
    const y = 33 + i * 2.2;
    faceHatch.push(`M${48.5},${y} l${3.5 - i * 0.2},${-1.4}`);
  }

  return { hairBlobs, curls, beard, faceHatch };
}

function HippieArt({ size }) {
  const ink = useMemo(buildInk, []);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${HIPPIE_VIEW} ${HIPPIE_VIEW}`}>
      {/* moonlight rim around the silhouette (hair + legs) */}
      <G opacity={0.5}>
        <Path d="M16,118 C18,98 42,94 60,96 C78,94 102,98 104,118 Z" fill="none" stroke={RIM} strokeWidth={4} />
        {ink.hairBlobs.map((b, i) => (
          <Circle key={i} cx={b.x} cy={b.y} r={b.r + 1.4} fill="none" stroke={RIM} strokeWidth={2.4} />
        ))}
      </G>

      {/* crossed legs (dark jeans) and bare feet */}
      <Path d="M16,118 C18,98 42,94 60,96 C78,94 102,98 104,118 Z" fill="#26304f" stroke={INK} strokeWidth={1.4} />
      <Path d="M28,109 C44,101 76,101 92,109" fill="none" stroke="#151c33" strokeWidth={1.3} />
      <Path d="M36,104 l-4,6 M84,104 l4,6" stroke="#3b4770" strokeWidth={0.9} />
      <Ellipse cx={34} cy={113} rx={7} ry={3.4} fill={SKIN} stroke={INK} strokeWidth={1.1} />
      <Ellipse cx={86} cy={113} rx={7} ry={3.4} fill={SKIN} stroke={INK} strokeWidth={1.1} />

      {/* hair mass behind the head */}
      {ink.hairBlobs.map((b, i) => (
        <Circle key={`hb${i}`} cx={b.x} cy={b.y} r={b.r} fill={HAIR} />
      ))}

      {/* torso: dark loose tee with a few ink folds */}
      <Path d="M40,62 C46,58 74,58 80,62 L90,100 C76,104 44,104 30,100 Z" fill="#2b2b33" stroke={INK} strokeWidth={1.4} />
      <Path d="M48,70 q4,12 2,24 M70,72 q-3,10 -1,22 M58,64 q2,4 0,8" fill="none" stroke="#45454f" strokeWidth={1} />

      {/* left arm resting on the knee */}
      <Path d="M42,64 C34,74 30,86 36,98" fill="none" stroke={INK} strokeWidth={8.5} strokeLinecap="round" />
      <Path d="M42,64 C34,74 30,86 36,98" fill="none" stroke={SKIN} strokeWidth={6} strokeLinecap="round" />

      {/* head with shading on one side */}
      <Ellipse cx={60} cy={41} rx={12} ry={13.5} fill={SKIN} stroke={INK} strokeWidth={1.2} />
      <Path d="M48.5,34 C47,42 49,50 54,55 L52,44 Z" fill={SKIN_SHADE} opacity={0.55} />
      {ink.faceHatch.map((d, i) => (
        <Path key={`fh${i}`} d={d} stroke={INK} strokeWidth={0.6} opacity={0.6} />
      ))}

      {/* hair falling over the forehead and sides */}
      <Path d="M47,36 C48,25 56,22 62,24 C68,22 74,27 74,35 C70,30 64,29 60,31 C55,29 50,31 47,36 Z" fill={HAIR} />
      <Path d="M47.5,34 C46,39 46.5,43 48,46 L49.5,40 Z M72.5,34 C74,39 73.5,43 72,46 L70.5,40 Z" fill={HAIR} />

      {/* curl scribbles across the whole head of hair */}
      {ink.curls.map((d, i) => (
        <Path key={`c${i}`} d={d} fill="none" stroke={HAIR_STROKE} strokeWidth={0.8} strokeLinecap="round" />
      ))}

      {/* eyebrows, eyes, nose */}
      <Path d="M51,35.5 q3,-1.6 6,-0.4 M63,35.1 q3,-1.2 6,0.4" fill="none" stroke={INK} strokeWidth={1.1} strokeLinecap="round" />
      <Path d="M52.5,39.4 q1.6,-0.9 3.2,0 M64.3,39.4 q1.6,-0.9 3.2,0" fill="none" stroke={INK} strokeWidth={1} strokeLinecap="round" />
      <Path d="M60,40 q-1.4,4.5 0.6,6.2 q1.2,0.3 2,-0.4" fill="none" stroke={INK} strokeWidth={0.9} strokeLinecap="round" />

      {/* full beard + mustache, hatched with pen strokes */}
      <Path
        d="M48,44 C47,53 52,63 60,66 C68,63 73,53 72,44 C70,48 66,49.5 63,48.5 C61.5,48 58.5,48 57,48.5 C54,49.5 50,48 48,44 Z"
        fill={HAIR}
        stroke={INK}
        strokeWidth={0.9}
      />
      <Path d="M54.5,48.6 q5.5,-2.6 11,0" fill="none" stroke={HAIR} strokeWidth={2.6} strokeLinecap="round" />
      {ink.beard.map((d, i) => (
        <Path key={`b${i}`} d={d} fill="none" stroke={HAIR_STROKE} strokeWidth={0.7} strokeLinecap="round" />
      ))}

      {/* round wire-rim glasses */}
      <Circle cx={54} cy={39.4} r={4.4} fill="#dfe8f5" fillOpacity={0.12} stroke="#c9c2b0" strokeWidth={1} />
      <Circle cx={66} cy={39.4} r={4.4} fill="#dfe8f5" fillOpacity={0.12} stroke="#c9c2b0" strokeWidth={1} />
      <Path d="M58.4,39 q1.6,-1 3.2,0 M49.6,38.6 L47.4,37.6 M70.4,38.6 L72.6,37.6" fill="none" stroke="#c9c2b0" strokeWidth={0.9} />
      <Circle cx={52.6} cy={37.8} r={0.9} fill="#fff" opacity={0.6} />
      <Circle cx={64.6} cy={37.8} r={0.9} fill="#fff" opacity={0.6} />

      {/* headphones */}
      <Path d="M44,42 C41,15 79,15 76,42" fill="none" stroke="#0f0f12" strokeWidth={3.6} strokeLinecap="round" />
      <Path d="M44,42 C41,15 79,15 76,42" fill="none" stroke="#4a4a55" strokeWidth={1} strokeLinecap="round" />
      <Rect x={38.5} y={36} width={8.5} height={14} rx={4} fill="#1d1d22" stroke={INK} strokeWidth={1} />
      <Rect x={73} y={36} width={8.5} height={14} rx={4} fill="#1d1d22" stroke={INK} strokeWidth={1} />
      <Rect x={40} y={40} width={2} height={6} rx={1} fill="#c4433a" />
      <Rect x={78} y={40} width={2} height={6} rx={1} fill="#c4433a" />

      {/* right arm raised, hand at the mouth with the joint */}
      <Path d="M78,64 C90,72 90,86 82,90 M82,90 C78,78 74,62 72,55" fill="none" stroke={INK} strokeWidth={8.5} strokeLinecap="round" />
      <Path d="M78,64 C90,72 90,86 82,90 M82,90 C78,78 74,62 72,55" fill="none" stroke={SKIN} strokeWidth={6} strokeLinecap="round" />
      <Line x1={66} y1={51.5} x2={84} y2={51} stroke="#efe9de" strokeWidth={2.3} strokeLinecap="round" />
      <Circle cx={JOINT_TIP.x} cy={JOINT_TIP.y} r={1.8} fill="#ff7a2a" />
      <Circle cx={JOINT_TIP.x} cy={JOINT_TIP.y} r={3.8} fill="#ff7a2a" opacity={0.3} />
    </Svg>
  );
}

// The character, swaying gently from his seat (bottom centre)
export default function Hippie({ size }) {
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: SWAY_MS, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: SWAY_MS * 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: SWAY_MS, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const rotate = sway.interpolate({ inputRange: [-1, 1], outputRange: [`-${SWAY_DEG}deg`, `${SWAY_DEG}deg`] });

  return (
    <Animated.View style={{ width: size, height: size, transformOrigin: 'bottom', transform: [{ rotate }] }}>
      <HippieArt size={size} />
    </Animated.View>
  );
}

// ---------- smoke: a cartoon ribbon of smoke wiggling up toward the logo ----------
// Drawn like classic cartoon cigarette smoke: one soft grey ribbon with a darker outline that
// starts as a thin wisp at the joint, snakes side to side as it rises, swells and pinches
// (where the ribbon "twists"), and fades out near the top. The wiggles travel upward, so the
// smoke looks like it's floating up.
const SMOKE_W = 120; // width of the smoke area; the joint is at its bottom centre
const SAMPLES = 80; // points along the ribbon
const FRAME_MS = 40; // ~25 fps is plenty for slow smoke
const SPEED = 0.0014; // how fast the wiggles travel up (radians per ms)

// The ribbon's outline for animation time `t`
function ribbonPath(height, t) {
  const cx = SMOKE_W / 2;
  const centre = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const s = i / SAMPLES; // 0 at the joint, 1 at the top
    // side-to-side snaking: small near the joint, wider as it rises; minus t = travels up
    const amp = 4 + 26 * Math.sqrt(s);
    const wig =
      Math.sin(s * Math.PI * 6.5 - t) * 0.75 +
      Math.sin(s * Math.PI * 11 - t * 1.5 + 1.3) * 0.3;
    const x = cx + amp * wig + 6 * s; // slight lean to the right
    const y = height * (1 - s);
    // thickness: thin wisp at the bottom, fullest in the middle, tapering at the top, with
    // pinches that travel up the ribbon like twists
    const body = 1.2 + 9.5 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.75)), 1.2);
    const twist = 0.4 + 0.6 * Math.abs(Math.cos(s * Math.PI * 4.5 - t * 0.8));
    centre.push({ x, y, w: body * twist });
  }

  // offset each point sideways (along the normal) to get the two edges
  const left = [];
  const right = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const a = centre[Math.max(0, i - 1)];
    const b = centre[Math.min(SAMPLES, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const { x, y, w } = centre[i];
    left.push([x + nx * w, y + ny * w]);
    right.push([x - nx * w, y - ny * w]);
  }

  // up one edge and back down the other, smoothed with curves through the midpoints
  const pts = left.concat(right.reverse());
  const f = (n) => n.toFixed(1);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    d += ` Q${f(x1)},${f(y1)} ${f((x1 + x2) / 2)},${f((y1 + y2) / 2)}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${f(last[0])},${f(last[1])} Z`;
}

// Smoke rising from (x, y) for `rise` pixels
export function Smoke({ x, y, rise }) {
  const height = Math.max(40, rise);
  const [t, setT] = useState(0);
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // the wiggles travel up the ribbon
    const start = Date.now();
    const timer = setInterval(() => setT((Date.now() - start) * SPEED), FRAME_MS);
    // the whole trail sways a little in the air
    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: -1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    driftLoop.start();
    return () => {
      clearInterval(timer);
      driftLoop.stop();
    };
  }, []);

  const d = useMemo(() => ribbonPath(height, t), [height, t]);
  const sway = drift.interpolate({ inputRange: [-1, 1], outputRange: ['-2deg', '2deg'] });

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: x - SMOKE_W / 2, top: y - height, width: SMOKE_W, height }}
    >
      <Animated.View style={{ flex: 1, transformOrigin: 'bottom', transform: [{ rotate: sway }] }}>
        <Svg width={SMOKE_W} height={height}>
          <Defs>
            {/* soft grey body, solid near the joint and fading out by the top */}
            <LinearGradient id="smokeFill" x1="0" y1={height} x2="0" y2="0" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#d6d8de" stopOpacity="0.8" />
              <Stop offset="0.55" stopColor="#c9ccd4" stopOpacity="0.62" />
              <Stop offset="0.85" stopColor="#bfc3cc" stopOpacity="0.25" />
              <Stop offset="1" stopColor="#bfc3cc" stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="smokeEdge" x1="0" y1={height} x2="0" y2="0" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#9da1ab" stopOpacity="0.95" />
              <Stop offset="0.6" stopColor="#9da1ab" stopOpacity="0.7" />
              <Stop offset="0.9" stopColor="#9da1ab" stopOpacity="0.15" />
              <Stop offset="1" stopColor="#9da1ab" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path
            d={d}
            fill="url(#smokeFill)"
            stroke="url(#smokeEdge)"
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
