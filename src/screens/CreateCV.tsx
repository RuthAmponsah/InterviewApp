import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { cleanGeneratedCVText, createCVFromDetails, NewCVDetails } from "../services/aiService";
import { supabase } from "../config/supabase";

const DRAFT_KEY = "createCVDraft";

const emptyDetails: NewCVDetails = {
  fullName: "",
  targetRole: "",
  contact: "",
  profile: "",
  experience: "",
  education: "",
  skills: "",
  certifications: "",
  achievements: "",
  extraDetails: "",
};

const fields: Array<{
  key: keyof NewCVDetails;
  label: string;
  placeholder: string;
  minHeight?: number;
}> = [
  { key: "fullName", label: "Full name", placeholder: "e.g. Ruth Amponsah" },
  { key: "targetRole", label: "Target role", placeholder: "e.g. Primary Teacher" },
  { key: "contact", label: "Contact details", placeholder: "Email, phone, city, LinkedIn" },
  {
    key: "profile",
    label: "Profile",
    placeholder: "A short summary of your background, strengths and goals",
    minHeight: 90,
  },
  {
    key: "experience",
    label: "Experience",
    placeholder: "Job titles, employers, dates, responsibilities and achievements",
    minHeight: 130,
  },
  {
    key: "education",
    label: "Education",
    placeholder: "Schools, universities, courses, dates and grades if useful",
    minHeight: 100,
  },
  {
    key: "skills",
    label: "Skills",
    placeholder: "Technical skills, tools, soft skills, languages",
    minHeight: 100,
  },
  {
    key: "certifications",
    label: "Certifications and training",
    placeholder: "Certificates, training, licences, safeguarding, first aid etc.",
    minHeight: 90,
  },
  {
    key: "achievements",
    label: "Achievements",
    placeholder: "Awards, results, projects, measurable impact",
    minHeight: 90,
  },
  {
    key: "extraDetails",
    label: "Anything else",
    placeholder: "Volunteering, interests, references, gaps, career change notes",
    minHeight: 90,
  },
];

type SavedCVDraft = {
  id: string;
  title: string;
  target_role: string | null;
  cv_text: string;
  input_details: Partial<NewCVDetails> | null;
  created_at: string;
  updated_at: string;
};

