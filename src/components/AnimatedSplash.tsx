import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { Audio } from 'expo-av';

interface AnimatedSplashProps {
  onFinish: () => void;
}

const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onFinish }) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Play woosh sound
    playSound();

    // Sequence of animations
    Animated.sequence([
      // 1. Ink reveal effect - blob/splash appearing
      Animated.parallel([
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.sequence([
          // Quick expand (ink splash)
          Animated.spring(scaleAnim, {
            toValue: 1.15,
            tension: 80,
            friction: 3,
            useNativeDriver: true,
          }),
          // Settle back (ink absorbs)
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // 2. Wait before finishing
      Animated.delay(1000),
    ]).start(() => {
      onFinish();
    });
  }, []);

  const playSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/woosh.mp3'),
        { shouldPlay: true }
      );
      // Sound will auto-cleanup when component unmounts
    } catch (error) {
      console.log('Error playing sound:', error);
      // Continue without sound if file not found
    }
  };

  return (
    <Animated.View style={styles.container}>
      {/* Animated Icon */}
      <Animated.View
        style={{
          opacity: iconOpacity,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Image
          source={require('../../assets/icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  icon: {
    width: 250,
    height: 250,
  },
});

export default AnimatedSplash;
