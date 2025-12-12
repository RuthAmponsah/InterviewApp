import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/colors';
import BackButton from '../components/BackButton';

interface Story {
  id: string;
  name: string;
  role: string;
  company: string;
  story: string;
  interviewCount: number;
  timeframe: string;
  avatar: string;
}

const successStories: Story[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Software Engineer',
    company: 'Google',
    story: "I was so nervous about technical interviews. After practicing with Aya for 3 weeks, I felt confident discussing my projects and explaining my thought process. The STAR method practice really helped me structure my answers. Got the offer last week!",
    interviewCount: 24,
    timeframe: '3 weeks',
    avatar: '👩‍💻',
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    role: 'Product Manager',
    company: 'Microsoft',
    story: "The question bank was a game changer. I practiced answering 'Tell me about a time you failed' so many times that when they asked it in the real interview, I nailed it. Went from getting rejected 5 times to landing my dream PM role.",
    interviewCount: 31,
    timeframe: '5 weeks',
    avatar: '👨‍💼',
  },
  {
    id: '3',
    name: 'Priya Patel',
    role: 'Data Analyst',
    company: 'Amazon',
    story: "I'm an introvert and interviews terrified me. Practicing with Aya in a low-pressure environment helped me build confidence. The daily reminders kept me consistent. After 40+ practice sessions, I walked into my Amazon interview feeling prepared.",
    interviewCount: 42,
    timeframe: '6 weeks',
    avatar: '👩‍🔬',
  },
  {
    id: '4',
    name: 'James Wilson',
    role: 'UX Designer',
    company: 'Apple',
    story: "The feedback system is incredible. It helped me realize I was rambling too much. I learned to keep answers concise and impactful. The interview tips about body language and tone also made a huge difference. Landed my Apple offer on my second try!",
    interviewCount: 18,
    timeframe: '2 weeks',
    avatar: '👨‍🎨',
  },
  {
    id: '5',
    name: 'Emily Rodriguez',
    role: 'Marketing Manager',
    company: 'Meta',
    story: "After being laid off, my confidence was shattered. Aya helped me practice telling my story positively. The custom questions feature let me prepare for industry-specific scenarios. Now I'm at Meta doing work I love. Never giving up was worth it!",
    interviewCount: 35,
    timeframe: '4 weeks',
    avatar: '👩‍💼',
  },
  {
    id: '6',
    name: 'David Kim',
    role: 'Full Stack Developer',
    company: 'Shopify',
    story: "I had the technical skills but struggled to communicate them. The progress dashboard showed me improving week by week, which motivated me to keep going. Practiced 50+ interviews and finally cracked the Shopify interview. Persistence pays off!",
    interviewCount: 53,
    timeframe: '7 weeks',
    avatar: '👨‍💻',
  },
  {
    id: '7',
    name: 'Aisha Mohammed',
    role: 'Business Analyst',
    company: 'Deloitte',
    story: "English isn't my first language, so I needed extra practice articulating my thoughts clearly. Aya never judged me. I could practice the same questions over and over until I felt fluent. Just accepted my offer at Deloitte - dreams do come true!",
    interviewCount: 29,
    timeframe: '5 weeks',
    avatar: '👩‍💼',
  },
  {
    id: '8',
    name: 'Tom Anderson',
    role: 'Sales Director',
    company: 'Salesforce',
    story: "I thought I was great at interviews, but Aya's feedback showed me I wasn't giving specific examples. Once I started using concrete numbers and results in my answers, everything changed. Went from 'maybes' to multiple offers, chose Salesforce!",
    interviewCount: 15,
    timeframe: '3 weeks',
    avatar: '👨‍💼',
  },
];

const SuccessStories: React.FC = () => {
  const navigation = useNavigation();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <BackButton />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryBlue}
          />
        }
      >
        <Text style={styles.logoText}>MY INTERVIEW</Text>
        <Text style={styles.title}>Success Stories</Text>
        <Text style={styles.subtitle}>
          Real people who practiced with Aya and landed their dream jobs
        </Text>

        <TouchableOpacity
          style={styles.addStoryButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AddStory' as never)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.addStoryButtonText}>Add Your Story Now</Text>
        </TouchableOpacity>

        {successStories.map((story) => {
          const isExpanded = expandedId === story.id;
          const previewText = story.story.slice(0, 120) + '...';

          return (
            <TouchableOpacity
              key={story.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => toggleExpand(story.id)}
            >
              <View style={styles.header}>
                <Text style={styles.avatar}>{story.avatar}</Text>
                <View style={styles.headerInfo}>
                  <Text style={styles.name}>{story.name}</Text>
                  <Text style={styles.role}>{story.role} at {story.company}</Text>
                </View>
              </View>

              <Text style={styles.story}>
                {isExpanded ? story.story : previewText}
              </Text>

              <View style={styles.footer}>
                <View style={styles.stats}>
                  <View style={styles.stat}>
                    <Ionicons name="chatbox-outline" size={16} color={colors.primaryBlue} />
                    <Text style={styles.statText}>{story.interviewCount} interviews</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="time-outline" size={16} color={colors.primaryBlue} />
                    <Text style={styles.statText}>{story.timeframe}</Text>
                  </View>
                </View>
                <Text style={styles.readMore}>
                  {isExpanded ? 'Read less' : 'Read more'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.encouragement}>
          <Text style={styles.encouragementTitle}>Your story starts today</Text>
          <Text style={styles.encouragementText}>
            Every expert was once a beginner. Start practicing now and you could be our next success story!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#1a1a1a' : '#F3F4F6',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 70,
      paddingBottom: 40,
    },
    logoText: {
      ...typography.heading,
      fontWeight: '800',
      color: colors.primaryBlue,
      alignSelf: 'center',
      marginBottom: 28,
    },
    title: {
      ...typography.headingSmall,
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 8,
    },
    subtitle: {
      ...typography.bodyMedium,
      color: colors.textMuted,
      marginBottom: 16,
      lineHeight: 22,
    },
    addStoryButton: {
      backgroundColor: colors.primaryBlue,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 24,
    },
    addStoryButtonText: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: '#fff',
    },
    card: {
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatar: {
      fontSize: 48,
      marginRight: 16,
    },
    headerInfo: {
      flex: 1,
    },
    name: {
      ...typography.headingSmall,
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 4,
    },
    role: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
    story: {
      ...typography.bodyMedium,
      color: isDark ? '#e0e0e0' : colors.textDark,
      lineHeight: 24,
      marginBottom: 16,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#3a3a3a' : '#E5E7EB',
    },
    stats: {
      flexDirection: 'row',
      gap: 16,
    },
    stat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statText: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
    readMore: {
      ...typography.bodySmall,
      color: colors.primaryBlue,
      fontWeight: '600',
    },
    encouragement: {
      backgroundColor: colors.primaryBlue,
      borderRadius: 16,
      padding: 24,
      marginTop: 8,
      alignItems: 'center',
    },
    encouragementTitle: {
      ...typography.headingMedium,
      color: '#fff',
      marginBottom: 8,
      textAlign: 'center',
    },
    encouragementText: {
      ...typography.bodyMedium,
      color: '#fff',
      textAlign: 'center',
      lineHeight: 22,
      opacity: 0.95,
    },
  });

export default SuccessStories;
