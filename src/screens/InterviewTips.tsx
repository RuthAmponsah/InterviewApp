import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../components/BackButton";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

type TipCategory = 'Before' | 'During' | 'After' | 'STAR' | 'Questions';

type Tip = {
  id: string;
  category: TipCategory;
  title: string;
  description: string;
  icon: string;
};

const TIPS: Tip[] = [
  // Before Interview
  {
    id: '1',
    category: 'Before',
    title: 'Research the Company',
    description: 'Learn about the company\'s mission, values, recent news, and culture. This shows genuine interest and helps you tailor your answers.',
    icon: '🔍',
  },
  {
    id: '2',
    category: 'Before',
    title: 'Prepare Your Stories',
    description: 'Have 5-7 specific examples ready from your experience that demonstrate key skills. Use the STAR method for structure.',
    icon: '📚',
  },
  {
    id: '3',
    category: 'Before',
    title: 'Practice Out Loud',
    description: 'Rehearse answering common questions aloud. This helps you sound more natural and confident during the actual interview.',
    icon: '🗣️',
  },
  {
    id: '4',
    category: 'Before',
    title: 'Prepare Questions',
    description: 'Have 3-5 thoughtful questions ready to ask the interviewer. This shows engagement and helps you evaluate if the role is right for you.',
    icon: '❓',
  },
  {
    id: '21',
    category: 'Before',
    title: 'Test Your Tech',
    description: 'If your interview is virtual, test your internet, camera, and microphone in advance. Make sure your environment is quiet and well-lit.',
    icon: '💻',
  },
  {
    id: '22',
    category: 'Before',
    title: 'Plan Your Route',
    description: 'If in-person, plan your route and allow extra time for travel. Arriving late can create a bad first impression.',
    icon: '🗺️',
  },

  // During Interview
  {
    id: '5',
    category: 'During',
    title: 'Make Strong First Impression',
    description: 'Arrive early, dress appropriately, maintain eye contact, offer a firm handshake, and smile. First impressions matter.',
    icon: '👔',
  },
  {
    id: '6',
    category: 'During',
    title: 'Listen Carefully',
    description: 'Pay close attention to the question being asked. It\'s okay to pause and think before answering. Clarify if you\'re unsure.',
    icon: '👂',
  },
  {
    id: '7',
    category: 'During',
    title: 'Be Specific and Quantify',
    description: 'Use specific examples and numbers when possible. "Increased sales by 30%" is more impactful than "improved sales."',
    icon: '📊',
  },
  {
    id: '8',
    category: 'During',
    title: 'Show Enthusiasm',
    description: 'Let your passion for the role and company shine through. Energy and enthusiasm are contagious and memorable.',
    icon: '⚡',
  },
  {
    id: '9',
    category: 'During',
    title: 'Body Language Matters',
    description: 'Sit up straight, lean slightly forward to show engagement, avoid fidgeting, and maintain appropriate eye contact.',
    icon: '🤝',
  },
  {
    id: '23',
    category: 'During',
    title: 'Take Notes',
    description: 'Bring a notebook and jot down key points or questions. It shows you are engaged and helps you remember details.',
    icon: '📝',
  },
  {
    id: '24',
    category: 'During',
    title: 'Pause Before Answering',
    description: 'It’s okay to take a moment to think before you answer. This helps you give more thoughtful responses.',
    icon: '⏸️',
  },

  // After Interview
  {
    id: '10',
    category: 'After',
    title: 'Send Thank You Email',
    description: 'Within 24 hours, send a personalized thank you email. Reference specific topics discussed and reiterate your interest.',
    icon: '✉️',
  },
  {
    id: '11',
    category: 'After',
    title: 'Reflect and Learn',
    description: 'Write down what went well and what you\'d improve. This helps you perform better in future interviews.',
    icon: '📝',
  },
  {
    id: '12',
    category: 'After',
    title: 'Follow Up Appropriately',
    description: 'If you haven\'t heard back in the expected timeframe, it\'s appropriate to send a polite follow-up email.',
    icon: '📅',
  },
  {
    id: '25',
    category: 'After',
    title: 'Connect on LinkedIn',
    description: 'If appropriate, connect with your interviewer on LinkedIn with a short, polite message. It helps you stay on their radar.',
    icon: '🔗',
  },

  // STAR Method
  {
    id: '13',
    category: 'STAR',
    title: 'Situation',
    description: 'Set the context. Describe the situation or challenge you faced. Be specific about when and where this happened.',
    icon: '🎬',
  },
  {
    id: '14',
    category: 'STAR',
    title: 'Task',
    description: 'Explain your responsibility. What was your role? What needed to be accomplished? What was at stake?',
    icon: '🎯',
  },
  {
    id: '15',
    category: 'STAR',
    title: 'Action',
    description: 'Detail the specific actions YOU took. Focus on your contributions, not the team\'s. What steps did you take?',
    icon: '⚙️',
  },
  {
    id: '16',
    category: 'STAR',
    title: 'Result',
    description: 'Share the outcome. Quantify results when possible. What was the impact? What did you learn?',
    icon: '🏆',
  },
  {
    id: '26',
    category: 'STAR',
    title: 'Keep STAR Concise',
    description: 'Keep each STAR story to 1-2 minutes. Focus on the most relevant details for the job you want.',
    icon: '⏱️',
  },

  // Common Questions
  {
    id: '17',
    category: 'Questions',
    title: 'Tell Me About Yourself',
    description: 'Keep it to 2 minutes. Cover present (current role), past (relevant experience), and future (why this role). End with enthusiasm for the opportunity.',
    icon: '👤',
  },
  {
    id: '18',
    category: 'Questions',
    title: 'What\'s Your Weakness?',
    description: 'Choose a real weakness you\'re actively working to improve. Show self-awareness and growth mindset. Avoid clichés.',
    icon: '💭',
  },
  {
    id: '19',
    category: 'Questions',
    title: 'Why This Company?',
    description: 'Show you\'ve done research. Connect your values and career goals to the company\'s mission. Be specific and authentic.',
    icon: '🏢',
  },
  {
    id: '20',
    category: 'Questions',
    title: 'Why Should We Hire You?',
    description: 'Highlight 2-3 key strengths that match the job requirements. Use specific examples. Show confidence but not arrogance.',
    icon: '✨',
  },
  {
    id: '27',
    category: 'Questions',
    title: 'Ask About Next Steps',
    description: 'At the end, ask about the next steps in the process. It shows you are interested and helps you plan.',
    icon: '➡️',
  },
];

