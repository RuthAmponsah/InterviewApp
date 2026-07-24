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
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active || reduceMotion) {
      pulse.setValue(0.35);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [active, pulse, reduceMotion]);

  const barLift = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });
  const middleLift = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [-1, -5],
  });
  const barOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.42, 0.88],
  });

  return (
    <View
      style={[
        styles.root,
        { width: size + 2, height: size },
      ]}
      pointerEvents="none"
    >
      {[0.42, 0.7, 0.52].map((heightScale, index) => (
        <Animated.View
          key={heightScale}
          style={[
            styles.bar,
            {
              width: Math.max(2, size * 0.14),
              height: size * heightScale,
              borderRadius: size,
              backgroundColor: colors.primaryBlue,
              opacity: barOpacity,
              transform: [
                {
                  translateY: index === 1 ? middleLift : barLift,
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bar: {
    alignSelf: "center",
  },
});
