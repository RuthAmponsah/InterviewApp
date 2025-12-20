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
    name: 'Sarah Thompson',
    role: 'Marketing Assistant',
    company: 'Local Marketing Agency',
    story: "I was really nervous about my first proper job interview after graduating. I practiced with the app for about 2 weeks, going through common questions like 'Why do you want this role?' and 'What are your strengths?'. It helped me feel more confident and less anxious. When the actual interview came, I felt prepared and managed to stay calm. I got the job offer a week later!",
    interviewCount: 12,
    timeframe: '2 weeks',
    avatar: '👩‍💼',
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
