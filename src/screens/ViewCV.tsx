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
  Modal,
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
import * as DocumentPicker from 'expo-document-picker';

// Conditional import for native module (only works in development builds, not Expo Go)
let ReactNativeBlobUtil: any = null;
try {
  ReactNativeBlobUtil = require('react-native-blob-util').default;
} catch (e) {
  console.log('react-native-blob-util not available (Expo Go mode)');
}

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

  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [cvUri, setCvUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [jobRole, setJobRole] = useState<string>("");
  const [showTextInput, setShowTextInput] = useState(false);
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
    const uri = await AsyncStorage.getItem("cvUri");
    const fileName = await AsyncStorage.getItem("cvFileName");
    const role = await AsyncStorage.getItem("jobRole");
    const savedCvText = await AsyncStorage.getItem("cvText");
    
    setCvUri(uri);
    setCvFileName(fileName || "CV.pdf");
    setJobRole(role || "");
    
    // If we have saved text, use it
    if (savedCvText) {
      setCvText(savedCvText);
    } else if (uri && !ReactNativeBlobUtil) {
      // If no saved text and using Expo Go, show prompt once
      console.log('CV uploaded but text extraction requires development build');
      setShowTextInput(true);
    } else if (uri && ReactNativeBlobUtil) {
      // Try to extract text from the uploaded file (development build only)
      await extractTextFromFile(uri);
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

  const extractTextFromFile = async (fileUri: string) => {
    // This function should only be called if ReactNativeBlobUtil is available
    // (i.e., in a development build, not Expo Go)
    
    if (!ReactNativeBlobUtil) {
      // Should not reach here due to check in loadCVData, but just in case
      console.log('ReactNativeBlobUtil not available');
      return;
    }

    try {
      console.log('Attempting to extract text from:', fileUri);
      
      // Read file using react-native-blob-util
      const base64Data = await ReactNativeBlobUtil.fs.readFile(fileUri, 'base64');
      
      // Try to decode as UTF-8 text using atob (base64 decode)
      const decodedText = atob(base64Data);
      
      // Check if it's readable text (not binary)
      if (decodedText && decodedText.length > 50 && /[a-zA-Z]/.test(decodedText)) {
        // Clean up the text (remove null bytes and control characters)
        const cleanedText = decodedText
          .replace(/\0/g, '')
          .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleanedText.length > 100) {
          console.log('Successfully extracted text, length:', cleanedText.length);
          setCvText(cleanedText);
          await AsyncStorage.setItem('cvText', cleanedText);
          return;
        }
      }
      
      // If we couldn't extract text, just show the text input (no alert)
      console.log('Could not extract text automatically - file may be PDF/DOCX');
      setShowTextInput(true);
    } catch (error) {
      console.error('Error extracting text:', error);
      // On error, just show the text input (no alert)
      setShowTextInput(true);
    }
  };

  const handleAnalyzeCV = async () => {
    // Don't require cvUri anymore - just need text
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

    console.log('🔍 Starting CV analysis...');
    console.log('📝 CV text length:', cvText.length);
    console.log('💼 Job role:', jobRole);

    setAnalyzing(true);

    try {
      // Save CV text for future use
      await AsyncStorage.setItem("cvText", cvText);

      // Call AI service with actual CV content
      const analysis = await analyzeCVWithAI(cvText, jobRole);
      
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
        // Fallback if no userId
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

  const handleUploadCV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Save file info
        await AsyncStorage.setItem("cvUri", file.uri);
        await AsyncStorage.setItem("cvFileName", file.name);
        await AsyncStorage.setItem("cvMimeType", file.mimeType || 'application/pdf');
        
        setCvUri(file.uri);
        setCvFileName(file.name);
        
        // Try to extract text if possible
        if (file.mimeType === 'text/plain' || file.name.endsWith('.txt')) {
          // For text files, read directly
          try {
            const response = await fetch(file.uri);
            const text = await response.text();
            if (text && text.length > 10) {
              setCvText(text);
              await AsyncStorage.setItem('cvText', text);
              Alert.alert("Success! ✅", "CV uploaded and text extracted. Click 'Analyze with Aya' to get feedback.");
              return;
            }
          } catch (e) {
            console.log('Could not read text file:', e);
          }
        }
        
        // For PDF/DOC files, try to extract text
        if (ReactNativeBlobUtil) {
          await extractTextFromFile(file.uri);
          const extractedText = await AsyncStorage.getItem('cvText');
          if (extractedText && extractedText.length > 50) {
            Alert.alert("Success! ✅", "CV uploaded and text extracted. Click 'Analyze with Aya' to get feedback.");
            return;
          }
        }
        
        // If text extraction didn't work, prompt user to paste
        setShowTextInput(true);
        Alert.alert(
          "CV Uploaded 📄",
          "Your file has been uploaded, but we couldn't extract the text automatically. Please paste your CV content in the text box below.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Error uploading CV:', error);
      Alert.alert("Error", "Failed to upload CV. Please try again.");
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
            <Text style={styles.cvFileName}>{cvFileName}</Text>
            <Text style={styles.cvSubtext}>
              {analyzed ? "Analysis complete" : "Ready for analysis"}
            </Text>
          </View>
        </View>

        {/* Upload CV Button - Coming Soon */}
        <TouchableOpacity
          style={[styles.uploadButton, { opacity: 0.5 }]}
          onPress={() => Alert.alert("Coming Soon! 🚀", "Auto-extraction from PDF and DOCX files is coming soon. For now, please paste your CV text in the box below.")}
        >
          <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
          <Text style={styles.uploadButtonText}>Upload CV File</Text>
          <View style={styles.comingSoonPill}>
            <Text style={styles.comingSoonPillText}>Soon</Text>
          </View>
        </TouchableOpacity>
        
        {/* Coming Soon Banner */}
        <View style={styles.comingSoonBanner}>
          <Ionicons name="time-outline" size={18} color={isDark ? "#93C5FD" : "#1E40AF"} />
          <Text style={styles.comingSoonText}>
            Auto-extraction from PDF/DOCX coming soon! For now, please paste your CV text below.
          </Text>
        </View>

        {/* Text Input for CV Content */}
        <View style={styles.textInputContainer}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>
              📝 Paste your CV text here:
            </Text>
            {cvText.length > 0 && (
              <TouchableOpacity
                onPress={() => setCvText('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={isDark ? "#666" : "#999"} />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.cvTextInput}
            multiline
            numberOfLines={8}
            placeholder="Paste your CV content here (work experience, skills, education, etc.)..."
            placeholderTextColor={isDark ? "#666" : "#999"}
            value={cvText}
            onChangeText={setCvText}
            textAlignVertical="top"
          />
          <Text style={styles.inputHint}>
            💡 Tip: Copy text from your CV and paste here. More detail = better suggestions!
          </Text>
        </View>

        {!analyzed && (
          <PrimaryButton
            title={analyzing ? "Analyzing..." : "🔍 Analyze with Aya"}
            onPress={handleAnalyzeCV}
            disabled={analyzing}
          />
        )}

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
                  <View style={styles.improvedComingSoonBanner}>
                    <Ionicons name="time-outline" size={20} color={colors.textMuted} />
                    <Text style={styles.improvedComingSoonText}>
                      Coming Soon: Download as DOCX file
                    </Text>
                  </View>
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
    uploadButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryBlue,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 20,
      marginBottom: 8,
      gap: 10,
    },
    uploadButtonText: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: "#fff",
    },
    comingSoonPill: {
      backgroundColor: "rgba(255,255,255,0.25)",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 4,
    },
    comingSoonPillText: {
      ...typography.caption,
      fontSize: 10,
      fontWeight: "700",
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
