import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

type AyaPresenceIndicatorProps = {
  size?: number;
  active?: boolean;
  reduceMotion?: boolean;
};

export default function AyaPresenceIndicator({
  size = 18,
  active = true,
  reduceMotion = false,
}: AyaPresenceIndicatorProps) {
  const { colors } = useTheme();
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active || reduceMotion) {
      breath.setValue(0.35);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [active, breath, reduceMotion]);

  const outerScale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1.16],
  });
  const innerScale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.78],
  });
  const outerOpacity = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.16, 0.28],
  });

  return (
    <View
      style={[
        styles.root,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.outer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.primaryBlue,
            opacity: outerOpacity,
            transform: [{ scale: outerScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.inner,
          {
            width: size * 0.52,
            height: size * 0.52,
            borderRadius: (size * 0.52) / 2,
            backgroundColor: colors.primaryBlue,
            transform: [{ scale: innerScale }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
  },
  outer: {
    position: "absolute",
  },
  inner: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
});