const CATEGORIES: TipCategory[] = ['Before', 'During', 'After', 'STAR', 'Questions'];

export default function InterviewTips() {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  
  const [selectedCategory, setSelectedCategory] = useState<TipCategory | 'All'>('All');
  const [expandedTips, setExpandedTips] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const filteredTips = selectedCategory === 'All' 
    ? TIPS 
    : TIPS.filter(tip => tip.category === selectedCategory);

  const toggleTip = (id: string) => {
    const newExpanded = new Set(expandedTips);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTips(newExpanded);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <View style={styles.root}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryBlue}
          />
        }
      >
        <BackButton />
        
        <Text style={styles.logoText}>MY INTERVIEW</Text>

        <Text style={styles.title}>Interview Tips</Text>
        <Text style={styles.subtitle}>
          Expert advice to help you succeed in interviews
        </Text>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === 'All' && styles.filterChipActive]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text style={[styles.filterText, selectedCategory === 'All' && styles.filterTextActive]}>
              All ({TIPS.length})
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => {
            const count = TIPS.filter(t => t.category === cat).length;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>
                  {cat} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tips List */}
        <View style={styles.tipsList}>
          {filteredTips.map((tip) => {
            const isExpanded = expandedTips.has(tip.id);
            return (
              <TouchableOpacity
                key={tip.id}
                style={styles.tipCard}
                onPress={() => toggleTip(tip.id)}
                activeOpacity={0.7}
              >
                <View style={styles.tipHeader}>
                  <Text style={styles.tipIcon}>{tip.icon}</Text>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textMuted} 
                  />
                </View>
                {isExpanded && (
                  <Text style={styles.tipDescription}>{tip.description}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? '#1a1a1a' : '#F3F4F6',
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 70,
      paddingBottom: 32,
    },
    logoText: {
      ...typography.heading,
      fontWeight: "800",
      color: colors.primaryBlue,
      alignSelf: "center",
      marginBottom: 28,
    },
    title: {
      ...typography.headingMedium,
      color: isDark ? "#fff" : colors.textDark,
      marginBottom: 4,
    },
    subtitle: {
      ...typography.bodyMedium,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginBottom: 20,
    },
    filterRow: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      marginRight: 8,
      borderWidth: 1,
      borderColor: isDark ? '#333' : colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.primaryBlue,
      borderColor: colors.primaryBlue,
    },
    filterText: {
      ...typography.bodySmall,
      color: isDark ? '#fff' : colors.textDark,
      fontWeight: '500',
    },
    filterTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    tipsList: {
      gap: 12,
    },
    tipCard: {
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
    },
    tipHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    tipIcon: {
      fontSize: 24,
    },
    tipTitle: {
      ...typography.bodyMedium,
      fontWeight: '600',
      color: isDark ? '#fff' : colors.textDark,
      flex: 1,
    },
    tipDescription: {
      ...typography.bodySmall,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginTop: 12,
      paddingLeft: 36,
      lineHeight: 20,
    },
  });
