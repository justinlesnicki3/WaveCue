import React, { useEffect, useMemo, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { seededRandom } from './seededRandom';

const STATIC_STARS = 70;
const TWINKLE_STARS = 22;
const AVOID_PAD = 10; // keep stars at least this far from text they'd sit behind

// true if (x, y) falls inside any of the boxes (plus padding)
function inAnyBox(x, y, boxes) {
  return boxes.some(
    (b) =>
      x >= b.x - AVOID_PAD &&
      x <= b.x + b.width + AVOID_PAD &&
      y >= b.y - AVOID_PAD &&
      y <= b.y + b.height + AVOID_PAD
  );
}

function TwinkleStar({ x, y, size, delay, duration }) {
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.2, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#fff',
        opacity,
        shadowColor: '#cfe6ff',
        shadowOpacity: 1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 0 },
      }}
    />
  );
}

// Pitch-black sky with a field of stars, some of which twinkle.
// `avoid` (optional): boxes { x, y, width, height } in this sky's coordinates where no star
// should appear, e.g. behind a screen title so the stars don't make the letters hard to read.
function NightSky({ width, height, avoid = [] }) {
  const avoidKey = JSON.stringify(avoid);
  const { stars, twinklers } = useMemo(() => {
    const rand = seededRandom(7);
    const stars = Array.from({ length: STATIC_STARS }, () => ({
      x: rand() * width,
      y: rand() * height,
      r: 0.5 + rand() * 1.1,
      o: 0.35 + rand() * 0.6,
    }));
    const twinklers = Array.from({ length: TWINKLE_STARS }, () => ({
      x: rand() * width,
      y: rand() * height * 0.85,
      size: 2.5 + rand() * 2,
      delay: Math.floor(rand() * 3000),
      duration: 900 + Math.floor(rand() * 1400),
    }));
    // drop (rather than move) stars that would sit behind text, so the rest of the sky
    // keeps exactly the same layout
    return {
      stars: stars.filter((s) => !inAnyBox(s.x, s.y, avoid)),
      twinklers: twinklers.filter((t) => !inAnyBox(t.x, t.y, avoid)),
    };
  }, [width, height, avoidKey]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {stars.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />
        ))}
      </Svg>
      {twinklers.map((t, i) => (
        <TwinkleStar key={i} {...t} />
      ))}
    </View>
  );
}

export default React.memo(NightSky);
