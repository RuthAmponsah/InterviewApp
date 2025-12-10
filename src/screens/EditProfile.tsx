import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import PrimaryButton from "../components/PrimaryButton";
import BackButton from "../components/BackButton";
import TextInputField from "../components/TextInputField";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

export default function EditProfile({ navigation }: any) {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const storedName = await AsyncStorage.getItem("userName");
      const storedEmail = await AsyncStorage.getItem("userEmail");
      const storedPhone = await AsyncStorage.getItem("userPhone");
      const storedBio = await AsyncStorage.getItem("userBio");
      const storedGender = await AsyncStorage.getItem("userGender");
      const storedAge = await AsyncStorage.getItem("userAge");
      const storedPhoto = await AsyncStorage.getItem("userProfilePhoto");

      if (storedName) setName(storedName);
      if (storedEmail) setEmail(storedEmail);
      if (storedPhone) setPhone(storedPhone);
      if (storedBio) setBio(storedBio);
      if (storedGender) setGender(storedGender);
      if (storedAge) setAge(storedAge);
      if (storedPhoto) setProfilePhoto(storedPhoto);
    };

    loadProfile();
  }, []);

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photos to change your profile picture."
      );
      return;
    }

    // Launch picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    if (!name) {
      Alert.alert("Error", "Name is required.");
      return;
    }

    setLoading(true);

    // Save all fields
    await AsyncStorage.setItem("userName", name);
    await AsyncStorage.setItem("userEmail", email);
    await AsyncStorage.setItem("userPhone", phone);
    await AsyncStorage.setItem("userBio", bio);
    await AsyncStorage.setItem("userGender", gender);
    await AsyncStorage.setItem("userAge", age);
    if (profilePhoto) {
      await AsyncStorage.setItem("userProfilePhoto", profilePhoto);
    }

    setLoading(false);
    Alert.alert("Success", "Your profile has been updated.");
    navigation.goBack();
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

        <Text style={styles.title}>Edit profile</Text>
        <Text style={styles.subtitle}>
          Update your personal information and preferences.
        </Text>

        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoCircle} onPress={pickImage}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.photoImage} />
            ) : (
              <Ionicons name="person" size={40} color={colors.textMuted} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.photoLink}>Change photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <TextInputField
            label="Full name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <TextInputField
            label="Email address"
            placeholder="your.email@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />

          <TextInputField
            label="Phone number"
            placeholder="+44 123 456 7890"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            returnKeyType="next"
          />

          <View style={styles.row}>
            <View style={styles.rowHalf}>
              <TextInputField
                label="Gender (F/M)"
                placeholder="F or M"
                value={gender}
                onChangeText={setGender}
                maxLength={1}
                returnKeyType="next"
              />
            </View>

            <View style={styles.rowHalf}>
              <TextInputField
                label="Age"
                placeholder="25"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
          </View>

          <TextInputField
            label="Bio (optional)"
            placeholder="Tell us a bit about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            returnKeyType="done"
          />

          <PrimaryButton
            title="Save changes"
            onPress={saveProfile}
            loading={loading}
            disabled={!name}
          />
        </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

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
      marginBottom: 20,
    },
    photoSection: {
      alignItems: "center",
      marginBottom: 24,
    },
    photoCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: isDark ? "#2a2a2a" : "#E5E7EB",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      borderWidth: 2,
      borderColor: isDark ? "#444" : "#D1D5DB",
      overflow: "hidden",
    },
    photoImage: {
      width: 100,
      height: 100,
    },
    photoLink: {
      ...typography.label,
      color: colors.primaryBlue,
      fontWeight: "600",
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
    row: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 4,
    },
    rowHalf: {
      flex: 1,
    },
  });
