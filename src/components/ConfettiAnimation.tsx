import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Animated, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  color: string;
  size: number;
  startX: number;
}

interface ConfettiAnimationProps {
  visible: boolean;
  duration?: number;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#FFE66D', '#FF9F43', '#A855F7', '#1E63FF'];

const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({ visible, duration = 3000 }) => {
  const pieces = useRef<ConfettiPiece[]>([]);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Create confetti pieces
      pieces.current = Array.from({ length: 50 }, (_, i) => {
        const startX = Math.random() * width;
        return {
          id: i,
          x: new Animated.Value(startX),
          y: new Animated.Value(-50),
          rotation: new Animated.Value(0),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 8 + 6,
          startX,
        };
      });

      // Animate each piece
      pieces.current.forEach((piece, index) => {
        const delay = Math.random() * 500;
        const fallDuration = duration + Math.random() * 1000;

        Animated.parallel([
          Animated.timing(piece.y, {
            toValue: height + 100,
            duration: fallDuration,
            delay,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
          Animated.timing(piece.x, {
            toValue: piece.startX + (Math.random() - 0.5) * 200,
            duration: fallDuration,
            delay,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.timing(piece.rotation, {
              toValue: 1,
              duration: 1000 + Math.random() * 500,
              easing: Easing.linear,
              useNativeDriver: true,
            })
          ),
        ]).start();
      });

      // Fade out at the end
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        delay: duration - 500,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
      {pieces.current.map((piece) => (
        <Animated.View
          key={piece.id}
          style={[
            styles.piece,
            {
              width: piece.size,
              height: piece.size * 1.5,
              backgroundColor: piece.color,
              borderRadius: piece.size / 4,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                {
                  rotate: piece.rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  piece: {
    position: 'absolute',
  },
});

export default ConfettiAnimation;