export default function CreateCV({ navigation }: any) {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  const [details, setDetails] = useState<NewCVDetails>(emptyDetails);
  const [generatedCV, setGeneratedCV] = useState("");
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<SavedCVDraft[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadDraft = async () => {
      const saved = await AsyncStorage.getItem(DRAFT_KEY);
      if (saved) {
        setDetails({ ...emptyDetails, ...JSON.parse(saved) });
      }
    };

    loadDraft();
    loadSavedDrafts();
  }, []);

  const getUserId = async () => {
    const { data } = await supabase.auth.getUser();
    return data.user?.id || AsyncStorage.getItem("userId");
  };

  const loadSavedDrafts = async () => {
    setLoadingDrafts(true);
    try {
      const userId = await getUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from("cv_drafts")
        .select("id,title,target_role,cv_text,input_details,created_at,updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error loading CV drafts:", error);
        return;
      }

      setSavedDrafts((data || []) as SavedCVDraft[]);
    } finally {
      setLoadingDrafts(false);
    }
  };

  const saveGeneratedDraft = async (cvText: string) => {
    const userId = await getUserId();
    if (!userId) {
      Alert.alert("Saved on this device", "Sign in to sync CV drafts across devices.");
      return null;
    }

    const titleName = details.fullName.trim() || "New CV";
    const roleName = details.targetRole.trim();
    const title = roleName ? `${titleName} - ${roleName}` : titleName;

    const { data, error } = await supabase
      .from("cv_drafts")
      .insert({
        user_id: userId,
        title,
        target_role: roleName || null,
        input_details: details,
        cv_text: cvText,
      })
      .select("id,title,target_role,cv_text,input_details,created_at,updated_at")
      .single();

    if (error) {
      console.error("Error saving CV draft:", error);
      Alert.alert("CV Created", "Aya created the CV, but it could not sync to your account yet.");
      return null;
    }

    setSelectedDraftId(data.id);
    setSavedDrafts((current) => [data as SavedCVDraft, ...current]);
    return data as SavedCVDraft;
  };

  const updateField = async (key: keyof NewCVDetails, value: string) => {
    const nextDetails = { ...details, [key]: value };
    setDetails(nextDetails);
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(nextDetails));
  };

  const handleGenerate = async () => {
    const hasUsefulDetails =
      details.fullName.trim() ||
      details.targetRole.trim() ||
      details.experience.trim() ||
      details.education.trim() ||
      details.skills.trim();

    if (!hasUsefulDetails) {
      Alert.alert("Add Details", "Add at least your target role, experience, education or skills first.");
      return;
    }

    setGenerating(true);
    try {
      const cv = cleanGeneratedCVText(await createCVFromDetails(details));
      setGeneratedCV(cv);
      await saveGeneratedDraft(cv);
    } catch (error) {
      console.error("Error creating CV:", error);
      Alert.alert("Could Not Create CV", "Aya couldn't create the CV. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenDraft = async (draft: SavedCVDraft) => {
    setSelectedDraftId(draft.id);
    setGeneratedCV(cleanGeneratedCVText(draft.cv_text));
    setDetails({ ...emptyDetails, ...(draft.input_details || {}) });
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ ...emptyDetails, ...(draft.input_details || {}) }));
  };

  const handleDeleteDraft = async (draftId: string) => {
    const { error } = await supabase.from("cv_drafts").delete().eq("id", draftId);
    if (error) {
      console.error("Error deleting CV draft:", error);
      Alert.alert("Could Not Delete", "This CV draft could not be deleted.");
      return;
    }

    setSavedDrafts((current) => current.filter((draft) => draft.id !== draftId));
    if (selectedDraftId === draftId) {
      setSelectedDraftId(null);
      setGeneratedCV("");
    }
  };

  const handleCopy = async () => {
    if (!generatedCV) return;
    await Clipboard.setStringAsync(cleanGeneratedCVText(generatedCV));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleUseInCVTool = async () => {
    if (!generatedCV) return;
    await AsyncStorage.setItem("cvText", cleanGeneratedCVText(generatedCV));
    await AsyncStorage.setItem("cvFileName", "New CV created with Aya");
    Alert.alert("Saved", "This CV is now loaded in the CV tool.", [
      { text: "Open CV Tool", onPress: () => navigation.navigate("ViewCV") },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <ScreenHeader />

        <Text style={styles.title}>Create CV</Text>
        <Text style={styles.subtitle}>
          Add the facts. Aya will turn them into a standout, human CV without inventing details.
        </Text>

        <View style={styles.savedCard}>
          <View style={styles.savedHeader}>
            <View>
              <Text style={styles.savedTitle}>Saved CV drafts</Text>
              <Text style={styles.savedSubtitle}>Synced to your account</Text>
            </View>
            <TouchableOpacity onPress={loadSavedDrafts} accessibilityLabel="Refresh CV drafts">
              <Ionicons name="refresh" size={20} color={colors.primaryBlue} />
            </TouchableOpacity>
          </View>

          {loadingDrafts ? (
            <ActivityIndicator color={colors.primaryBlue} />
          ) : savedDrafts.length > 0 ? (
            savedDrafts.map((draft) => (
              <TouchableOpacity
                key={draft.id}
                style={[styles.draftRow, selectedDraftId === draft.id && styles.draftRowActive]}
                onPress={() => handleOpenDraft(draft)}
                activeOpacity={0.85}
              >
                <Ionicons name="document-text-outline" size={20} color={colors.primaryBlue} />
                <View style={styles.draftTextWrap}>
                  <Text style={styles.draftTitle} numberOfLines={1}>{draft.title}</Text>
                  <Text style={styles.draftMeta} numberOfLines={1}>
                    {draft.target_role || "General CV"} · {new Date(draft.updated_at).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteDraft(draft.id)}
                  accessibilityLabel="Delete CV draft"
                >
                  <Ionicons name="trash-outline" size={18} color={isDark ? "#FCA5A5" : "#DC2626"} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyDrafts}>No saved CV drafts yet.</Text>
          )}
        </View>

        <View style={styles.card}>
          {fields.map((field) => (
            <View key={field.key} style={styles.fieldBlock}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={[styles.input, field.minHeight ? { minHeight: field.minHeight } : null]}
                value={details[field.key]}
                onChangeText={(value) => updateField(field.key, value)}
                placeholder={field.placeholder}
                placeholderTextColor={isDark ? "#666" : "#9CA3AF"}
                multiline={Boolean(field.minHeight)}
                textAlignVertical="top"
              />
            </View>
          ))}

          <PrimaryButton
            title={generating ? "Creating..." : "Create New CV Draft"}
            onPress={handleGenerate}
            loading={generating}
          />

          {generating && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primaryBlue} />
              <Text style={styles.loadingText}>Aya is building your CV...</Text>
            </View>
          )}
        </View>

        {!!generatedCV && (
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Ionicons name="document-text-outline" size={22} color={colors.primaryBlue} />
              <Text style={styles.previewTitle}>New CV Draft</Text>
            </View>
            <View style={styles.warningBanner}>
              <Ionicons name="warning-outline" size={18} color="#B45309" />
              <Text style={styles.warningText}>
                Double-check all dates, employers and qualifications before sending.
              </Text>
            </View>
            <ScrollView style={styles.previewScroll} nestedScrollEnabled>
              <Text style={styles.previewText}>{generatedCV}</Text>
            </ScrollView>

            <TouchableOpacity style={styles.primaryAction} onPress={handleUseInCVTool}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.primaryActionText}>Use in CV Tool</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
              <Ionicons
                name={copied ? "checkmark-circle" : "copy-outline"}
                size={20}
                color={colors.primaryBlue}
              />
              <Text style={styles.copyButtonText}>{copied ? "Copied" : "Copy CV"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? "#0f0f0f" : "#F3F4F6",
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    title: {
      ...typography.headingMedium,
      textAlign: "center",
      color: isDark ? "#fff" : colors.textDark,
    },
    subtitle: {
      ...typography.bodySmall,
      textAlign: "center",
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginTop: 4,
      marginBottom: 16,
    },
    card: {
      backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? "#2a2a2a" : "#E5E7EB",
    },
    savedCard: {
      backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? "#2a2a2a" : "#E5E7EB",
    },
    savedHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    savedTitle: {
      ...typography.bodyMedium,
      color: isDark ? "#fff" : colors.textDark,
      fontWeight: "700",
    },
    savedSubtitle: {
      ...typography.caption,
      color: isDark ? "#aaa" : colors.textMuted,
      marginTop: 2,
    },
    draftRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: isDark ? "#141414" : "#F9FAFB",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E5E7EB",
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    draftRowActive: {
      borderColor: colors.primaryBlue,
      backgroundColor: isDark ? "#162033" : "#EFF6FF",
    },
    draftTextWrap: {
      flex: 1,
    },
    draftTitle: {
      ...typography.bodySmall,
      color: isDark ? "#fff" : colors.textDark,
      fontWeight: "700",
    },
    draftMeta: {
      ...typography.caption,
      color: isDark ? "#aaa" : colors.textMuted,
      marginTop: 2,
    },
    deleteButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#271717" : "#FEF2F2",
    },
    emptyDrafts: {
      ...typography.bodySmall,
      color: isDark ? "#aaa" : colors.textMuted,
      textAlign: "center",
      paddingVertical: 12,
    },
    fieldBlock: {
      marginBottom: 14,
    },
    label: {
      ...typography.bodySmall,
      color: isDark ? "#fff" : colors.textDark,
      fontWeight: "700",
      marginBottom: 6,
    },
    input: {
      backgroundColor: isDark ? "#141414" : "#F9FAFB",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E5E7EB",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 11,
      color: isDark ? "#fff" : colors.textDark,
      ...typography.bodySmall,
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingTop: 16,
    },
    loadingText: {
      ...typography.bodySmall,
      color: isDark ? "#b5b5b5" : colors.textMuted,
    },
    previewCard: {
      backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: isDark ? "#2a2a2a" : "#E5E7EB",
    },
    previewHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    previewTitle: {
      ...typography.headingSmall,
      color: isDark ? "#fff" : colors.textDark,
      fontWeight: "700",
    },
    warningBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      backgroundColor: isDark ? "#33220f" : "#FFFBEB",
      borderWidth: 1,
      borderColor: isDark ? "#92400E" : "#FCD34D",
      borderRadius: 10,
      padding: 12,
      marginBottom: 14,
    },
    warningText: {
      ...typography.caption,
      color: isDark ? "#FBBF24" : "#92400E",
      flex: 1,
      lineHeight: 18,
    },
    previewScroll: {
      maxHeight: 420,
      backgroundColor: isDark ? "#111" : "#F9FAFB",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E5E7EB",
      borderRadius: 12,
      padding: 14,
      marginBottom: 14,
    },
    previewText: {
      ...typography.bodySmall,
      color: isDark ? "#d1d1d1" : colors.textDark,
      lineHeight: 21,
    },
    primaryAction: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primaryBlue,
      borderRadius: 12,
      paddingVertical: 14,
      marginBottom: 10,
    },
    primaryActionText: {
      ...typography.bodyMedium,
      color: "#fff",
      fontWeight: "700",
    },
    copyButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: colors.primaryBlue,
      borderRadius: 12,
      paddingVertical: 13,
    },
    copyButtonText: {
      ...typography.bodyMedium,
      color: colors.primaryBlue,
      fontWeight: "700",
    },
  });
