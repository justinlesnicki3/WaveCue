import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';

const OUTLINE = '#0b1a36';
const FOAM = '#e6f4ff';

// ---------------------------------------------------------------------------
// Wave styles. Each one draws a single wave of length L and height H starting at
// (x, H) (calm water level) and ending at (x + L, H); y = 0 is the top of the crest.
//   top:   path segment for the wave's silhouette (continues the outline)
//   foam:  white cap shapes (clipped to the water body, so they can be generous)
//   lines: inner detail strokes
//   swirl: optional white spiral (barrel style)
// Sides use concave curves (control points low and close to the tip) so crests come
// to sharp points instead of rounded humps.
// ---------------------------------------------------------------------------

const pt = (x, L, H) => (fx, fy) => `${x + fx * L},${fy * H}`;

// Jagged mountain-like peaks (distant chop)
const peaks = {
  top(x, L, H) {
    const p = pt(x, L, H);
    // [valley x, valley y, peak x, peak y]
    const shape = [
      [0.04, 1, 0.2, 0.38],
      [0.3, 0.8, 0.44, 0],
      [0.56, 0.75, 0.68, 0.3],
      [0.84, 0.95, 1, 1], // last "peak" is the end valley
    ];
    let d = ` L${p(0.04, 1)}`;
    for (let i = 0; i < 3; i++) {
      const [vx, vy, px, py] = shape[i];
      const [nvx, nvy] = shape[i + 1];
      // straight-ish sides that pinch in near the tip: mountain peaks, narrow V valleys
      d += ` Q${p(px - (px - vx) * 0.35, py + (vy - py) * 0.35)} ${p(px, py)}`;
      d += ` Q${p(px + (nvx - px) * 0.35, py + (nvy - py) * 0.35)} ${p(nvx, nvy)}`;
    }
    d += ` L${p(1, 1)}`;
    return d;
  },
  foam(x, L, H) {
    const p = pt(x, L, H);
    return [
      [0.2, 0.38],
      [0.44, 0],
      [0.68, 0.3],
    ]
      .map(
        ([px, py]) =>
          `M${p(px - 0.1, py - 0.2)} L${p(px + 0.1, py - 0.2)} L${p(px + 0.055, py + 0.38)} ` +
          `L${p(px + 0.02, py + 0.24)} L${p(px - 0.012, py + 0.42)} L${p(px - 0.04, py + 0.26)} L${p(px - 0.07, py + 0.4)} Z`
      )
      .join(' ');
  },
  lines(x, L, H) {
    const p = pt(x, L, H);
    return `M${p(0.33, 1.35)} Q${p(0.4, 0.9)} ${p(0.43, 0.35)} M${p(0.58, 1.3)} Q${p(0.64, 0.95)} ${p(0.67, 0.6)}`;
  },
};

// Long, low rolling swell with a small curled tip and a second swell line inside (distant water)
const ripple = {
  top(x, L, H) {
    const p = pt(x, L, H);
    return (
      ` C${p(0.25, 1)} ${p(0.38, 0.3)} ${p(0.5, 0.08)}` + // long gentle rise
      ` Q${p(0.6, -0.05)} ${p(0.63, 0.48)}` + // small tip curling forward to a point
      ` Q${p(0.58, 0.28)} ${p(0.55, 0.55)}` + // sharp tuck under the tip
      ` C${p(0.6, 0.95)} ${p(0.8, 1)} ${p(1, 1)}` // long flat trough
    );
  },
  foam(x, L, H) {
    const p = pt(x, L, H);
    return (
      `M${p(0.4, -0.2)} L${p(0.68, -0.2)} L${p(0.63, 0.46)} L${p(0.6, 0.26)} L${p(0.57, 0.42)} ` +
      `L${p(0.535, 0.22)} L${p(0.5, 0.34)} L${p(0.47, 0.16)} L${p(0.44, 0.26)} Z`
    );
  },
  lines(x, L, H) {
    const p = pt(x, L, H);
    return (
      `M${p(0.08, 1.3)} C${p(0.3, 1.25)} ${p(0.45, 0.85)} ${p(0.52, 0.62)} ` + // swell line behind the crest
      `M${p(0.62, 1.2)} C${p(0.75, 1.35)} ${p(0.9, 1.25)} ${p(1.04, 1.18)}` // trailing line in the trough
    );
  },
};

