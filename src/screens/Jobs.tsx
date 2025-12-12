import React, { useState, useEffect } from 'react';
import {
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from "../config/supabase";

const CATEGORIES = [
  'All Jobs',
  'Saved Jobs',
  'Cyber Security',
  'Data Analyst',
  'IT Support',
  'Software Developer',
  'Sales',
  'Customer Service',
  'Marketing',
];

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  category: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  remote: 'Remote' | 'Hybrid' | 'On-site';
  source: 'Indeed' | 'LinkedIn';
  url: string;
  postedDays: number;
  saved?: boolean;
};

// Realistic Mock Job Data (structured for easy API replacement)
const MOCK_JOBS: Job[] = [
  // Data Analyst Jobs
  {
    id: '1',
    title: 'Junior Data Analyst',
    company: 'Deloitte',
    location: 'London, UK',
    salary: '£30,000 - £35,000',
    category: 'Data Analyst',
    type: 'Full-time',
    remote: 'Hybrid',
    source: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs',
    postedDays: 2,
  },
  {
    id: '2',
    title: 'Data Analyst',
    company: 'Sky',
    location: 'Leeds, UK',
    salary: '£35,000 - £42,000',
    category: 'Data Analyst',
    type: 'Full-time',
    remote: 'Hybrid',
    source: 'Indeed',
    url: 'https://www.indeed.co.uk',
    postedDays: 5,
  },
  {
    id: '3',
    title: 'Graduate Data Analyst',
    company: 'KPMG',
    location: 'Manchester, UK',
    salary: '£28,000 - £32,000',
    category: 'Data Analyst',
    type: 'Full-time',
    remote: 'On-site',
    source: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs',
    postedDays: 1,
  },
  
  // IT Support Jobs
  {
    id: '4',
    title: 'IT Support Engineer',
    company: 'Capita',
    location: 'Birmingham, UK',
    salary: '£25,000 - £30,000',
    category: 'IT Support',
    type: 'Full-time',
    remote: 'On-site',
    source: 'Indeed',
    url: 'https://www.indeed.co.uk',
    postedDays: 3,
  },
  {
    id: '5',
    title: 'Remote IT Support Specialist',
    company: 'BT Group',
    location: 'Remote, UK',
    salary: '£28,000 - £33,000',
    category: 'IT Support',
    type: 'Full-time',
    remote: 'Remote',
    source: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs',
    postedDays: 7,
  },
  
  // Cyber Security Jobs
  {
    id: '6',
    title: 'Junior Cyber Security Analyst',
    company: 'BAE Systems',
    location: 'Bristol, UK',
    salary: '£32,000 - £38,000',
    category: 'Cyber Security',
    type: 'Full-time',
    remote: 'Hybrid',
    source: 'Indeed',
    url: 'https://www.indeed.co.uk',
    postedDays: 4,
  },
  {
    id: '7',
    title: 'Cyber Security Consultant',
    company: 'PwC',
    location: 'London, UK',
    salary: '£45,000 - £55,000',
    category: 'Cyber Security',
    type: 'Full-time',
    remote: 'Hybrid',
    source: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs',
    postedDays: 6,
  },
  
  // Software Developer Jobs
  {
    id: '8',
    title: 'Junior Software Developer',
    company: 'Lloyds Banking Group',
    location: 'Edinburgh, UK',
    salary: '£30,000 - £38,000',
    category: 'Software Developer',
    type: 'Full-time',
    remote: 'Hybrid',
    source: 'Indeed',
    url: 'https://www.indeed.co.uk',
    postedDays: 2,
  },
  {
    id: '9',
    title: 'Full Stack Developer',
    company: 'Monzo',
    location: 'London, UK',
    salary: '£50,000 - £65,000',
    category: 'Software Developer',
    type: 'Full-time',
    remote: 'Remote',
    source: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs',
    postedDays: 1,
  },
  
  // Sales Jobs
  {
    id: '10',
    title: 'Sales Executive',
    company: 'Vodafone',
    location: 'Manchester, UK',
    salary: '£24,000 - £30,000 + Commission',
    category: 'Sales',
    type: 'Full-time',
    remote: 'On-site',
    source: 'Indeed',
    url: 'https://www.indeed.co.uk',
    postedDays: 3,
  },
  {
    id: '11',
    title: 'Business Development Representative',
    company: 'Salesforce',
    location: 'London, UK',
    salary: '£35,000 - £42,000 + Commission',
    category: 'Sales',
    type: 'Full-time',
    remote: 'Hybrid',
    source: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs',
    postedDays: 5,
  },
  
  // Customer Service Jobs
  {
    id: '12',
    title: 'Customer Service Advisor',
    company: 'Amazon',
    location: 'Remote, UK',
    salary: '£22,000 - £25,000',
    category: 'Customer Service',
    type: 'Full-time',
    remote: 'Remote',
    source: 'Indeed',
    url: 'https://www.indeed.co.uk',
    postedDays: 2,
  },
  {
    id: '13',
    title: 'Customer Success Manager',
    company: 'Shopify',
    location: 'London, UK',
    salary: '£32,000 - £40,000',
    category: 'Customer Service',
    type: 'Full-time',
    remote: 'Hybrid',
    source: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs',
    postedDays: 4,
  },
  
  // Marketing Jobs
  {
    id: '14',
    title: 'Digital Marketing Executive',
    company: 'Unilever',
    location: 'London, UK',
    salary: '£28,000 - £35,000',
    category: 'Marketing',
    type: 'Full-time',
    remote: 'Hybrid',
    source: 'Indeed',
    url: 'https://www.indeed.co.uk',
    postedDays: 6,
  },
  {
    id: '15',
    title: 'Social Media Marketing Manager',
    company: 'ASOS',
    location: 'London, UK',
    salary: '£38,000 - £45,000',
    category: 'Marketing',
    type: 'Full-time',
    remote: 'Hybrid',
    source: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs',
    postedDays: 3,
  },
];

