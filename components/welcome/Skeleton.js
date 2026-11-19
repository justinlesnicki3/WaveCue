import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Path, Circle, Ellipse, G, Line, Rect } from 'react-native-svg';

// A chilled-out skeleton in a clean, smooth cartoon style: sitting on the sand, leaning back
// against the palm trunk with his legs stretched out, one knee up and an arm resting on it,
// wearing headphones. His head nods gently to the beat.
//
// Drawn in a SKELETON_VIEW_W x SKELETON_VIEW_H grid. The ground is at y = SKELETON_GROUND_Y and
// his back (the side that leans on the tree) is the left edge.
export const SKELETON_VIEW_W = 160;
export const SKELETON_VIEW_H = 110;
export const SKELETON_GROUND_Y = 104;

const BONE = '#f2ede1';
const BONE_SHADE = '#cfc6b3';
const INK = '#1c1a24';
const SOCKET = '#1c1a24';
const PHONES = '#2a2a33';
const PHONES_ACCENT = '#e0463c';
const RIM = '#8f9cc0'; // soft moonlight edge, same as the island

const NECK = { x: 25, y: 45 }; // the head nods around this point
const BEAT_MS = 500; // 120 BPM

// A cartoon bone between two points: rounded shaft with knobby ends
function Bone({ from, to, width = 4.6 }) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const knob = width * 0.72;
  return (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={width + 2.6} strokeLinecap="round" />
      <Circle cx={x1} cy={y1} r={knob + 1.3} fill={INK} />
      <Circle cx={x2} cy={y2} r={knob + 1.3} fill={INK} />
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={BONE} strokeWidth={width} strokeLinecap="round" />
      <Circle cx={x1} cy={y1} r={knob} fill={BONE} />
      <Circle cx={x2} cy={y2} r={knob} fill={BONE} />
    </G>
  );
}

// A few finger bones fanning out from a point
function Hand({ at, angleDeg, spread = 22, length = 6 }) {
  const fingers = [-1.5, -0.5, 0.5, 1.5].map((k) => {
    const a = ((angleDeg + k * (spread / 3)) * Math.PI) / 180;
    const l = length * (1 - Math.abs(k) * 0.12);
    return [at[0] + Math.cos(a) * l, at[1] + Math.sin(a) * l];
  });
  return (
    <G>
      {fingers.map(([x, y], i) => (
        <Line key={`o${i}`} x1={at[0]} y1={at[1]} x2={x} y2={y} stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
      ))}
      {fingers.map(([x, y], i) => (
        <Line key={`f${i}`} x1={at[0]} y1={at[1]} x2={x} y2={y} stroke={BONE} strokeWidth={1.6} strokeLinecap="round" />
      ))}
      <Circle cx={at[0]} cy={at[1]} r={3} fill={BONE} stroke={INK} strokeWidth={1.2} />
    </G>
  );
}

// A foot: a rounded heel with toes pointing along `angleDeg`
function Foot({ at, angleDeg }) {
  const a = (angleDeg * Math.PI) / 180;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const toe = [at[0] + ux * 11, at[1] + uy * 11];
  return (
    <G>
      <Line x1={at[0]} y1={at[1]} x2={toe[0]} y2={toe[1]} stroke={INK} strokeWidth={7.4} strokeLinecap="round" />
      <Line x1={at[0]} y1={at[1]} x2={toe[0]} y2={toe[1]} stroke={BONE} strokeWidth={4.8} strokeLinecap="round" />
      {/* toe gaps */}
      {[0.55, 0.75].map((t) => (
        <Line
          key={t}
          x1={at[0] + ux * 11 * t - uy * 2}
          y1={at[1] + uy * 11 * t + ux * 2}
          x2={at[0] + ux * 11 * (t + 0.08) + uy * 2}
          y2={at[1] + uy * 11 * (t + 0.08) - ux * 2}
          stroke={INK}
          strokeWidth={0.8}
          strokeLinecap="round"
        />
      ))}
    </G>
  );
}