// Sharp hooked curl with a pointed lip
const hook = {
  top(x, L, H) {
    const p = pt(x, L, H);
    return (
      ` C${p(0.3, 1)} ${p(0.45, 0.15)} ${p(0.6, 0)}` + // back slope up
      ` C${p(0.71, -0.03)} ${p(0.81, 0.16)} ${p(0.77, 0.52)}` + // over the top to a pointed lip
      ` Q${p(0.71, 0.3)} ${p(0.64, 0.5)}` + // sharp tuck back under the lip
      ` C${p(0.66, 0.86)} ${p(0.82, 1)} ${p(1, 1)}` // face down to calm water
    );
  },
  foam(x, L, H) {
    const p = pt(x, L, H);
    return (
      `M${p(0.45, -0.1)} L${p(0.85, -0.1)} L${p(0.8, 0.5)} L${p(0.745, 0.3)} L${p(0.71, 0.42)} ` +
      `L${p(0.675, 0.22)} L${p(0.62, 0.33)} L${p(0.575, 0.17)} L${p(0.52, 0.26)} L${p(0.47, 0.1)} Z`
    );
  },
  lines(x, L, H) {
    const p = pt(x, L, H);
    return `M${p(0.18, 1.35)} C${p(0.45, 1.2)} ${p(0.6, 0.9)} ${p(0.625, 0.56)}`;
  },
};

// Long low swell building to a tall crest whose sharp tip leans forward and spills over
const swell = {
  top(x, L, H) {
    const p = pt(x, L, H);
    return (
      ` C${p(0.3, 1)} ${p(0.5, 0.75)} ${p(0.6, 0.08)}` + // long rise up the back
      ` Q${p(0.66, -0.06)} ${p(0.76, 0.1)}` + // tip pitches forward past the face
      ` Q${p(0.69, 0.12)} ${p(0.665, 0.32)}` + // sharp underside of the tip
      ` Q${p(0.68, 0.75)} ${p(0.8, 0.84)}` + // steep face
      ` Q${p(0.85, 0.9)} ${p(0.87, 0.8)}` + // small spill curl at the foot
      ` Q${p(0.9, 1)} ${p(1, 1)}`
    );
  },
  foam(x, L, H) {
    const p = pt(x, L, H);
    return (
      `M${p(0.52, -0.2)} L${p(0.8, -0.2)} L${p(0.76, 0.12)} L${p(0.7, 0.3)} L${p(0.665, 0.2)} ` +
      `L${p(0.63, 0.4)} L${p(0.6, 0.24)} L${p(0.56, 0.36)} L${p(0.54, 0.2)} Z ` +
      `M${p(0.8, 0.7)} L${p(0.92, 0.7)} L${p(0.88, 0.94)} L${p(0.85, 0.84)} L${p(0.82, 0.96)} Z`
    );
  },
  lines(x, L, H) {
    const p = pt(x, L, H);
    return `M${p(0.12, 1.3)} C${p(0.4, 1.15)} ${p(0.56, 0.8)} ${p(0.62, 0.36)}`;
  },
};

// Big rolled barrel with a white spiral inside
const barrel = {
  top(x, L, H) {
    const p = pt(x, L, H);
    return (
      ` C${p(0.25, 1)} ${p(0.35, 0.04)} ${p(0.55, 0)}` + // back slope up
      ` C${p(0.73, -0.04)} ${p(0.82, 0.32)} ${p(0.74, 0.55)}` + // rolls over the top
      ` Q${p(0.68, 0.38)} ${p(0.6, 0.48)}` + // sharp tuck into the barrel
      ` C${p(0.6, 0.82)} ${p(0.78, 1)} ${p(1, 1)}` // face down to calm water
    );
  },
  foam(x, L, H) {
    const p = pt(x, L, H);
    return (
      `M${p(0.42, -0.1)} L${p(0.86, -0.1)} L${p(0.78, 0.5)} L${p(0.74, 0.24)} L${p(0.7, 0.3)} ` +
      `L${p(0.67, 0.12)} L${p(0.6, 0.18)} L${p(0.55, 0.08)} L${p(0.48, 0.14)} Z`
    );
  },
  lines(x, L, H) {
    const p = pt(x, L, H);
    return `M${p(0.15, 1.3)} C${p(0.4, 1.18)} ${p(0.52, 0.95)} ${p(0.56, 0.7)}`;
  },
  // Spiral made of shrinking half-circles, centred inside the barrel
  swirl(x, L, H) {
    const cx = x + 0.6 * L;
    const cy = 0.4 * H;
    const r = 0.2 * H;
    let d = `M${cx + r},${cy}`;
    let px = cx + r;
    let radius = r;
    for (let i = 0; i < 4; i++) {
      const nx = i % 2 === 0 ? px - 2 * radius : px + 2 * radius;
      d += ` A${radius},${radius} 0 0 0 ${nx},${cy}`;
      px = nx;
      radius *= 0.72;
    }
    return d;
  },
};

