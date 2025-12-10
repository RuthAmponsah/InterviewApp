import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BackButton from "../components/BackButton";
import TextInputField from "../components/TextInputField";
import PrimaryButton from "../components/PrimaryButton";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

const ChangePassword: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirmation do not match.");
      return;
    }

    // TODO: Add real password validation against stored password
    setLoading(true);

    // Simulate API call
    setTimeout(async () => {
      // Save new password (in real app, this would go to backend)
      await AsyncStorage.setItem("userPassword", newPassword);

      setLoading(false);
      Alert.alert("Success", "Your password has been updated successfully.");

      // Clear fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 700);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <ScrollView
            style={styles.root}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
        <BackButton />

        <Text style={styles.logoText}>MY INTERVIEW</Text>

        <Text style={styles.title}>Change password</Text>
        <Text style={styles.subtitle}>
          Choose a strong password to keep your account secure.
        </Text>

        <View style={styles.card}>
          <TextInputField
            label="Current password"
            placeholder="Enter current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            returnKeyType="next"
          />

          <TextInputField
            label="New password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            returnKeyType="next"
          />

          <Text style={styles.hintText}>
            Password must be at least 8 characters and include 1 special
            character.
          </Text>

          <TextInputField
            label="Confirm new password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            returnKeyType="done"
          />

          <PrimaryButton
            title="Update password"
            onPress={handleChangePassword}
            loading={loading}
            disabled={!currentPassword || !newPassword || !confirmPassword}
          />
        </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? "#0f0f0f" : "#F3F4F6",
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 80,
      paddingBottom: 32,
    },
    logoText: {
      ...typography.headingMedium,
      fontWeight: "800",
      color: colors.primaryBlue,
      alignSelf: "center",
      marginBottom: 24,
    },
    title: {
      ...typography.headingMedium,
      color: isDark ? "#fff" : colors.textDark,
    },
    subtitle: {
      ...typography.bodyMedium,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginTop: 4,
      marginBottom: 16,
    },
    card: {
      backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
      borderRadius: 20,
      padding: 16,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E5E7EB",
    },
    hintText: {
      ...typography.caption,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginTop: 4,
      marginBottom: 12,
    },
  });

export default ChangePassword;
