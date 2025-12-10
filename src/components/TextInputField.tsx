import React from 'react';
import { View, TextInput, StyleSheet, Text, TextInputProps } from 'react-native';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

interface InputProps extends TextInputProps {
  label?: string;
}

const TextInputField = ({ label, style, ...rest }: InputProps) => {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.textMuted}
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
