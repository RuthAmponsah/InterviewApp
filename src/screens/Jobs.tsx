import React, { useState, useEffect } from 'react';
import {
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from "../config/supabase";
import { searchJobs, Job } from "../services/jobService";
import { JOB_ROLES } from "../constants/jobRoles";

const BASE_CATEGORIES = ['All Jobs', 'Saved Jobs'];

const Jobs: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  const [selectedCategory, setSelectedCategory] = useState('All Jobs');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [apiError, setApiError] = useState(false);
  const [remoteFilter, setRemoteFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('');

  // Load saved jobs and fetch real jobs on mount
  useEffect(() => {
    loadSavedJobs();
    fetchJobs();
  }, []);

  // Fetch new jobs when category or remote filter changes
  useEffect(() => {
    if (selectedCategory !== 'Saved Jobs') {
      fetchJobs();
    }
  }, [selectedCategory, remoteFilter]);

  // Debounce location filter to avoid too many API calls
  useEffect(() => {
    if (selectedCategory === 'Saved Jobs') return;
    
    const timeoutId = setTimeout(() => {
      fetchJobs();
    }, 500); // Wait 500ms after user stops typing
    
    return () => clearTimeout(timeoutId);
  }, [locationFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setApiError(false);
      const { jobs: fetchedJobs, totalResults: total } = await searchJobs(
        selectedCategory,
        1,
        20,
        remoteFilter,
        locationFilter
      );
      setJobs(fetchedJobs);
      setTotalResults(total);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setApiError(true);
      setJobs([]);
      setLoading(false);
    }
  };

  const loadSavedJobs = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      const { data, error } = await supabase
        .from('user_progress')
        .select('saved_jobs')
        .eq('user_id', userId)
        .single();

      if (data && data.saved_jobs) {
        setSavedJobs(data.saved_jobs);
      }
    } catch (error) {
      console.error('Error loading saved jobs:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadSavedJobs(), fetchJobs()]);
    setRefreshing(false);
  };

  // Filter jobs based on category and remote type
  let filteredJobs =
    selectedCategory === 'Saved Jobs'
      ? jobs.filter((j) => savedJobs.includes(j.id))
      : jobs;

  // Apply remote filter for additional client-side filtering
  if (remoteFilter !== 'All') {
    filteredJobs = filteredJobs.filter(job => job.remote === remoteFilter);
  }

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
    <KeyboardAvoidingView 
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Logo */}
      <Text style={styles.logoText}>MY INTERVIEW</Text>

      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Jobs for you</Text>
          <Text style={styles.subtitle}>
            {apiError && '⚠️ API error - '}
            {selectedCategory === 'Saved Jobs' 
              ? `${filteredJobs.length} saved ${filteredJobs.length === 1 ? 'job' : 'jobs'}`
              : `${totalResults || filteredJobs.length} ${totalResults === 1 ? 'job' : 'jobs'} available`
            }
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
          <View style={styles.dropdownMenu}>
            <View style={styles.dropdownSearchRow}>
              <Ionicons name="search" size={16} color={isDark ? '#888' : colors.textMuted} />
              <TextInput
                style={styles.dropdownSearchInput}
                placeholder="Search roles..."
                placeholderTextColor={isDark ? '#666' : colors.textMuted}
                value={dropdownSearch}
                onChangeText={setDropdownSearch}
              />
              {dropdownSearch ? (
                <TouchableOpacity onPress={() => setDropdownSearch('')}>
                  <Ionicons name="close-circle" size={18} color={colors.primaryBlue} />
                </TouchableOpacity>
              ) : null}
            </View>
            <ScrollView nestedScrollEnabled>
              {BASE_CATEGORIES.concat(
                JOB_ROLES.filter((role) =>
                  role.toLowerCase().includes(dropdownSearch.trim().toLowerCase())
                )
              ).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setDropdownOpen(false);
                    setDropdownSearch('');
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
          </View>
        )}
      </View>

      {/* Location Search - Prominent Position */}
      <View style={styles.locationSearchContainer}>
        <Ionicons 
          name="location-outline" 
          size={20} 
          color={locationFilter ? colors.primaryBlue : (isDark ? '#888' : colors.textMuted)} 
        />
        <TextInput
          style={styles.locationSearchInput}
          placeholder="Search by city (e.g., London, Manchester)"
          placeholderTextColor={isDark ? '#666' : colors.textMuted}
          value={locationFilter}
          onChangeText={setLocationFilter}
        />
        {locationFilter ? (
          <TouchableOpacity onPress={() => setLocationFilter('')}>
            <Ionicons name="close-circle" size={20} color={colors.primaryBlue} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="search" size={18} color={isDark ? '#666' : colors.textMuted} />
        )}
      </View>

      {/* Remote Type Filter Buttons */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {['All', 'Remote', 'Hybrid', 'On-site'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                remoteFilter === type && styles.filterChipActive,
              ]}
              onPress={() => setRemoteFilter(type)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  remoteFilter === type && styles.filterChipTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Job List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Finding jobs for you...</Text>
        </View>
      ) : filteredJobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name={selectedCategory === 'Saved Jobs' ? 'bookmark-outline' : 'briefcase-outline'} 
            size={60} 
            color={isDark ? '#444' : '#ccc'} 
          />
          <Text style={styles.emptyTitle}>
            {selectedCategory === 'Saved Jobs' 
              ? 'No saved jobs yet'
              : remoteFilter !== 'All'
                ? `No ${remoteFilter.toLowerCase()} jobs found`
                : 'No jobs found'
            }
          </Text>
          <Text style={styles.emptySubtitle}>
            {selectedCategory === 'Saved Jobs'
              ? 'Tap the bookmark icon on any job to save it here'
              : remoteFilter !== 'All'
                ? `Try selecting a different work type or category`
                : 'Try adjusting your filters or search criteria'
            }
          </Text>
          {remoteFilter !== 'All' && (
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setRemoteFilter('All')}
            >
              <Text style={styles.emptyButtonText}>Show All Jobs</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.jobList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primaryBlue}
            />
          }
          renderItem={({ item }) => {
            const isSaved = savedJobs.includes(item.id);
            return (
              <View style={styles.jobCard}>
                {/* Header with source badge and save button */}
                <View style={styles.jobCardHeader}>
                  <View style={[
                    styles.sourceBadge,
                    { backgroundColor: isDark ? '#2557A720' : '#2557A715' }
                  ]}>
                    <Text style={[
                      styles.sourceText,
                      { color: '#2557A7' }
                    ]}>
                      Adzuna
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
      )}
    </KeyboardAvoidingView>
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
    ...typography.heading,
    fontWeight: '800',
    color: colors.primaryBlue,
    alignSelf: 'center',
    marginBottom: 28,
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
    overflow: 'hidden',
  },
  dropdownSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  dropdownSearchInput: {
    ...typography.bodySmall,
    color: isDark ? '#fff' : colors.textDark,
    flex: 1,
    padding: 0,
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

  /* Filters */
  locationSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  locationSearchInput: {
    ...typography.bodyMedium,
    color: isDark ? '#fff' : colors.textDark,
    flex: 1,
    padding: 0,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  filtersScroll: {
    gap: 8,
    justifyContent: 'center',
  },
  filterChip: {
    backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  filterChipText: {
    ...typography.bodySmall,
    color: isDark ? '#aaa' : colors.textMuted,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  locationFilterActive: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: isDark ? '#aaa' : colors.textMuted,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyTitle: {
    ...typography.headingSmall,
    color: isDark ? '#fff' : colors.textDark,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: isDark ? '#888' : colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    ...typography.bodyMedium,
    color: '#fff',
    fontWeight: '600',
  },
});

export default Jobs;
