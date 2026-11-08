import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Polygon,
  Line,
  Circle,
  G,
  Text as SvgText,
} from 'react-native-svg';
import { SHRIKHAND, measureText, textDescent } from './shrikhandMetrics';

export const SPOTLIGHT_COLORS = ['#ff2e88', '#00b8e6', '#ffb800', '#8c52ff', '#2fd157', '#ff5a1f'];

const INK = '#1a0b2e'; // outlines
const CREAM = '#fff4dc'; // letter fill

const HOLD_MS = 5000; // how long a beam rests on one DJ name
const DIM_MS = 350; // light dims before moving
const MOVE_MS = 1100; // glide to the next spot
const BRIGHTEN_MS = 450;
const MIN_MOVE_DEG = 12; // each new spot is at least this far from the last

// Darken (amount < 0) or lighten (amount > 0) a #rrggbb color
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// Split a DJ name into 1-3 balanced lines for the badge
function splitName(name) {
  const words = name.toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return words;
  // keep initials / tiny words ("J.", "P") on the same line as their neighbour
  if (words.length === 2) return words.some((w) => w.length <= 2) ? [words.join(' ')] : words;
  // 3+ words: two lines, balanced by character count
  let best = [words.join(' ')];
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const diff = Math.abs(a.length - b.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = [a, b];
    }
  }
  return best;
}

const LINE_GAP = 0.18; // gap between lines as a fraction of capital height
const TEXT_MARGIN = 8; // room inside the circle for the outline + 3D shadow

// How far letters may be squeezed / stretched from their natural width
const MIN_SQUEEZE = 0.5;
const MAX_STRETCH = 1.15;

// Lay lines out to fill a circle, using Shrikhand's real letter widths. Each line is scaled
// horizontally to the circle's width at its narrowest point (top or bottom of its letters),
// which makes the block bulge like lettering on a round badge and guarantees nothing pokes
// out. Tries a range of text heights and keeps the one that fills the most of the circle
// without squeezing or stretching letters past the limits above.
export function layoutBadge(name, cx, cy, radius) {
  const lines = splitName(name);
  const R = radius - TEXT_MARGIN;
  const n = lines.length;
  const { capTop, overhang } = SHRIKHAND;

  let best = null;
  let leastSqueezed = null;
  for (let t = 0.2; t <= 1.95; t += 0.02) {
    const blockH = R * t;
    const capH = blockH / (n + (n - 1) * LINE_GAP);
    const fontSize = capH / capTop;
    let fits = true;
    let withinLimits = true;
    let minScale = Infinity;
    let area = 0;

    const laidOut = lines.map((text, i) => {
      const top = cy - blockH / 2 + i * capH * (1 + LINE_GAP);
      const baseline = top + capH;
      const bottom = baseline + textDescent(text) * fontSize;
      // a line's corners must stay inside the circle, so use the chord at its farther edge
      const edge = Math.max(Math.abs(top - cy), Math.abs(bottom - cy));
      if (edge >= R) fits = false;
      const chord = 2 * Math.sqrt(Math.max(0, R * R - edge * edge));
      // full ink width, including the slanted letters poking out on both ends
      const natural = (measureText(text) + 2 * overhang) * fontSize;
      const scaleX = Math.min(chord / natural, MAX_STRETCH);
      if (scaleX < MIN_SQUEEZE) withinLimits = false;
      minScale = Math.min(minScale, scaleX);
      area += natural * scaleX * capH;
      return { text, x: cx, y: baseline, fontSize, scaleX };
    });

    if (!fits) continue;
    if (withinLimits && (!best || area > best.area)) best = { area, laidOut };
    // if a name is too long to ever meet MIN_SQUEEZE, use whichever size squeezes it least
    if (!leastSqueezed || minScale > leastSqueezed.minScale) leastSqueezed = { minScale, laidOut };
  }
  return (best ?? leastSqueezed)?.laidOut ?? [];
}

// Lettering is positioned with a plain transform (works the same on iOS, Android and web)
// rather than SVG textLength, which Android doesn't apply reliably.
function BadgeText({ lines, shadowColor, fontFamily }) {
  if (!fontFamily) return null; // widths are measured for Shrikhand; wait until it's loaded
  const layer = (keyPrefix, dx, dy, props) =>
    lines.map((l, i) => (
      <G key={`${keyPrefix}${i}`} transform={`translate(${l.x + dx} ${l.y + dy}) scale(${l.scaleX} 1)`}>
        <SvgText x={0} y={0} fontSize={l.fontSize} fontFamily={fontFamily} textAnchor="middle" {...props}>
          {l.text}
        </SvgText>
      </G>
    ));
  return (
    <>
      {layer('s', 2.5, 3, { fill: shadowColor, stroke: shadowColor, strokeWidth: 4, strokeLinejoin: 'round' })}
      {layer('o', 0, 0, { fill: INK, stroke: INK, strokeWidth: 4.5, strokeLinejoin: 'round' })}
      {layer('f', 0, 0, { fill: CREAM })}
    </>
  );
}

