import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export default function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? '#333' : '#E5E7EB',
          opacity,
        },
        style,
      ]}
    />
  );
}

// Skeleton Card Component
export function SkeletonCard({ style }: { style?: any }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#1d1d1d' : '#fff' }, style]}>
      <Skeleton width="40%" height={14} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={18} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={14} />
      <Skeleton width="90%" height={14} style={{ marginTop: 6 }} />
    </View>
  );
}

// Skeleton List Item
export function SkeletonListItem({ style }: { style?: any }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={[styles.listItem, { backgroundColor: isDark ? '#1d1d1d' : '#fff' }, style]}>
      <View style={styles.listItemLeft}>
        <Skeleton width={50} height={50} borderRadius={25} />
      </View>
      <View style={styles.listItemRight}>
        <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="50%" height={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listItemLeft: {
    marginRight: 12,
  },
  listItemRight: {
    flex: 1,
  },
});
