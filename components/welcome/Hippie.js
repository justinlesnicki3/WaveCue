import React, { useEffect, useMemo, useRef } from 'react';
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

  // hair: an uneven cloud of overlapping blobs around the top and sides of the head
  const hairBlobs = [];
  for (let i = 0; i < 26; i++) {
    const a = Math.PI * (0.92 + rand() * 1.16); // mostly the upper half, wrapping the sides
    const dist = 12 + rand() * 9;
    hairBlobs.push({
      x: 60 + Math.cos(a) * dist * 1.15,
      y: 38 + Math.sin(a) * dist,
      r: 5 + rand() * 4.5,
    });
  }

  // little curl strokes over the hair ("e" loops), like pen scribbles
  const curls = [];
  for (let i = 0; i < 46; i++) {
    const a = Math.PI * (0.9 + rand() * 1.2);
    const dist = 9 + rand() * 15;
    const x = 60 + Math.cos(a) * dist * 1.15;
    const y = 38 + Math.sin(a) * dist;
    const r = 1.6 + rand() * 1.8;
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
      <Path d="M46,34 C43,42 44,50 47,56 L49,44 Z M74,34 C77,42 76,50 73,56 L71,44 Z" fill={HAIR} />

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

// ---------- smoke: a soft trail of wisps drifting up toward the logo ----------
const AnimatedPath = Animated.createAnimatedComponent(Path);
const SMOKE_W = 110; // width of the smoke area; the joint is at its bottom centre
const FLOW_MS = 5200; // how long the flowing pattern takes to loop

// Each wisp: how far it wanders side to side, how wiggly it is, stroke width, how bright,
// and its dash pattern (gaps make the smoke break up as it rises)
const WISPS = [
  { amp: 9, freq: 1.5, phase: 0.0, width: 2.2, opacity: 0.8, dash: [70, 30], speed: 2 },
  { amp: 15, freq: 1.1, phase: 1.4, width: 1.3, opacity: 0.7, dash: [46, 34], speed: 3 },
  { amp: 21, freq: 0.8, phase: 2.6, width: 3.2, opacity: 0.35, dash: [110, 60], speed: 1 },
  { amp: 7, freq: 2.2, phase: 0.7, width: 1.0, opacity: 0.6, dash: [28, 22], speed: 4 },
  { amp: 26, freq: 0.6, phase: 4.1, width: 1.6, opacity: 0.4, dash: [80, 70], speed: 2 },
];
// wide, faint, unbroken bands underneath give the trail a hazy body
const HAZE = [
  { amp: 12, freq: 0.9, phase: 0.4, width: 9, opacity: 0.1 },
  { amp: 18, freq: 0.7, phase: 2.2, width: 16, opacity: 0.06 },
];

// A wavy line from the bottom centre up to the top; it widens and curls more as it rises
// and leans slightly right, like smoke catching a breeze
function wispPath(height, { amp, freq, phase }) {
  const cx = SMOKE_W / 2;
  const pts = [];
  for (let y = height; y >= 0; y -= 6) {
    const t = (height - y) / height; // 0 at the joint, 1 at the top
    const spread = Math.pow(t, 0.75);
    const x = cx + amp * spread * Math.sin(freq * t * Math.PI * 2 + phase) + 9 * t;
    pts.push([x, y]);
  }
  // smooth curve through the points (quadratic segments via midpoints)
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${pts[i][0]},${pts[i][1]} ${mx},${my}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${last[0]},${last[1]}`;
}

// Smoke rising from (x, y) for `rise` pixels, fading out as it goes
export function Smoke({ x, y, rise }) {
  const height = Math.max(40, rise);
  const flow = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // dashes flowing up the wisps
    const flowLoop = Animated.loop(
      Animated.timing(flow, { toValue: 1, duration: FLOW_MS, easing: Easing.linear, useNativeDriver: false })
    );
    // the whole trail sways slowly, like it's trembling in the air
    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: -1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    flowLoop.start();
    driftLoop.start();
    return () => {
      flowLoop.stop();
      driftLoop.stop();
    };
  }, []);

  const paths = useMemo(
    () => ({
      wisps: WISPS.map((w) => wispPath(height, w)),
      haze: HAZE.map((h) => wispPath(height, h)),
    }),
    [height]
  );

  const sway = drift.interpolate({ inputRange: [-1, 1], outputRange: ['-2.5deg', '2.5deg'] });

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: x - SMOKE_W / 2, top: y - height, width: SMOKE_W, height }}
    >
      <Animated.View style={{ flex: 1, transformOrigin: 'bottom', transform: [{ rotate: sway }] }}>
        <Svg width={SMOKE_W} height={height}>
          <Defs>
            {/* bright near the joint, fading to nothing by the top */}
            <LinearGradient id="smokeFade" x1="0" y1={height} x2="0" y2="0" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#e6e9f2" stopOpacity="0.7" />
              <Stop offset="0.35" stopColor="#d7dbe7" stopOpacity="0.45" />
              <Stop offset="0.75" stopColor="#c9cedc" stopOpacity="0.15" />
              <Stop offset="1" stopColor="#c9cedc" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {paths.haze.map((d, i) => (
            <Path
              key={`h${i}`}
              d={d}
              fill="none"
              stroke="url(#smokeFade)"
              strokeWidth={HAZE[i].width}
              strokeOpacity={HAZE[i].opacity}
              strokeLinecap="round"
            />
          ))}

          {paths.wisps.map((d, i) => {
            const w = WISPS[i];
            const period = w.dash[0] + w.dash[1];
            return (
              <AnimatedPath
                key={`w${i}`}
                d={d}
                fill="none"
                stroke="url(#smokeFade)"
                strokeWidth={w.width}
                strokeOpacity={w.opacity}
                strokeLinecap="round"
                strokeDasharray={w.dash}
                // moving the dash offset makes the breaks travel up the wisp (the path starts at
                // the joint); a whole number of periods per loop keeps it seamless
                strokeDashoffset={flow.interpolate({ inputRange: [0, 1], outputRange: [0, -period * w.speed] })}
              />
            );
          })}
        </Svg>
      </Animated.View>
    </View>
  );
}