// A searchlight on a rooftop at (originX, originY). It holds on a spot for HOLD_MS showing a
// DJ name in a round badge, then dims, glides to a new spot and lights up in a new color.
// `sharedSpots` is shared between beams so they don't land on top of each other.
function Spotlight({
  id,
  originX,
  originY,
  length,
  minDeg,
  maxDeg,
  screenWidth,
  sharedSpots,
  colorOffset = 0,
  startDelay = 0,
  fontFamily,
  pickName,
}) {
  const ownSpots = useRef({}).current;
  const spots = sharedSpots ?? ownSpots;

  const radius = Math.min(length * 0.26, 58); // the circle of light at the end of the beam
  const viewW = radius * 2 + 8;
  const cx = viewW / 2;
  const discY = radius + 4; // disc centre, measured from the top of the view
  const reach = length - discY; // distance from the lamp to the disc centre

  // Keep the whole disc on screen
  let lo = Math.min(minDeg, maxDeg);
  let hi = Math.max(minDeg, maxDeg);
  if (screenWidth) {
    const margin = radius + 6;
    const limit = (room) => (Math.asin(Math.min(1, Math.max(0, room) / reach)) * 180) / Math.PI;
    lo = Math.max(lo, -limit(originX - margin));
    hi = Math.min(hi, limit(screenWidth - originX - margin));
  }

  const discXAt = (deg) => originX + Math.sin((deg * Math.PI) / 180) * reach;

  // New angle: at least MIN_MOVE_DEG from our last spot, with our disc clear of the other
  // beam's. Checks every degree in range and picks randomly among the clear ones; if none are
  // clear (narrow screens), takes the one furthest from the other disc.
  const pickAngle = (current) => {
    const others = Object.entries(spots)
      .filter(([key]) => key !== id)
      .map(([, x]) => x);
    const gapAt = (deg) =>
      others.length ? Math.min(...others.map((x) => Math.abs(x - discXAt(deg)))) : Infinity;

    const candidates = [];
    for (let deg = lo; deg <= hi + 0.001; deg += 1) {
      if (current == null || Math.abs(deg - current) >= MIN_MOVE_DEG) candidates.push(deg);
    }
    if (candidates.length === 0) candidates.push(lo, hi);

    const clear = candidates.filter((deg) => gapAt(deg) > radius * 2.3);
    const deg = clear.length
      ? clear[Math.floor(Math.random() * clear.length)]
      : candidates.reduce((a, b) => (gapAt(b) > gapAt(a) ? b : a));

    spots[id] = discXAt(deg);
    return deg;
  };

  const [colorIndex, setColorIndex] = useState(colorOffset % SPOTLIGHT_COLORS.length);
  const [name, setName] = useState(() => pickName(id));
  const color = SPOTLIGHT_COLORS[colorIndex];
  const dark = shade(color, -0.45);

  const currentDeg = useRef(null);
  if (currentDeg.current == null) currentDeg.current = pickAngle(null);

  const angle = useRef(new Animated.Value(currentDeg.current)).current;
  const light = useRef(new Animated.Value(1)).current; // 1 = fully on, 0 = dimmed

  useEffect(() => {
    let cancelled = false;
    let timer;

    const moveToNextSpot = () => {
      Animated.timing(light, { toValue: 0, duration: DIM_MS, useNativeDriver: true }).start(() => {
        if (cancelled) return;
        const nextDeg = pickAngle(currentDeg.current);
        currentDeg.current = nextDeg;
        setColorIndex((i) => (i + 1) % SPOTLIGHT_COLORS.length);
        setName(pickName(id));

        Animated.sequence([
          Animated.timing(angle, {
            toValue: nextDeg,
            duration: MOVE_MS,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(light, { toValue: 1, duration: BRIGHTEN_MS, useNativeDriver: true }),
        ]).start(() => {
          if (cancelled) return;
          timer = setTimeout(moveToNextSpot, HOLD_MS);
        });
      });
    };

    timer = setTimeout(moveToNextSpot, HOLD_MS + startDelay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      angle.stopAnimation();
      light.stopAnimation();
    };
  }, []);

  const rotate = angle.interpolate({ inputRange: [-90, 90], outputRange: ['-90deg', '90deg'] });
  const beamOpacity = light.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  // Cone: from a narrow lamp at the bottom out to the sides of the disc
  const base = 4;
  const left = [cx - base, length];
  const right = [cx + base, length];
  const topL = [cx - radius, discY];
  const topR = [cx + radius, discY];
  const lines = layoutBadge(name, cx, discY, radius);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: originX - cx,
        top: originY - length,
        width: viewW,
        height: length,
        transformOrigin: 'bottom',
        transform: [{ rotate }],
      }}
    >
      {/* beam + disc (dims while moving) */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: beamOpacity }]}>
        <Svg width={viewW} height={length}>
          <Defs>
            <LinearGradient id={`cone-${id}`} x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0" stopColor={color} stopOpacity="0.75" />
              <Stop offset="1" stopColor={color} stopOpacity="0.38" />
            </LinearGradient>
          </Defs>

          {/* hazy, see-through cone with crisp edges */}
          <Polygon points={`${left} ${right} ${topR} ${topL}`} fill={`url(#cone-${id})`} />
          <Polygon
            points={`${cx - 1.5},${length} ${cx + 1.5},${length} ${cx + radius * 0.4},${discY} ${cx - radius * 0.4},${discY}`}
            fill="#ffffff"
            opacity={0.1}
          />
          <Line x1={left[0]} y1={left[1]} x2={topL[0]} y2={topL[1]} stroke={shade(color, 0.35)} strokeWidth={1.5} />
          <Line x1={right[0]} y1={right[1]} x2={topR[0]} y2={topR[1]} stroke={shade(color, 0.35)} strokeWidth={1.5} />

          {/* the circle of light */}
          <Circle cx={cx} cy={discY} r={radius} fill={color} />
        </Svg>
      </Animated.View>

      {/* DJ name lettering (hidden while moving) */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: light }]}>
        <Svg width={viewW} height={length}>
          <BadgeText lines={lines} shadowColor={dark} fontFamily={fontFamily} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

export default Spotlight;
