import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { speakText, stopSpeaking } from "../services/aiService";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../theme/ThemeContext";

type Nav = NativeStackNavigationProp<RootStackParamList, "Welcome">;

const JOB_TYPES = [
  "Software Engineer",
  "Data Analyst",
  "Cyber Security",
  "IT Support",
  "Project Manager",
  "Sales",
  "Customer Service",
  "Marketing",
  "Accounting",
  "Finance",
  "Human Resources",
  "Healthcare",
  "Nursing",
  "Teaching",
  "Engineering",
  "Business Analyst",
  "Product Manager",
  "UX/UI Designer",
  "Graphic Designer",
  "Operations Manager",
  "Supply Chain",
  "Legal",
  "Architecture",
  "Consulting",
];

export default function Welcome() {
  const navigation = useNavigation<Nav>();
  const scrollRef = useRef<ScrollView>(null);
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  const hasSpokenRef = useRef(false);
  const { width } = useWindowDimensions();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("F");
  const [job, setJob] = useState("");
  const [isFocus, setIsFocus] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const page2Anim = useRef(new Animated.Value(0)).current;

  // ---------------------------------------------------
  // LOAD USER NAME + GENDER
  // ---------------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      const storedName = await AsyncStorage.getItem("userName");
      const storedGender = await AsyncStorage.getItem("userGender");
      if (storedName) setName(storedName);
      if (storedGender) setGender(storedGender);
      setDataLoaded(true);
    };
    loadData();
  }, []);

  // ---------------------------------------------------
  // PAGE 1 SPEECH → WAIT 1.5 SECONDS → SCROLL → READ PAGE 2 QUESTION
  // Wait for name to load before speaking
  // ---------------------------------------------------
  useEffect(() => {
    if (hasSpokenRef.current || !dataLoaded) return;
    hasSpokenRef.current = true;

    const displayName = name || "friend";
    const introText = `Hello there. My name is Aya. Nice to meet you ${displayName}. Welcome to your very own mock interview experience. Shall we get started?`;

    const speakIntro = async () => {
      await stopSpeaking();
      await speakText(introText);
      
      // Calculate approximate speech duration (average speaking rate is ~150 words per minute)
      const wordCount = introText.split(' ').length;
      const estimatedDuration = (wordCount / 150) * 60 * 1000; // Convert to milliseconds
      const waitTime = estimatedDuration + 2000; // Add 2 seconds buffer
      
      console.log(`Waiting ${waitTime}ms for speech to complete...`);
      
      // Wait for speech to finish before scrolling
      setTimeout(async () => {
        // Scroll to Page 2
        scrollRef.current?.scrollTo({ x: width, animated: true });

        Animated.timing(page2Anim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();

        // Wait for scroll animation to complete, then speak
        setTimeout(async () => {
          await speakText("What job role are you applying for?");
        }, 800);
      }, waitTime);
    };
    
    speakIntro();
  }, [dataLoaded, name, width]);

  // ---------------------------------------------------
  // SPEAK ONLY WHEN JOB IS SELECTED
  // ---------------------------------------------------
  useEffect(() => {
    if (!job) return;

    const speakMotivation = async () => {
      await stopSpeaking();
      
      const genderWord = gender === "M" ? "boy" : "girl";
      const motivationalSpeech = `Soon to be part of the ${job} team. You go ${genderWord}!`;

      await speakText(motivationalSpeech);
    };
    
    speakMotivation();
  }, [job]);

  // ---------------------------------------------------
  // CONTINUE BUTTON → SAVE JOB + NAVIGATE
  // ---------------------------------------------------
  const handleSkip = () => {
    stopSpeaking();
    scrollRef.current?.scrollTo({ x: width, animated: true });
    Animated.timing(page2Anim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleContinue = async () => {
    await stopSpeaking();
    if (!job) return;
    await AsyncStorage.setItem("jobRole", job);
    await AsyncStorage.setItem("hasCompletedOnboarding", "true");
    navigation.navigate("MainTabs");
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      style={styles.root}
    >
      {/* ---------------------------------------------------
         PAGE 1
      --------------------------------------------------- */}
      <View style={[styles.page, { width }]}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip →</Text>
        </TouchableOpacity>

        <Text style={styles.logoText}>MY INTERVIEW</Text>

        <Text style={styles.heading}>Hello there…</Text>

        <Text style={styles.paragraph}>
          My name is Aya.
          {"\n"}Nice to meet you {name || "friend"}.
        </Text>

        <Text style={styles.paragraph}>
          Welcome to your{"\n"}mock interview experience.
        </Text>

        <Text style={styles.heading}>Shall we get started?</Text>
      </View>

      {/* ---------------------------------------------------
         PAGE 2
      --------------------------------------------------- */}
      <Animated.View
        style={[
          styles.page,
          { width },
          {
            opacity: page2Anim,
            transform: [
              {
                translateY: page2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.logoText}>MY INTERVIEW</Text>

        <Text style={styles.heading}>What job role are you applying for?</Text>

        <Text style={styles.paragraphSmall}>
          Don’t worry — you can change this later in settings…
        </Text>

        {/* Modern Dropdown */}
        <Dropdown
          style={[
            styles.dropdown,
            isFocus && { borderColor: colors.primaryBlue },
          ]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          data={JOB_TYPES.map((item) => ({ label: item, value: item }))}
          labelField="label"
          valueField="value"
          placeholder={!isFocus ? "Choose a job role…" : ""}
          value={job}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={(item) => {
            setJob(item.value);
            setIsFocus(false);
          }}
        />

        {/* Motivational Message */}
        {job !== "" && (
          <View style={styles.motivationWrapper}>
            <Text style={styles.motivationTitle}>Oh check you out!</Text>

            <Text style={styles.motivationLine}>
              Soon to be part of the{" "}
              <Text style={{ fontWeight: "700" }}>{job}</Text> team.
            </Text>

            <Text style={styles.motivationLine}>
              {" "}
            </Text>

            <Text style={styles.motivationLine}>
              You go {gender === "M" ? "boy" : "girl"}! 🎉
            </Text>
          </View>
        )}

        {/* Continue */}
        <TouchableOpacity
          style={[styles.continueBtn, job === "" && { opacity: 0.4 }]}
          disabled={!job}
          onPress={handleContinue}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: isDark ? "#121212" : "white" },

    page: {
      paddingTop: 90,
      paddingHorizontal: 28,
    },

    logoText: {
      fontSize: 26,
      fontWeight: "800",
      color: colors.primaryBlue,
      alignSelf: "center",
      marginBottom: 30,
    },

    heading: {
      fontSize: 32,
      fontWeight: "700",
      color: isDark ? "#fff" : "#0D0D0D",
      marginBottom: 24,
      letterSpacing: 0.3,
    },

    paragraph: {
      fontSize: 20,
      fontWeight: "400",
      lineHeight: 34,
      marginBottom: 24,
      color: isDark ? "#e5e5e5" : "#444",
      letterSpacing: 0.2,
    },

    paragraphSmall: {
      fontSize: 16,
      fontWeight: "400",
      color: isDark ? "#b8b8b8" : colors.textMuted,
      marginBottom: 20,
      lineHeight: 24,
      letterSpacing: 0.2,
    },

    dropdown: {
      height: 52,
      borderColor: isDark ? "#555" : colors.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      backgroundColor: isDark ? "#1f1f1f" : "#F7F7F7",
      marginBottom: 22,
    },

    placeholderStyle: { fontSize: 16, color: isDark ? "#bbb" : colors.textMuted },
    selectedTextStyle: { fontSize: 16, color: isDark ? "#fff" : colors.textDark },

    motivationWrapper: {
      marginTop: 30,
      marginBottom: 40,
    },

    motivationTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: isDark ? "#fff" : "#0D0D0D",
      marginBottom: 12,
      letterSpacing: 0.3,
    },

    motivationLine: {
      fontSize: 20,
      fontWeight: "400",
      color: isDark ? "#e5e5e5" : "#444",
      marginBottom: 8,
      lineHeight: 34,
      letterSpacing: 0.2,
    },

    continueBtn: {
      backgroundColor: colors.primaryBlue,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },

    skipButton: {
      position: "absolute",
      top: 50,
      right: 20,
      padding: 10,
      zIndex: 10,
    },
    skipText: {
      color: colors.primaryBlue,
      fontSize: 16,
      fontWeight: "600",
    },
    continueText: {
      color: "white",
      fontSize: 16,
      fontWeight: "700",
    },
  });
