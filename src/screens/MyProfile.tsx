import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PrimaryButton from "../components/PrimaryButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import BackButton from "../components/BackButton";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from "../config/supabase";

// ⭐ FIX: Add proper navigation typing
type ProfileNav = NativeStackNavigationProp<RootStackParamList, "MyProfile">;

export default function MyProfile() {
  // ⭐ FIX: Tell TypeScript this screen belongs to RootStackParamList
  const navigation = useNavigation<ProfileNav>();
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);

  const [name, setName] = useState("User");
  const [email, setEmail] = useState("ruthrocwel@example.com");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Load saved profile data from storage and Supabase
  const loadProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      
      if (userId) {
        // Fetch latest data from Supabase
        const { data, error } = await supabase
          .from('users')
          .select('name, email, profile_photo')
          .eq('id', userId)
          .single();

        if (data) {
          setName(data.name);
          setEmail(data.email);
          if (data.profile_photo) {
            setProfilePhoto(data.profile_photo);
            await AsyncStorage.setItem("userProfilePhoto", data.profile_photo);
          }
        }
      }

      // Fallback to AsyncStorage if offline
      const storedName = await AsyncStorage.getItem("userName");
      const storedEmail = await AsyncStorage.getItem("userEmail");
      const storedPhoto = await AsyncStorage.getItem("userProfilePhoto");
      
      if (!name && storedName) setName(storedName);
      if (!email && storedEmail) setEmail(storedEmail);
      if (!profilePhoto && storedPhoto) setProfilePhoto(storedPhoto);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Reload profile when screen comes into focus (after editing)
  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  return (
    <View style={styles.container}>
        <BackButton />
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={50} color={colors.textMuted} />
          )}
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      {/* Options Section */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Text style={styles.rowText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate("ChangePassword")}
        >
          <Text style={styles.rowText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate("Notifications")}
        >
          <Text style={styles.rowText}>Notifications</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <PrimaryButton
        title="Log out"
        onPress={async () => {
          // Only clear login status, keep user data
          await AsyncStorage.setItem("isLoggedIn", "false");
          navigation.replace("SignIn");    // Go to sign-in & block back navigation
        }}
      />
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 22,
      paddingTop: 80,
      backgroundColor: isDark ? "#0f0f0f" : "#F2F4F7",
    },

    /* Header */
    header: {
      alignItems: "center",
      marginBottom: 30,
    },
    avatar: {
      width: 110,
      height: 110,
      borderRadius: 55,
      marginBottom: 12,
      backgroundColor: isDark ? "#2a2a2a" : "#E5E7EB",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: isDark ? "#444" : "#D1D5DB",
      overflow: "hidden",
    },
    avatarImage: {
      width: 110,
      height: 110,
    },
    name: {
      ...typography.headingMedium,
      marginBottom: 4,
      color: isDark ? "#fff" : "#111",
    },
    email: {
      ...typography.label,
      color: isDark ? "#b5b5b5" : "#666",
    },

    /* Options Card */
    card: {
      backgroundColor: isDark ? "#1d1d1d" : "#fff",
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 25,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E6E6E6",
    },

    row: {
      paddingVertical: 16,
      borderBottomColor: isDark ? "#333" : "#E6E6E6",
      borderBottomWidth: 1,
    },
    rowText: {
      ...typography.bodyMedium,
      fontWeight: "500",
      color: isDark ? "#fff" : "#333",
    },
  });
