import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
} from 'react-native';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const { width } = Dimensions.get('window');

const NAVY = '#1C3A6B';
const WHITE = '#FFFFFF';

interface LaunchAnimationProps {
  onFinish: () => void;
  duration?: number;
}

const LaunchAnimation: React.FC<LaunchAnimationProps> = ({ onFinish, duration = 2900 }) => {
  const circleScale = useRef(new Animated.Value(0)).current;
  const circleOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const playerRef = useRef<AudioPlayer | null>(null);
  const time = (milliseconds: number) => Math.round(milliseconds * (duration / 2400));

  useEffect(() => {
    const playWoosh = async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true });
        const player = createAudioPlayer(require('../../assets/sounds/woosh.mp3'));
        player.volume = 0.025;
        playerRef.current = player;
        player.play();
      } catch (error) {
        console.log('Error playing launch woosh:', error);
      }
    };

    playWoosh();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(circleScale, {
          toValue: 1,
          duration: time(400),
          useNativeDriver: true,
        }),
        Animated.timing(circleOpacity, {
          toValue: 1,
          duration: time(300),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: time(400),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: time(400),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: time(300),
        useNativeDriver: true,
      }),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: time(250),
        useNativeDriver: true,
      }),
      Animated.delay(time(700)),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: time(350),
        useNativeDriver: true,
      }),
    ]).start(onFinish);
  }, [
    circleOpacity,
    circleScale,
    duration,
    logoOpacity,
    logoScale,
    onFinish,
    screenOpacity,
    subtitleOpacity,
    textOpacity,
  ]);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />
      <Animated.View
        style={[
          styles.circle,
          {
            opacity: circleOpacity,
            transform: [{ scale: circleScale }],
          },
        ]}
      >
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }}
        >
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>

      <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
        MY INTERVIEW
      </Animated.Text>
      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        AI Interview Coach
      </Animated.Text>
    </Animated.View>
  );
};

const CIRCLE_SIZE = Math.min(width * 0.62, 260);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 160,
    height: 160,
  },
  title: {
    marginTop: 32,
    color: WHITE,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 3,
  },
  subtitle: {
    marginTop: 8,
    color: '#8BB4DC',
    fontSize: 14,
    letterSpacing: 1,
  },
});

export default LaunchAnimation;
