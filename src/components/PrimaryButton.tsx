import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "outline";
}

const PrimaryButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
}: ButtonProps) => {
  const { colors } = useTheme();  // ⭐ FIX
  const isPrimary = variant === "primary";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: isPrimary ? colors.primaryBlue : "transparent",
          borderColor: colors.primaryBlue },
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
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
