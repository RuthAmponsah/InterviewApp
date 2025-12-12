import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

type RootNav = NativeStackNavigationProp<RootStackParamList>;

const dailyTips = [
  "Use STAR: Situation, Task, Action, Result for strong answers.",
  "Maintain eye contact — confidence shows through body language.",
  "Pause before answering — clarity is better than speed.",
  "Explain WHY you made decisions, not just WHAT you did.",
  "Quantify impact: numbers make your achievements real.",
  "Turn weaknesses into learning moments.",
  "Practice out loud — the brain remembers spoken words better.",
  "Ask thoughtful questions at the end of an interview.",
  "'I' for personal wins, 'We' for team wins — balance both.",
  "Smile — it naturally boosts your vocal warmth and tone.",
];

const Home: React.FC = () => {
  const navigation = useNavigation<RootNav>();
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  const [greeting, setGreeting] = useState('');
  const [name, setName] = useState("User");
  const [tipOfTheDay, setTipOfTheDay] = useState('');
  const [streak, setStreak] = useState(0);

  // ---------------------------
  // 1️⃣ GREETING BASED ON TIME
  // ---------------------------
  useEffect(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 16) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  // ---------------------------
  // 2️⃣ DAILY TIP SELECTION
  // ---------------------------
  useEffect(() => {
    const dayIndex = new Date().getDate() % dailyTips.length;
    setTipOfTheDay(dailyTips[dayIndex]);
  }, []);
  
  // ---------------------------
  // // 4️⃣ LOAD SAVED USER NAME
  // // ---------------------------
  useEffect(() => {
    const loadName = async () => {
      const storedName = await AsyncStorage.getItem("userName");
      if (storedName) {
        setName(storedName);
      }
    };
    
    loadName();
  }, []);


  // ---------------------------
  // 3️⃣ DAILY STREAK TRACKER
  // ---------------------------
  useEffect(() => {
    const loadStreak = async () => {
      const storedDate = await AsyncStorage.getItem("lastUsedDate");
      const storedStreak = await AsyncStorage.getItem("streak");

      const today = new Date().toDateString();

      if (storedDate !== today) {
        // New day → increase streak
        const newStreak = storedStreak ? Number(storedStreak) + 1 : 1;

        await AsyncStorage.setItem("streak", String(newStreak));
        await AsyncStorage.setItem("lastUsedDate", today);

        setStreak(newStreak);
      } else {
        // Same day → keep existing streak
        if (storedStreak) setStreak(Number(storedStreak));
      }
    };

    loadStreak();
  }, []);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.logoText}>MY INTERVIEW</Text>

      <Text style={styles.greeting}>
        {greeting}, {name}
      </Text>

      <Text style={styles.subGreeting}>
        Ready to practice and move one step closer to your next role?
      </Text>

      {/* Primary CTA card */}
      <TouchableOpacity
        style={[styles.card, styles.primaryCard]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('InterviewType')}
      >
        <Text style={styles.cardTitlePrimary}>Start interview</Text>
        <Text style={styles.cardBodyPrimary}>
          Get a realistic mock interview tailored to your target role.
        </Text>
      </TouchableOpacity>

      {/* Row of cards */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, styles.smallCard]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('QuestionBank')}
        >
          <Text style={styles.cardTag}>Practice 📝</Text>
          <Text style={styles.cardTitle}>Question Bank</Text>
          <Text style={styles.cardBody}>32 common questions</Text>
        </TouchableOpacity>

        <View style={[styles.card, styles.smallCard]}>
          <Text style={styles.cardTag}>Streak 🔥</Text>
          <Text style={styles.cardTitle}>{streak} day streak</Text>
          <Text style={styles.cardBody}>Consistency builds confidence.</Text>
        </View>
      </View>

      {/* Daily Tip Card */}
      <View style={styles.card}>
        <Text style={styles.cardTag}>Daily tip</Text>
        <Text style={styles.cardTitle}>Tip of the day</Text>
        <Text style={styles.cardBody}>{tipOfTheDay}</Text>
      </View>

      {/* Latest feedback section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Latest feedback</Text>
        <Text style={styles.cardBody}>
          “Great examples – next time, add more detail about your impact on the team.”
        </Text>
      </View>

      <TouchableOpacity style={styles.card} activeOpacity={0.85}>
        <Text style={styles.cardTitle}>Success stories</Text>
        <Text style={styles.cardBody}>
          Read how other learners went from nervous to hired after practicing with Aya.
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: isDark ? '#1a1a1a' : '#F3F4F6',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 100, // ⬅️ moved everything down
    paddingBottom: 28,
  },
  logoText: {
    ...typography.headingMedium,
    fontWeight: '800',
    color: colors.primaryBlue,
    alignSelf: 'center',
    marginBottom: 20,
  },
  greeting: {
    ...typography.headingMedium,
    color: isDark ? '#fff' : colors.textDark,
  },
  subGreeting: {
    ...typography.bodyMedium,
    color: isDark ? '#aaa' : colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  card: {
    backgroundColor: isDark ? '#222' : '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  primaryCard: {
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
  },
  cardTitlePrimary: {
    ...typography.headingSmall,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardBodyPrimary: {
    ...typography.bodyMedium,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  smallCard: {
    flex: 1,
  },
  cardTag: {
    ...typography.caption,
    color: colors.primaryBlue,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardTitle: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: isDark ? '#fff' : colors.textDark,
    marginBottom: 4,
  },
  cardBody: {
    ...typography.bodySmall,
    color: isDark ? '#aaa' : colors.textMuted,
  },
});export default Home;
