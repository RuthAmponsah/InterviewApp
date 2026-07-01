import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

// Preload sound globally for instant playback
let cachedPlayer: AudioPlayer | null = null;
let audioReady = false;

const loadSound = async () => {
  if (!cachedPlayer) {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
      });
      cachedPlayer = createAudioPlayer(require('../../assets/sounds/pop.mp3'));
      cachedPlayer.volume = 0.009;
      audioReady = true;
      console.log('🔊 Pop sound loaded successfully');
    } catch (error) {
      console.log('Failed to load pop sound:', error);
    }
  }
};

// Load sound on module init
loadSound();

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "outline";
  playSound?: boolean;
}

const PrimaryButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  playSound = true,
}: ButtonProps) => {
  const { colors } = useTheme();
  const isPrimary = variant === "primary";

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (playSound && cachedPlayer && audioReady) {
      try {
        await cachedPlayer.seekTo(0);
        cachedPlayer.play();
        console.log('🔊 Pop sound played');
      } catch (error) {
        // Silently fail if sound doesn't play
        console.log('Sound play error:', error);
      }
    } else if (playSound && !audioReady) {
      // Try to load sound if not ready
      await loadSound();
    }
    
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: isPrimary ? colors.primaryBlue : "transparent",
          borderColor: colors.primaryBlue },
        (disabled || loading) && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#FFFFFF" : colors.primaryBlue} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: isPrimary ? "#FFFFFF" : colors.primaryBlue },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 10,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.bodyMedium,
    fontWeight: "600",
  },
});

export default PrimaryButton;
