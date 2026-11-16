import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Path, Circle, Ellipse, Rect, G, Line } from 'react-native-svg';

// A bearded, curly-haired hippie DJ sitting cross-legged with headphones and a joint,
// swaying side to side. Drawn in a 120 x 120 grid; his seat is the bottom centre.
export const HIPPIE_VIEW = 120;
// where the lit end of the joint is, so the smoke can start there
export const JOINT_TIP = { x: 84, y: 50 };

const INK = '#1c130c';
const SKIN = '#d8a47c';
const HAIR = '#3a2616';
const HAIR_LIGHT = '#563a22';
const RIM = '#8f9cc0'; // moonlight edge, matches the island

const SWAY_DEG = 4;
const SWAY_MS = 1700;

// curls that make up the big head of hair (cx, cy, r)
const CURLS = [
  [42, 40, 8], [44, 30, 9], [50, 22, 9], [59, 18, 9], [68, 20, 9], [76, 27, 8],
  [79, 37, 7], [40, 50, 8], [43, 59, 7], [78, 46, 6], [55, 15, 6], [66, 14, 6],
];

function HippieArt({ size }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${HIPPIE_VIEW} ${HIPPIE_VIEW}`}>
      {/* moonlight rim around the whole silhouette */}
      <G opacity={0.55}>
        <Path d="M16,118 C18,98 42,94 60,96 C78,94 102,98 104,118 Z" fill="none" stroke={RIM} strokeWidth={5} />
        {CURLS.map(([x, y, r], i) => (
          <Circle key={i} cx={x} cy={y} r={r + 1.5} fill="none" stroke={RIM} strokeWidth={3} />
        ))}
      </G>

      {/* crossed legs (jeans) and bare feet */}
      <Path d="M16,118 C18,98 42,94 60,96 C78,94 102,98 104,118 Z" fill="#33467a" stroke={INK} strokeWidth={1.6} />
      <Path d="M30,108 C46,100 74,100 90,108" fill="none" stroke="#24345e" strokeWidth={1.5} />
      <Ellipse cx={34} cy={113} rx={7} ry={3.5} fill={SKIN} stroke={INK} strokeWidth={1.2} />
      <Ellipse cx={86} cy={113} rx={7} ry={3.5} fill={SKIN} stroke={INK} strokeWidth={1.2} />

      {/* back of the hair, behind the head */}
      {CURLS.map(([x, y, r], i) => (
        <Circle key={`h${i}`} cx={x} cy={y} r={r} fill={i % 3 ? HAIR : HAIR_LIGHT} />
      ))}

      {/* torso in a tie-dye-ish tee */}
      <Path d="M40,62 C46,58 74,58 80,62 L90,100 C76,104 44,104 30,100 Z" fill="#d9822b" stroke={INK} strokeWidth={1.6} />
      <Circle cx={52} cy={78} r={7} fill="#e4b23c" opacity={0.9} />
      <Circle cx={68} cy={86} r={6} fill="#b8478f" opacity={0.75} />
      <Circle cx={60} cy={72} r={4} fill="#3fa7a0" opacity={0.75} />

      {/* left arm resting on the knee */}
      <Path d="M42,64 C34,74 30,86 36,98" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <Path d="M42,64 C34,74 30,86 36,98" fill="none" stroke={SKIN} strokeWidth={6.5} strokeLinecap="round" />

      {/* head */}
      <Circle cx={60} cy={40} r={13} fill={SKIN} stroke={INK} strokeWidth={1.4} />

      {/* curls framing the face */}
      <Circle cx={47} cy={34} r={6} fill={HAIR} />
      <Circle cx={73} cy={33} r={6} fill={HAIR} />
      <Circle cx={60} cy={25} r={7} fill={HAIR_LIGHT} />

      {/* full beard */}
      <Path
        d="M47,43 C47,52 52,62 60,64 C68,62 73,52 73,43 C69,48 64,50 60,50 C56,50 51,48 47,43 Z"
        fill={HAIR}
        stroke={INK}
        strokeWidth={1}
      />
      <Path d="M54,47 Q60,45 66,47" fill="none" stroke={HAIR_LIGHT} strokeWidth={2.2} strokeLinecap="round" />

      {/* round glasses */}
      <Circle cx={54} cy={39} r={4.6} fill="#cfe3ff" fillOpacity={0.25} stroke={INK} strokeWidth={1.5} />
      <Circle cx={66} cy={39} r={4.6} fill="#cfe3ff" fillOpacity={0.25} stroke={INK} strokeWidth={1.5} />
      <Line x1={58.6} y1={39} x2={61.4} y2={39} stroke={INK} strokeWidth={1.3} />

      {/* headphones */}
      <Path d="M44,42 C42,18 78,18 76,42" fill="none" stroke="#1b1b1b" strokeWidth={4} strokeLinecap="round" />
      <Rect x={38} y={36} width={9} height={14} rx={4} fill="#d8443a" stroke={INK} strokeWidth={1.3} />
      <Rect x={73} y={36} width={9} height={14} rx={4} fill="#d8443a" stroke={INK} strokeWidth={1.3} />

      {/* right arm raised, hand at the mouth with the joint */}
      <Path d="M78,64 C90,72 90,86 82,90 M82,90 C78,78 74,62 72,54" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <Path d="M78,64 C90,72 90,86 82,90 M82,90 C78,78 74,62 72,54" fill="none" stroke={SKIN} strokeWidth={6.5} strokeLinecap="round" />
      <Line x1={70} y1={54} x2={83} y2={50.5} stroke="#f2ede4" strokeWidth={2.6} strokeLinecap="round" />
      <Circle cx={JOINT_TIP.x} cy={JOINT_TIP.y} r={2} fill="#ff7a2a" />
      <Circle cx={JOINT_TIP.x} cy={JOINT_TIP.y} r={4} fill="#ff7a2a" opacity={0.35} />
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

// ---------- smoke rising from the joint toward the logo ----------
// Many small, faint, overlapping puffs read as a soft wisp rather than separate bubbles
const PUFFS = 16;
const PUFF_MS = 8000;

function Puff({ index, rise, size }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: PUFF_MS, easing: Easing.out(Easing.quad), useNativeDriver: true })
    );
    const timer = setTimeout(() => loop.start(), (index * PUFF_MS) / PUFFS);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, []);

  const drift = size * 0.9; // how far it wavers side to side
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: -size / 2,
        top: -size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#c9cedc',
        opacity: t.interpolate({ inputRange: [0, 0.06, 0.35, 0.75, 1], outputRange: [0, 0.2, 0.13, 0.05, 0] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -rise] }) },
          {
            translateX: t.interpolate({
              inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
              outputRange: [0, drift, -drift * 0.6, drift * 1.2, -drift * 0.4, drift * 0.8],
            }),
          },
          { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 4.5] }) },
        ],
      }}
    />
  );
}

// Smoke that starts at (x, y) and slowly trembles upward `rise` pixels, fading out
export function Smoke({ x, y, rise, puffSize = 10 }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x, top: y, width: 0, height: 0 }}>
      {Array.from({ length: PUFFS }, (_, i) => (
        <Puff key={i} index={i} rise={rise} size={puffSize} />
      ))}
    </View>
  );
}