function Body() {
  return (
    <G>
      {/* far arm, mostly behind the ribs, hand on the sand */}
      <Bone from={[27, 51]} to={[20, 75]} width={3.8} />
      <Bone from={[20, 75]} to={[26, 97]} width={3.4} />
      <Hand at={[26, 99]} angleDeg={20} />

      {/* far leg: knee up, foot flat on the sand */}
      <Bone from={[46, 93]} to={[76, 72]} width={5} />
      <Bone from={[76, 72]} to={[92, 99]} width={4.4} />
      <Foot at={[92, 100]} angleDeg={-8} />

      {/* spine from pelvis up to the neck, leaning back against the tree */}
      <Path d="M43,92 C39,80 31,62 25,45" fill="none" stroke={INK} strokeWidth={6.6} strokeLinecap="round" />
      <Path d="M43,92 C39,80 31,62 25,45" fill="none" stroke={BONE} strokeWidth={4} strokeLinecap="round" />
      {[0.15, 0.32, 0.5, 0.68, 0.85].map((t) => {
        // little vertebra notches along the spine
        const x = (1 - t) ** 3 * 43 + 3 * (1 - t) ** 2 * t * 39 + 3 * (1 - t) * t * t * 31 + t ** 3 * 25;
        const y = (1 - t) ** 3 * 92 + 3 * (1 - t) ** 2 * t * 80 + 3 * (1 - t) * t * t * 62 + t ** 3 * 45;
        return <Line key={t} x1={x - 2.2} y1={y + 0.6} x2={x + 2.2} y2={y - 0.6} stroke={INK} strokeWidth={0.9} />;
      })}

      {/* pelvis */}
      <Path
        d="M33,90 C33,84 40,82 45,86 C50,82 57,84 57,90 C57,96 51,100 45,98 C39,100 33,96 33,90 Z"
        fill={BONE}
        stroke={INK}
        strokeWidth={1.5}
      />
      <Ellipse cx={40} cy={91} rx={2.6} ry={2} fill={BONE_SHADE} />
      <Ellipse cx={50} cy={91} rx={2.6} ry={2} fill={BONE_SHADE} />

      {/* near leg: stretched out along the sand, foot up */}
      <Bone from={[50, 95]} to={[90, 97]} width={5.2} />
      <Bone from={[90, 97]} to={[127, 99]} width={4.6} />
      <Foot at={[129, 99]} angleDeg={-62} />

      {/* ribcage: a rounded cage tilted back with the spine */}
      <G transform="rotate(-24 33 66)">
        <Path
          d="M33,50 C46,50 50,60 49,68 C48,77 40,82 33,82 C26,82 18,77 17,68 C16,60 20,50 33,50 Z"
          fill={BONE}
          stroke={INK}
          strokeWidth={1.6}
        />
        {/* gaps between ribs */}
        {[58, 64, 70, 76].map((y, i) => (
          <Path
            key={y}
            d={`M${20 + i * 0.6},${y} Q33,${y + 4} ${46 - i * 0.6},${y}`}
            fill="none"
            stroke={SOCKET}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        ))}
        {/* sternum */}
        <Line x1={33} y1={53} x2={33} y2={74} stroke={INK} strokeWidth={1.3} />
      </G>

      {/* near arm: shoulder down to the elbow, hand resting on the raised knee */}
      <Bone from={[36, 52]} to={[52, 70]} width={4} />
      <Bone from={[52, 70]} to={[71, 70]} width={3.6} />
      <Hand at={[73, 70]} angleDeg={70} spread={26} />
    </G>
  );
}

function Head() {
  return (
    <G>
      {/* skull, facing a little to the right */}
      <Path
        d="M24,14 C35,14 40,22 39,31 C38.5,35 36,37 35,40 L33,44 C31,46 23,46 20,44 L17,40 C13,37 10,33 10,27 C10,19 16,14 24,14 Z"
        fill={BONE}
        stroke={INK}
        strokeWidth={1.6}
      />
      {/* cheek shading */}
      <Path d="M14,33 C16,38 19,41 22,42" fill="none" stroke={BONE_SHADE} strokeWidth={2} strokeLinecap="round" />
      {/* eye sockets (closed-eye vibe: soft rounded shapes) */}
      <Ellipse cx={24} cy={28} rx={3.8} ry={3.4} fill={SOCKET} />
      <Ellipse cx={33} cy={28} rx={3.2} ry={3.2} fill={SOCKET} />
      {/* nose */}
      <Path d="M29,33 L27.6,36.2 L30.4,36.2 Z" fill={SOCKET} />
      {/* teeth */}
      <Path d="M21,40 L33,40" stroke={INK} strokeWidth={1.1} />
      {[23.5, 26.5, 29.5].map((x) => (
        <Line key={x} x1={x} y1={38.6} x2={x} y2={42.6} stroke={INK} strokeWidth={0.9} />
      ))}

      {/* headphone band resting over the top of the skull */}
      <Path d="M10,30 C7,9 35,4 39,22" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <Path d="M10,30 C7,9 35,4 39,22" fill="none" stroke={PHONES} strokeWidth={3} strokeLinecap="round" />

      {/* near ear cup */}
      <Rect x={6} y={26} width={10} height={14} rx={4.5} fill={PHONES} stroke={INK} strokeWidth={1.4} />
      <Rect x={8.6} y={29} width={4.8} height={8} rx={2.4} fill={PHONES_ACCENT} />
      {/* far ear cup peeking out on the other side */}
      <Path d="M37,22 C41,22 42,28 39,31" fill={PHONES} stroke={INK} strokeWidth={1.2} />
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
  const origin = `${(NECK.x / SKELETON_VIEW_W) * 100}% ${(NECK.y / SKELETON_VIEW_H) * 100}%`;
  const viewBox = `0 0 ${SKELETON_VIEW_W} ${SKELETON_VIEW_H}`;

  return (
    <View style={{ width, height }} pointerEvents="none">
      {/* soft moonlight outline behind the whole figure so it reads on the dark scene */}
      <Svg width={width} height={height} viewBox={viewBox} style={{ position: 'absolute', opacity: 0.35 }}>
        <G stroke={RIM} strokeWidth={4} fill="none" strokeLinecap="round">
          <Path d="M43,92 C39,80 31,62 25,45" />
          <Path d="M50,95 L127,99" />
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
