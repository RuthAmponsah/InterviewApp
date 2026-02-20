import React from 'react';
import { View, TextInput, StyleSheet, Text, TextInputProps } from 'react-native';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

interface InputProps extends TextInputProps {
  label?: string;
}

const TextInputField = ({ label, style, ...rest }: InputProps) => {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: isDark ? "#b5b5b5" : "#333" }]}>
          {label}
        </Text>
      )}

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: isDark ? "#1d1d1d" : "#F4F4F4",
            borderColor: isDark ? "#333" : "#e0e0e0",
            color: colors.textDark,
          },
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primaryBlue}
        {...rest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    ...typography.label,
    marginBottom: 6,
    color: '#333',
  },
  input: {
    ...typography.bodyMedium,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});

export default TextInputField;
