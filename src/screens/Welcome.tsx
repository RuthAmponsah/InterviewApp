import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  AccessibilityInfo,
  Easing,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Dropdown } from "react-native-element-dropdown";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { speakText, stopSpeaking } from "../services/aiService";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../theme/ThemeContext";
import { supabase } from "../config/supabase";
import { JOB_ROLES } from "../constants/jobRoles";
import AyaPresenceIndicator from "../components/AyaPresenceIndicator";

type Nav = NativeStackNavigationProp<RootStackParamList, "Welcome">;

export default function Welcome() {
  const navigation = useNavigation<Nav>();
  const scrollRef = useRef<ScrollView>(null);
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  const hasSpokenRef = useRef(false);
  const { width } = useWindowDimensions();

  const [name, setName] = useState("");
  const [job, setJob] = useState("");
  const [isFocus, setIsFocus] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const page2Anim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const helloWordAnims = useRef(["Hello", "there…"].map(() => new Animated.Value(0))).current;
  const ayaLineAnim = useRef(new Animated.Value(0)).current;
  const meetLineAnim = useRef(new Animated.Value(0)).current;
  const nameEmphasisAnim = useRef(new Animated.Value(0)).current;
  const welcomeLineAnim = useRef(new Animated.Value(0)).current;
  const mockLineAnim = useRef(new Animated.Value(0)).current;
  const questionAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // ---------------------------------------------------
  // LOAD USER NAME + GENDER
  // ---------------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      const storedName = await AsyncStorage.getItem("userName");
      if (storedName) setName(storedName);
      setDataLoaded(true);
    };
    loadData();
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;

    const revealValues = [
      logoAnim,
      ...helloWordAnims,
      ayaLineAnim,
      meetLineAnim,
      nameEmphasisAnim,
      welcomeLineAnim,
      mockLineAnim,
      questionAnim,
      glowAnim,
    ];

    if (reduceMotion) {
      revealValues.forEach((value) => value.setValue(1));
      return;
    }

    revealValues.forEach((value) => value.setValue(0));

    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.stagger(
        130,
        helloWordAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 430,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        )
      ),
      Animated.delay(180),
      Animated.parallel([
        Animated.timing(ayaLineAnim, {
          toValue: 1,
          duration: 430,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(170, [
        Animated.timing(meetLineAnim, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(nameEmphasisAnim, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      Animated.delay(130),
      Animated.stagger(175, [
        Animated.timing(welcomeLineAnim, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(mockLineAnim, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(questionAnim, {
        toValue: 1,
        speed: 10,
        bounciness: 2,
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    ayaLineAnim,
    dataLoaded,
    glowAnim,
    helloWordAnims,
    logoAnim,
    meetLineAnim,
    mockLineAnim,
    nameEmphasisAnim,
    questionAnim,
    reduceMotion,
    welcomeLineAnim,
  ]);

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

      // Scroll shortly after the intro finishes
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: width, animated: true });

        Animated.timing(page2Anim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();

        // Speak as soon as the page finishes switching
        setTimeout(() => {
          speakText("What job role are you applying for?");
        }, 400);
      }, 200);
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
      
      const motivationalSpeech = `Soon to be part of the ${job} team. Let's do this!`;

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
    
    // Save job role to database
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        await supabase
          .from('users')
          .update({ job_role: job })
          .eq('id', userId);
        console.log('✅ Job role saved to database:', job);
      }
    } catch (error) {
      console.log('Failed to save job to database:', error);
    }
    
    navigation.navigate("MainTabs");
  };

  const animatedUpStyle = (anim: Animated.Value, distance = 7) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
    ],
  });

  const nameEmphasisColor = nameEmphasisAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.primaryBlue, isDark ? "#fff" : "#0D0D0D"],
  });

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
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ambientGlow,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 0.45, 1],
                outputRange: [0, 0.2, 0.06],
              }),
              transform: [
                {
                  scale: glowAnim.interpolate({
                    inputRange: [0, 0.6, 1],
                    outputRange: [0.74, 1.08, 1],
                  }),
                },
              ],
            },
          ]}
        />
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip →</Text>
        </TouchableOpacity>

        <Animated.Text style={[styles.logoText, animatedUpStyle(logoAnim, 8)]}>
          MY INTERVIEW
        </Animated.Text>

        <View style={styles.helloRow}>
          {["Hello", "there…"].map((word, index) => (
            <Animated.Text
              key={word}
              style={[
                styles.heading,
                styles.helloWord,
                animatedUpStyle(helloWordAnims[index], 7),
              ]}
            >
              {word}
              {index === 0 ? " " : ""}
            </Animated.Text>
          ))}
        </View>

        <View style={styles.ayaIntroBlock}>
          <Animated.View style={[styles.ayaNameRow, animatedUpStyle(ayaLineAnim, 7)]}>
            <Text style={[styles.paragraph, styles.paragraphLine]}>My name is Aya.</Text>
            <AyaPresenceIndicator size={18} reduceMotion={reduceMotion} />
          </Animated.View>
          <Animated.Text style={[styles.paragraph, styles.paragraphLine, animatedUpStyle(meetLineAnim, 7)]}>
            Nice to meet you{" "}
            <Animated.Text style={{ color: nameEmphasisColor, fontWeight: "500" }}>
              {name || "friend"}
            </Animated.Text>
            .
          </Animated.Text>
        </View>

        <View style={styles.welcomeBlock}>
          <Animated.Text style={[styles.paragraph, styles.paragraphLine, animatedUpStyle(welcomeLineAnim, 7)]}>
            Welcome to your
          </Animated.Text>
          <Animated.Text style={[styles.paragraph, styles.paragraphLine, animatedUpStyle(mockLineAnim, 7)]}>
            mock interview experience.
          </Animated.Text>
        </View>

        <Animated.Text
          style={[
            styles.heading,
            styles.questionHeading,
            {
              opacity: questionAnim,
              transform: [
                {
                  scale: questionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                  }),
                },
              ],
            },
          ]}
        >
          Shall we get started?
        </Animated.Text>
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
          data={JOB_ROLES.map((item) => ({ label: item, value: item }))}
          labelField="label"
          valueField="value"
          placeholder={!isFocus ? "Choose a job role…" : ""}
          value={job}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={(item) => {
            stopSpeaking(); // Stop any current speech when selecting a job
            setJob(item.value);
            setIsFocus(false);
          }}
          renderRightIcon={() => (
            <Ionicons name="chevron-down" size={18} color={isDark ? "#bbb" : colors.textMuted} />
          )}
          search
          searchPlaceholder="Type to search roles..."
          inputSearchStyle={styles.inputSearchStyle}
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
              Let's do this! 🎉
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
      overflow: "hidden",
    },

    ambientGlow: {
      position: "absolute",
      top: 150,
      alignSelf: "center",
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: colors.primaryBlue,
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

    helloRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      minHeight: 62,
      marginBottom: 4,
    },

    helloWord: {
      marginBottom: 0,
    },

    paragraph: {
      fontSize: 20,
      fontWeight: "400",
      lineHeight: 34,
      marginBottom: 24,
      color: isDark ? "#e5e5e5" : "#444",
      letterSpacing: 0.2,
    },

    paragraphLine: {
      marginBottom: 0,
    },

    ayaIntroBlock: {
      marginBottom: 24,
      minHeight: 68,
    },

    ayaNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 0,
    },

    welcomeBlock: {
      marginBottom: 24,
      minHeight: 68,
    },

    questionHeading: {
      transformOrigin: "left center",
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
    inputSearchStyle: {
      fontSize: 14,
      color: isDark ? "#fff" : colors.textDark,
      backgroundColor: isDark ? "#1f1f1f" : "#F7F7F7",
      borderRadius: 8,
      paddingHorizontal: 10,
      height: 40,
    },

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
