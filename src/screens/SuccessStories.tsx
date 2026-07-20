import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/colors';
import ScreenHeader from "../components/ScreenHeader";
import { supabase } from '../config/supabase';

interface Story {
  id: string;
  name: string;
  role: string;
  company: string;
  story: string;
  interview_count: number;
  timeframe: string;
  created_at: string;
}

const SuccessStories: React.FC = () => {
  const navigation = useNavigation();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('success_stories')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading stories:', error);
      } else if (data) {
        setStories(data);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStories();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader />
      
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
          <Text style={styles.addStoryButtonText}>Add Your Story</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
            <Text style={styles.loadingText}>Loading stories...</Text>
          </View>
        ) : stories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIllustration}>
              <View style={styles.emptyCircle}>
                <Ionicons name="ribbon-outline" size={52} color={colors.primaryBlue} />
              </View>
              <View style={styles.emptyDotA} />
              <View style={styles.emptyDotB} />
            </View>
            <Text style={styles.emptyTitle}>No stories yet</Text>
            <Text style={styles.emptyText}>
              Be the first to share your success story and inspire others!
            </Text>
          </View>
        ) : (
          <>
        {stories.map((story, index) => {
          const isExpanded = expandedId === story.id;
          const previewText = story.story.slice(0, 120) + '...';
          const avatar = '⭐';

          return (
            <TouchableOpacity
              key={story.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => toggleExpand(story.id)}
            >
              <View style={styles.header}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatar}>{avatar}</Text>
                </View>
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
                    <Text style={styles.statText}>{story.interview_count} interviews</Text>
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
          </>
        )}
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
            paddingBottom: 40,
    },
    logoText: {
      ...typography.brandMark,
      color: colors.primaryBlue,
    },
    title: {
      ...typography.headingSmall,
      textAlign: 'center',
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 8,
    },
    subtitle: {
      ...typography.bodyMedium,
      textAlign: 'center',
      color: colors.textMuted,
      marginBottom: 16,
      lineHeight: 22,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 30,
    },
    emptyIllustration: {
      width: 120,
      height: 120,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    emptyCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primaryBlue + '14',
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyDotA: {
      position: 'absolute',
      top: 6,
      right: 8,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.primaryBlue + '28',
    },
    emptyDotB: {
      position: 'absolute',
      bottom: 6,
      left: 10,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primaryBlue + '1e',
    },
    emptyTitle: {
      ...typography.headingMedium,
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 12,
      textAlign: 'center',
    },
    emptyText: {
      ...typography.bodyMedium,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 24,
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
    avatarContainer: {
      marginRight: 16,
    },
    avatar: {
      fontSize: 48,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      ...typography.bodyMedium,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginTop: 12,
    },
  });

export default SuccessStories;
