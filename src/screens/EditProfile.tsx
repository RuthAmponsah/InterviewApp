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
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import PrimaryButton from "../components/PrimaryButton";
import BackButton from "../components/BackButton";
import TextInputField from "../components/TextInputField";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from "../config/supabase";
import SuccessAnimation from "../components/SuccessAnimation";

export default function EditProfile({ navigation }: any) {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const storedName = await AsyncStorage.getItem("userName");
      const storedEmail = await AsyncStorage.getItem("userEmail");
      const storedPhone = await AsyncStorage.getItem("userPhone");
      const storedBio = await AsyncStorage.getItem("userBio");
      const storedAge = await AsyncStorage.getItem("userAge");
      const storedPhoto = await AsyncStorage.getItem("userProfilePhoto");

      if (storedName) setName(storedName);
      if (storedEmail) setEmail(storedEmail);
      if (storedPhone) setPhone(storedPhone);
      if (storedBio) setBio(storedBio);
      if (storedAge) setAge(storedAge);
      if (storedPhoto) setProfilePhoto(storedPhoto);
    };

    loadProfile();
  }, []);

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setErrorMessage("Please allow access to your photos to change your profile picture.");
      setErrorVisible(true);
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
      // Upload immediately to Supabase
      await uploadProfilePhoto(result.assets[0].uri);
    }
  };

  const uploadProfilePhoto = async (uri: string) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      // Read file as base64 - this works properly in React Native
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      
      // Determine content type from file extension
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      console.log('📤 Uploading photo:', { filePath, contentType, base64Length: base64.length });

      // Convert base64 to ArrayBuffer and upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64), {
          contentType,
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setErrorMessage('Failed to upload photo. Please try again.');
        setErrorVisible(true);
        return;
      }

      console.log('✅ Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        console.log('📸 Generated public URL:', urlData.publicUrl);
        
        // Update database with photo URL
        const { error: updateError } = await supabase
          .from('users')
          .update({ profile_photo: urlData.publicUrl })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating profile_photo in DB:', updateError);
        } else {
          console.log('✅ Profile photo URL saved to database');
        }

        // Store in AsyncStorage
        await AsyncStorage.setItem("userProfilePhoto", urlData.publicUrl);
        
        console.log('✅ Photo uploaded successfully:', urlData.publicUrl);
        
        // Update local state
        setProfilePhoto(urlData.publicUrl);
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      setErrorMessage('Failed to upload photo.');
      setErrorVisible(true);
    }
  };

  const saveProfile = async () => {
    if (!name) {
      setErrorMessage("Name is required.");
      setErrorVisible(true);
      return;
    }

    setLoading(true);

    try {
      const userId = await AsyncStorage.getItem("userId");
      
      if (userId) {
        // Update Supabase database
        const { error } = await supabase
          .from('users')
          .update({
            name: name,
            phone: phone || null,
            bio: bio || null,
            age: age ? parseInt(age) : null,
          })
          .eq('id', userId);

        if (error) {
          console.error('Update error:', error);
          setErrorMessage("Failed to update profile in database.");
          setErrorVisible(true);
          setLoading(false);
          return;
        }
      }

      // Save to AsyncStorage for offline access
      await AsyncStorage.setItem("userName", name);
      await AsyncStorage.setItem("userEmail", email);
      await AsyncStorage.setItem("userPhone", phone);
      await AsyncStorage.setItem("userBio", bio);
      await AsyncStorage.setItem("userAge", age);
      if (profilePhoto) {
        await AsyncStorage.setItem("userProfilePhoto", profilePhoto);
      }

      setLoading(false);
      setShowSuccessAnimation(true);
    } catch (error) {
      setLoading(false);
      setErrorMessage("Something went wrong. Please try again.");
      setErrorVisible(true);
      console.error('Save profile error:', error);
    }
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

      {/* Success Animation */}
      <SuccessAnimation
        visible={showSuccessAnimation}
        message="Profile Updated!"
        icon="checkmark-circle"
        onComplete={() => {
          setShowSuccessAnimation(false);
          setTimeout(() => navigation.goBack(), 300);
        }}
      />

    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? '#0f0f0f' : '#F3F4F6',
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 70,
      paddingBottom: 32,
    },
    logoText: {
      ...typography.heading,
      fontWeight: '800',
      color: colors.primaryBlue,
      alignSelf: 'center',
      marginBottom: 28,
    },
    title: {
      ...typography.heading,
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 8,
    },
    subtitle: {
      ...typography.bodyMedium,
      color: colors.textMuted,
      marginBottom: 24,
      lineHeight: 22,
    },
    photoSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    photoCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: isDark ? '#2a2a2a' : '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
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
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalBox: {
      width: "85%",
      backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E5E7EB",
    },
    modalWarning: {
      fontSize: 20,
      fontWeight: "700",
      color: "#EF4444",
      marginBottom: 12,
    },
    modalSuccess: {
      color: "#10B981",
    },
    modalText: {
      ...typography.bodyMedium,
      color: isDark ? "#b5b5b5" : "#6B7280",
      textAlign: "center",
      marginBottom: 20,
    },
    modalButton: {
      width: "100%",
      backgroundColor: colors.primaryBlue,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    modalButtonText: {
      ...typography.label,
      color: "#FFFFFF",
      fontWeight: "600",
    },
  });