const Jobs: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  const [selectedCategory, setSelectedCategory] = useState('All Jobs');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load saved jobs from Supabase on mount
  useEffect(() => {
    loadSavedJobs();
  }, []);

  const loadSavedJobs = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_progress')
        .select('saved_jobs')
        .eq('user_id', userId)
        .single();

      if (data && data.saved_jobs) {
        setSavedJobs(data.saved_jobs);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading saved jobs:', error);
      setLoading(false);
    }
  };

  // Filter jobs based on category
  const filteredJobs =
    selectedCategory === 'All Jobs'
      ? MOCK_JOBS
      : selectedCategory === 'Saved Jobs'
      ? MOCK_JOBS.filter((j) => savedJobs.includes(j.id))
      : MOCK_JOBS.filter((j) => j.category === selectedCategory);

  const openJob = (job: Job) => {
    Linking.openURL(job.url);
  };

  const toggleSaveJob = async (jobId: string) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      const newSavedJobs = savedJobs.includes(jobId)
        ? savedJobs.filter((id) => id !== jobId)
        : [...savedJobs, jobId];

      // Update state immediately for UI feedback
      setSavedJobs(newSavedJobs);

      // Save to Supabase
      const { error } = await supabase
        .from('user_progress')
        .update({ saved_jobs: newSavedJobs })
        .eq('user_id', userId);

      if (error) {
        console.error('Error saving job:', error);
        // Revert state if save failed
        setSavedJobs(savedJobs);
      }
    } catch (error) {
      console.error('Error toggling saved job:', error);
    }
  };

  const getPostedText = (days: number) => {
    if (days === 0) return 'Posted today';
    if (days === 1) return 'Posted 1 day ago';
    return `Posted ${days} days ago`;
  };

  return (
    <View style={styles.root}>
      {/* Logo */}
      <Text style={styles.logoText}>MY INTERVIEW</Text>

      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Jobs for you</Text>
          <Text style={styles.subtitle}>
            {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} available
          </Text>
        </View>
      </View>

      {/* Dropdown Filter */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setDropdownOpen(!dropdownOpen)}
        >
          <View style={styles.dropdownLeft}>
            <Ionicons name="briefcase-outline" size={18} color={colors.primaryBlue} />
            <Text style={styles.dropdownText}>{selectedCategory}</Text>
          </View>
          <Ionicons 
            name={dropdownOpen ? "chevron-up" : "chevron-down"} 
            size={18} 
            color={isDark ? '#666' : colors.textMuted} 
          />
        </TouchableOpacity>

        {dropdownOpen && (
          <ScrollView style={styles.dropdownMenu} nestedScrollEnabled>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedCategory(cat);
                  setDropdownOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    selectedCategory === cat && styles.selectedDropdownItem,
                  ]}
                >
                  {cat}
                </Text>
                {selectedCategory === cat && (
                  <Ionicons name="checkmark" size={18} color={colors.primaryBlue} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Job List */}
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.jobList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSaved = savedJobs.includes(item.id);
          return (
            <View style={styles.jobCard}>
              {/* Header with source badge and save button */}
              <View style={styles.jobCardHeader}>
                <View style={[
                  styles.sourceBadge,
                  { backgroundColor: item.source === 'LinkedIn' 
                    ? (isDark ? '#0A66C220' : '#0A66C215') 
                    : (isDark ? '#2557A720' : '#2557A715') 
                  }
                ]}>
                  <Text style={[
                    styles.sourceText,
                    { color: item.source === 'LinkedIn' ? '#0A66C2' : '#2557A7' }
                  ]}>
                    {item.source}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleSaveJob(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={isSaved ? "bookmark" : "bookmark-outline"}
                    size={20}
                    color={isSaved ? colors.primaryBlue : (isDark ? '#666' : colors.textMuted)}
                  />
                </TouchableOpacity>
              </View>

              {/* Job Title */}
              <Text style={styles.jobTitle}>{item.title}</Text>

              {/* Company */}
              <Text style={styles.jobCompany}>{item.company}</Text>

              {/* Location and Remote Type */}
              <View style={styles.jobMetaRow}>
                <Ionicons name="location-outline" size={14} color={isDark ? '#888' : colors.textMuted} />
                <Text style={styles.jobMeta}>{item.location}</Text>
                <View style={[styles.remoteBadge, { 
                  backgroundColor: item.remote === 'Remote' 
                    ? (isDark ? '#10B98120' : '#10B98115')
                    : (isDark ? '#F59E0B20' : '#F59E0B15')
                }]}>
                  <Text style={[styles.remoteBadgeText, {
                    color: item.remote === 'Remote' ? '#10B981' : '#F59E0B'
                  }]}>
                    {item.remote}
                  </Text>
                </View>
              </View>

              {/* Salary */}
              <View style={styles.jobMetaRow}>
                <Ionicons name="cash-outline" size={14} color={isDark ? '#888' : colors.textMuted} />
                <Text style={styles.jobSalary}>{item.salary}</Text>
              </View>

              {/* Posted Date */}
              <Text style={styles.postedText}>{getPostedText(item.postedDays)}</Text>

              {/* Apply Button */}
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => openJob(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyButtonText}>View & Apply</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: isDark ? '#0f0f0f' : '#F3F4F6',
    paddingTop: 60,
  },
  logoText: {
    ...typography.headingSmall,
    fontWeight: '800',
    color: colors.primaryBlue,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    ...typography.heading,
    color: isDark ? '#fff' : colors.textDark,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: isDark ? '#aaa' : colors.textMuted,
  },

  /* Dropdown */
  dropdownContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    zIndex: 10,
  },
  dropdown: {
    backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownText: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: isDark ? '#fff' : colors.textDark,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
    borderRadius: 12,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    ...typography.bodyMedium,
    color: isDark ? '#fff' : colors.textDark,
  },
  selectedDropdownItem: {
    color: colors.primaryBlue,
    fontWeight: '600',
  },

  /* Job List */
  jobList: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  jobCard: {
    backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sourceText: {
    ...typography.caption,
    fontWeight: '600',
  },
  jobTitle: {
    ...typography.headingSmall,
    fontWeight: '700',
    color: isDark ? '#fff' : colors.textDark,
    marginBottom: 6,
  },
  jobCompany: {
    ...typography.bodyMedium,
    fontWeight: '500',
    color: isDark ? '#e5e5e5' : '#374151',
    marginBottom: 10,
  },
  jobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  jobMeta: {
    ...typography.bodyMedium,
    color: isDark ? '#aaa' : colors.textMuted,
    flex: 1,
  },
  jobSalary: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: isDark ? '#10B981' : '#059669',
  },
  remoteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  remoteBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  postedText: {
    ...typography.bodySmall,
    color: isDark ? '#888' : colors.textMuted,
    marginTop: 8,
    marginBottom: 12,
  },
  applyButton: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  applyButtonText: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default Jobs;