// Back (horizon) to front, each row in a different style. `top` is a fraction of the water
// height, `crest` the wave height in px. Wave counts are whole numbers so the strip loops
// seamlessly when it slides one screen width. Waves lean the way their row drifts (dir).
const LAYERS = [
  { style: ripple, top: 0.03, fill: '#2a78b5', crest: 16, waves: 3, duration: 18000, dir: -1 },
  { style: hook, top: 0.17, fill: '#1e7f9e', crest: 22, waves: 4, duration: 13000, dir: 1 },
  { style: swell, top: 0.4, fill: '#1b5a98', crest: 30, waves: 3, duration: 15000, dir: -1 },
  { style: barrel, top: 0.62, fill: '#0f3f70', crest: 44, waves: 2, duration: 19000, dir: 1 },
];

function buildPaths(style, stripW, waveLen, H, bodyH) {
  let top = `M0,${H}`;
  let foam = '';
  let lines = '';
  let swirl = '';
  for (let x = 0; x < stripW - 0.5; x += waveLen) {
    top += style.top(x, waveLen, H);
    foam += style.foam(x, waveLen, H) + ' ';
    lines += style.lines(x, waveLen, H) + ' ';
    if (style.swirl) swirl += style.swirl(x, waveLen, H) + ' ';
  }
  return { top, body: `${top} L${stripW},${bodyH} L0,${bodyH} Z`, foam, lines, swirl };
}

function WaveLayer({ index, width, waterHeight, layer }) {
  const shift = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const slide = Animated.loop(
      Animated.timing(shift, { toValue: 1, duration: layer.duration, easing: Easing.linear, useNativeDriver: true })
    );
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    slide.start();
    bobLoop.start();
    return () => {
      slide.stop();
      bobLoop.stop();
    };
  }, []);

  const stripW = width * 2;
  const waveLen = width / layer.waves;
  const H = layer.crest;
  const pad = 4; // room for the outline above the crest
  const top = waterHeight * layer.top;
  const h = waterHeight - top + pad + 8;

  const paths = buildPaths(layer.style, stripW, waveLen, H, h - pad);
  const clipId = `wave-body-${index}`;

  const translateX = shift.interpolate({
    inputRange: [0, 1],
    outputRange: layer.dir < 0 ? [0, -width] : [-width, 0],
  });
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, H * 0.12] });

  // Paths are drawn leaning right; mirror rows that drift left so they lean that way
  const mirror = layer.dir < 0 ? `translate(${stripW} ${pad}) scale(-1 1)` : `translate(0 ${pad})`;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        top: top - pad,
        width: stripW,
        height: h,
        transform: [{ translateX }, { translateY }],
      }}
    >
      <Svg width={stripW} height={h}>
        <G transform={mirror}>
          <Defs>
            <ClipPath id={clipId}>
              <Path d={paths.body} />
            </ClipPath>
          </Defs>
          <Path d={paths.body} fill={layer.fill} />
          <G clipPath={`url(#${clipId})`}>
            <Path d={paths.lines} fill="none" stroke={OUTLINE} strokeWidth={1.4} strokeLinecap="round" opacity={0.55} />
            <Path d={paths.foam} fill={FOAM} />
            {!!paths.swirl && (
              <Path d={paths.swirl} fill="none" stroke={FOAM} strokeWidth={3} strokeLinecap="round" />
            )}
          </G>
          <Path d={paths.top} fill="none" stroke={OUTLINE} strokeWidth={2} strokeLinejoin="miter" strokeMiterlimit={8} />
        </G>
      </Svg>
    </Animated.View>
  );
}

// Cartoon Lake Michigan: outlined waves with foam caps, a different style per row.
function LakeWaves({ width, height }) {
  return (
    <View style={[styles.water, { width, height }]} pointerEvents="none">
      {LAYERS.map((layer, i) => (
        <WaveLayer key={i} index={i} width={width} waterHeight={height} layer={layer} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  water: { overflow: 'hidden', backgroundColor: '#2f74b5' },
});

export default React.memo(LakeWaves);
