import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BackButton from "../components/BackButton";
import PrimaryButton from "../components/PrimaryButton";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from "../config/supabase";
import { analyzeCVWithAI, improveCV } from "../services/aiService";
import * as Clipboard from 'expo-clipboard';

type Suggestion = {
  id: string;
  category: string;
  suggestion: string;
  completed: boolean;
};

const ViewCV: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [jobRole, setJobRole] = useState<string>("");
  const [cvText, setCvText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [improvedCV, setImprovedCV] = useState<string | null>(null);
  const [improving, setImproving] = useState(false);
  const [copied, setCopied] = useState(false);


  useEffect(() => {
    loadCVData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCVData();
    setRefreshing(false);
  };

  const loadCVData = async () => {
    const role = await AsyncStorage.getItem("jobRole");
    const savedCvText = await AsyncStorage.getItem("cvText");
    
    setJobRole(role || "");
    
    // If we have saved text, use it
    if (savedCvText) {
      setCvText(savedCvText);
    }

    // Load existing analysis if available
    const userId = await AsyncStorage.getItem("userId");
    if (userId) {
      const { data, error } = await supabase
        .from('cv_suggestions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        const loadedSuggestions = data.map(item => ({
          id: item.id,
          category: item.category,
          suggestion: item.suggestion,
          completed: item.completed,
        }));
        setSuggestions(loadedSuggestions);
        setAnalyzed(true);
      }
    }
  };


  const handleAnalyzeCVDirect = async (rawText: string) => {
    if (!rawText || rawText.trim().length < 50) {
      Alert.alert(
        "CV Content Required",
        "The CV file was too short to analyze. Please try a different file.",
        [{ text: "OK" }]
      );
      setAnalyzing(false);
      return;
    }

    if (!jobRole) {
      Alert.alert(
        "Job Role Required",
        "Please set your target job role in Settings → Job Preferences first so Aya can provide relevant suggestions.",
        [{ text: "OK" }]
      );
      setAnalyzing(false);
      return;
    }

    console.log('🔍 Starting CV analysis...');
    console.log('📝 CV text length:', rawText.length);
    console.log('💼 Job role:', jobRole);

    try {
      // Save CV text for future use
      await AsyncStorage.setItem("cvText", rawText);
      setCvText(rawText);

      // Call AI service with actual CV content
      const analysis = await analyzeCVWithAI(rawText, jobRole);
      
      console.log('✅ AI analysis complete, suggestions:', analysis.suggestions?.length);
      
      // Save suggestions to database
      const userId = await AsyncStorage.getItem("userId");
      console.log('👤 User ID:', userId);
      
      if (userId && analysis.suggestions) {
        // Delete old suggestions
        await supabase
          .from('cv_suggestions')
          .delete()
          .eq('user_id', userId);

        // Insert new suggestions
        const suggestionsToInsert = analysis.suggestions.map((s: any) => ({
          user_id: userId,
          category: s.category,
          suggestion: s.suggestion,
          completed: false,
        }));

        console.log('💾 Saving suggestions to database:', suggestionsToInsert.length);

        const { data, error } = await supabase
          .from('cv_suggestions')
          .insert(suggestionsToInsert)
          .select();

        if (error) {
          console.error('❌ Database error:', error);
        }

        if (data) {
          const mappedSuggestions = data.map((item: any) => ({
            id: item.id,
            category: item.category,
            suggestion: item.suggestion,
            completed: item.completed,
          }));
          setSuggestions(mappedSuggestions);
          setAnalyzed(true);
          Alert.alert("Analysis Complete! ✅", "Aya has reviewed your CV. Check the suggestions below.");
        }
      } else if (analysis.suggestions) {
        const mappedSuggestions = analysis.suggestions.map((s: any, idx: number) => ({
          id: idx,
          category: s.category,
          suggestion: s.suggestion,
          completed: false,
        }));
        setSuggestions(mappedSuggestions);
        setAnalyzed(true);
        Alert.alert("Analysis Complete! ✅", "Aya has reviewed your CV. Check the suggestions below.");
      }
    } catch (error) {
      console.error('❌ CV Analysis error:', error);
      Alert.alert("Analysis Failed", "Something went wrong. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeCV = async () => {
    if (!cvText || cvText.trim().length < 50) {
      Alert.alert(
        "CV Content Required",
        "Please paste your CV content in the text box. We need at least 50 characters to analyze.",
        [{ text: "OK" }]
      );
      return;
    }

    if (!jobRole) {
      Alert.alert(
        "Job Role Required",
        "Please set your target job role in Settings → Job Preferences first so Aya can provide relevant suggestions.",
        [{ text: "OK" }]
      );
      return;
    }

    setAnalyzing(true);
    await handleAnalyzeCVDirect(cvText);
  };

  const toggleSuggestionComplete = async (id: string) => {
    try {
      // Find the suggestion to get current status
      const suggestion = suggestions.find(s => s.id === id);
      if (!suggestion) return;

      // Update in database
      await supabase
        .from('cv_suggestions')
        .update({ completed: !suggestion.completed })
        .eq('id', id);

      // Update local state
      setSuggestions(prev =>
        prev.map(s => (s.id === id ? { ...s, completed: !s.completed } : s))
      );
    } catch (error) {
      console.error('Error updating suggestion:', error);
    }
  };

  const completedCount = suggestions.filter(s => s.completed).length;
  const totalCount = suggestions.length;

  const handleImproveCV = async () => {
    if (!cvText || cvText.trim().length < 50) {
      Alert.alert("Error", "Please paste your CV content first.");
      return;
    }

    if (!jobRole) {
      Alert.alert(
        "Job Role Required",
        "Please set your target job role in Job Preferences first.",
        [{ text: "OK" }]
      );
      return;
    }

    setImproving(true);

    try {
      console.log('🎨 Generating improved CV for role:', jobRole);
      
      // Call AI service to improve CV
      const improvedCVText = await improveCV(cvText, jobRole);
      
      console.log('✅ Improved CV generated, length:', improvedCVText.length);
      
      setImprovedCV(improvedCVText);
      
      // Auto-check all suggestions when improved version is created
      const userId = await AsyncStorage.getItem("userId");
      if (userId && suggestions.length > 0) {
        // Mark all as completed in database
        const suggestionIds = suggestions.map(s => s.id);
        await supabase
          .from('cv_suggestions')
          .update({ completed: true })
          .in('id', suggestionIds);
        
        // Update local state
        setSuggestions(prev => prev.map(s => ({ ...s, completed: true })));
        console.log('✅ All suggestions marked as complete');
      }
      
      Alert.alert(
        "CV Improved! ✨",
        "Aya has rewritten your CV with all the improvements. Scroll down to view and copy it!",
        [{ text: "View" }]
      );
    } catch (error) {
      console.error('Error improving CV:', error);
      Alert.alert(
        "Error",
        "Aya couldn't improve your CV. Please try again or contact support."
      );
    } finally {
      setImproving(false);
    }
  };

  const handleCopyImprovedCV = async () => {
    if (!improvedCV) return;
    
    try {
      await Clipboard.setStringAsync(improvedCV);
      setCopied(true);
      Alert.alert("Copied! 📋", "Improved CV copied to clipboard. You can now paste it anywhere!");
      
      // Reset copied state after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert("Error", "Couldn't copy to clipboard. Please try again.");
    }
  };

  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <ScrollView 
      style={styles.root} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primaryBlue}
          colors={[colors.primaryBlue]}
        />
      }
    >
      <BackButton />
      <Text style={styles.logoText}>MY INTERVIEW</Text>

      <Text style={styles.title}>Your CV</Text>
      <Text style={styles.subtitle}>
        Let Aya analyze your CV and suggest improvements for {jobRole || "your target role"}
      </Text>

      {/* CV Info Card */}
      <View style={styles.card}>
        <View style={styles.cvHeader}>
          <Ionicons name="document-text" size={40} color={colors.primaryBlue} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.cvFileName}>CV Upload (Coming Soon)</Text>
            <Text style={styles.cvSubtext}>
              Paste your CV below to get started
            </Text>
          </View>
        </View>

        {/* Upload CV Button - Coming Soon */}
        <TouchableOpacity
          style={styles.uploadButtonDisabled}
          disabled={true}
        >
          <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
          <Text style={styles.uploadButtonText}>Upload CV File</Text>
        </TouchableOpacity>
        
        {/* File Type Info */}
        <View style={styles.comingSoonBanner}>
          <Ionicons name="checkmark-circle" size={18} color={colors.primaryBlue} />
          <Text style={styles.comingSoonText}>
            CV upload is coming soon. For now, paste your CV below.
          </Text>
        </View>

        <View style={styles.textInputContainer}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>Paste your CV content</Text>
            {!!cvText && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setCvText("");
                  AsyncStorage.removeItem("cvText");
                }}
              >
                <Ionicons name="close-circle" size={16} color={isDark ? "#666" : "#999"} />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.cvTextInput}
            value={cvText}
            onChangeText={(text) => {
              setCvText(text);
              AsyncStorage.setItem("cvText", text);
            }}
            placeholder="Paste your CV content here..."
            placeholderTextColor={isDark ? "#666" : "#999"}
            multiline
          />
          <Text style={styles.inputHint}>Minimum 50 characters required for analysis.</Text>
        </View>

        <PrimaryButton
          title={analyzing ? "Analyzing..." : "Analyze CV"}
          onPress={handleAnalyzeCV}
          loading={analyzing}
        />


        {analyzing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
            <Text style={styles.loadingText}>Aya is reading your CV...</Text>
          </View>
        )}

        {/* Analysis Results - Inside the same card */}
        {analyzed && suggestions.length > 0 && (
          <>
            {/* Progress Section */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>
                  Progress: {completedCount} of {totalCount} complete
                </Text>
                <Text style={styles.progressPercent}>{progressPercent}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[styles.progressBar, { width: `${progressPercent}%` }]}
                />
              </View>
            </View>

            {/* Suggestions Section */}
            <View style={styles.suggestionsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✨ Aya's Suggestions</Text>
                <Text style={styles.sectionSubtitle}>
                  Tap to mark as complete
                </Text>
              </View>

              {/* Generate Improved CV Button */}
              <View style={{ marginTop: 12, marginBottom: 12 }}>
                <PrimaryButton
                  title={improving ? "Generating..." : "Generate Improved CV ✨"}
                  onPress={handleImproveCV}
                  loading={improving}
                />
              </View>

              {/* Improved CV Section - now directly under Generate button */}
              {improvedCV && (
                <View style={styles.improvedSection}>
                  <View style={styles.improvedHeader}>
                    <Ionicons name="sparkles" size={24} color={colors.primaryBlue} />
                    <Text style={styles.improvedTitle}>Your Improved CV</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={handleCopyImprovedCV}
                  >
                    <Ionicons name="download" size={20} color="#fff" />
                    <Text style={styles.downloadButtonText}>
                      {copied ? "Copied!" : "Copy Improved CV"}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.improvedCVContainer}>
                    <ScrollView 
                      style={styles.improvedCVScroll}
                      nestedScrollEnabled={true}
                    >
                      <Text style={styles.improvedCVText}>{improvedCV}</Text>
                    </ScrollView>
                  </View>
                  <TouchableOpacity
                    style={[styles.copyButton, copied && styles.copyButtonSuccess]}
                    onPress={handleCopyImprovedCV}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={copied ? "checkmark-circle" : "copy-outline"} 
                      size={20} 
                      color={copied ? "#10b981" : colors.primaryBlue} 
                    />
                    <Text style={[styles.copyButtonText, copied && styles.copyButtonTextSuccess]}>
                      {copied ? "Copied!" : "Copy to Clipboard"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

                {suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={styles.suggestionRow}
                  onPress={() => toggleSuggestionComplete(suggestion.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      suggestion.completed && {
                        backgroundColor: colors.primaryBlue,
                        borderColor: colors.primaryBlue,
                      },
                    ]}
                  >
                    {suggestion.completed && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionCategory}>
                      {suggestion.category}
                    </Text>
                    <Text
                      style={[
                        styles.suggestionText,
                        suggestion.completed && styles.suggestionTextCompleted,
                      ]}
                    >
                      {suggestion.suggestion}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Re-analyze Button */}
            <TouchableOpacity
              style={styles.reanalyzeButton}
              onPress={handleAnalyzeCV}
              disabled={analyzing}
            >
              <Ionicons name="refresh" size={20} color={colors.primaryBlue} />
              <Text style={styles.reanalyzeText}>Re-analyze CV</Text>
            </TouchableOpacity>
          </>
        )}


        {analyzed && suggestions.length === 0 && !improvedCV && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              🎉 Your CV looks great! Aya couldn't find any specific suggestions at this time.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? "#0f0f0f" : "#F3F4F6",
    },
    content: {
      paddingHorizontal: 20,
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
    },
    subtitle: {
      ...typography.bodySmall,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginTop: 4,
      marginBottom: 16,
    },
    card: {
      backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cvHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    cvFileName: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: isDark ? "#fff" : colors.textDark,
    },
    cvSubtext: {
      ...typography.caption,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginTop: 4,
    },
    comingSoonBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#1a2332" : "#EFF6FF",
      borderWidth: 1,
      borderColor: isDark ? "#2563eb" : "#BFDBFE",
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      gap: 8,
    },
    comingSoonText: {
      ...typography.caption,
      color: isDark ? "#93C5FD" : "#1E40AF",
      flex: 1,
      lineHeight: 18,
    },
    uploadButtonDisabled: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#2a2a2a" : "#D1D5DB",
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 20,
      marginBottom: 8,
      gap: 10,
      opacity: 0.7,
    },
    uploadButtonText: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: "#fff",
    },
    uploadHint: {
      ...typography.caption,
      color: isDark ? "#888" : colors.textMuted,
      textAlign: "center",
      marginBottom: 16,
    },
    textInputContainer: {
      marginVertical: 16,
    },
    inputHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    inputLabel: {
      ...typography.bodySmall,
      fontWeight: "600",
      color: isDark ? "#fff" : colors.textDark,
      flex: 1,
    },
    clearButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    clearButtonText: {
      ...typography.caption,
      color: isDark ? "#666" : "#999",
      fontSize: 12,
    },
    cvTextInput: {
      backgroundColor: isDark ? "#1a1a1a" : "#F9FAFB",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E5E7EB",
      borderRadius: 8,
      padding: 12,
      minHeight: 120,
      maxHeight: 200,
      color: isDark ? "#fff" : colors.textDark,
      ...typography.bodySmall,
      fontSize: 13,
    },
    inputHint: {
      ...typography.caption,
      color: isDark ? "#888" : colors.textMuted,
      marginTop: 6,
      fontStyle: "italic",
    },
    loadingContainer: {
      alignItems: "center",
      paddingVertical: 20,
    },
    loadingText: {
      ...typography.bodySmall,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginTop: 12,
    },
    progressSection: {
      marginTop: 24,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#2a2a2a" : "#E5E7EB",
    },
    suggestionsSection: {
      marginTop: 20,
    },
    emptyState: {
      paddingVertical: 20,
      alignItems: "center",
    },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    progressTitle: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: isDark ? "#fff" : colors.textDark,
    },
    progressPercent: {
      ...typography.bodyMedium,
      fontWeight: "700",
      color: colors.primaryBlue,
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: isDark ? "#2a2a2a" : "#E5E7EB",
      borderRadius: 4,
      overflow: "hidden",
    },
    progressBar: {
      height: "100%",
      backgroundColor: colors.primaryBlue,
      borderRadius: 4,
    },
    sectionHeader: {
      marginBottom: 16,
    },
    sectionTitle: {
      ...typography.bodyMedium,
      fontWeight: "700",
      color: isDark ? "#fff" : colors.textDark,
      marginBottom: 4,
    },
    sectionSubtitle: {
      ...typography.caption,
      color: isDark ? "#b5b5b5" : colors.textMuted,
    },
    suggestionRow: {
      flexDirection: "row",
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#2a2a2a" : "#E5E7EB",
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: isDark ? "#444" : "#D1D5DB",
      marginRight: 12,
      marginTop: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    suggestionCategory: {
      ...typography.caption,
      fontSize: 11,
      fontWeight: "600",
      color: colors.primaryBlue,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    suggestionText: {
      ...typography.bodySmall,
      color: isDark ? "#d1d1d1" : colors.textDark,
      lineHeight: 20,
    },
    suggestionTextCompleted: {
      textDecorationLine: "line-through",
      color: isDark ? "#6B7280" : "#9CA3AF",
    },
    emptyText: {
      ...typography.bodyMedium,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      textAlign: "center",
      paddingVertical: 20,
    },
    reanalyzeButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      marginBottom: 20,
    },
    reanalyzeText: {
      ...typography.bodyMedium,
      color: colors.primaryBlue,
      fontWeight: "600",
    },
    improvedSection: {
      marginTop: 24,
      backgroundColor: isDark ? "#1a1a1a" : "#fff",
      borderRadius: 16,
      padding: 20,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    improvedHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 16,
    },
    improvedTitle: {
      ...typography.heading,
      fontSize: 20,
      color: isDark ? "#fff" : colors.textDark,
      fontWeight: "700",
    },
    improvedComingSoonBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: isDark ? "#2a2a2a" : "#F3F4F6",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 16,
    },
    improvedComingSoonText: {
      ...typography.bodySmall,
      color: colors.textMuted,
      fontStyle: "italic",
    },
    downloadButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.primaryBlue,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      marginBottom: 16,
    },
    downloadButtonText: {
      ...typography.bodyMedium,
      color: "#fff",
      fontWeight: "600",
    },
    improvedCVContainer: {
      backgroundColor: isDark ? "#0f0f0f" : "#F9FAFB",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      maxHeight: 400,
      borderWidth: 1,
      borderColor: isDark ? "#2a2a2a" : "#E5E7EB",
    },
    improvedCVScroll: {
      maxHeight: 380,
    },
    improvedCVText: {
      ...typography.bodyMedium,
      color: isDark ? "#d1d1d1" : colors.textDark,
      lineHeight: 22,
    },
    copyButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: isDark ? "#2a2a2a" : colors.primaryBlue + "15",
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primaryBlue,
    },
    copyButtonSuccess: {
      backgroundColor: "#10b981" + "15",
      borderColor: "#10b981",
    },
    copyButtonText: {
      ...typography.bodyMedium,
      color: colors.primaryBlue,
      fontWeight: "600",
    },
    copyButtonTextSuccess: {
      color: "#10b981",
    },
  });

export default ViewCV;
