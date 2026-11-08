import React, { useEffect, useMemo, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { seededRandom } from './seededRandom';

const STATIC_STARS = 70;
const TWINKLE_STARS = 22;

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
function NightSky({ width, height }) {
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
    return { stars, twinklers };
  }, [width, height]);

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
