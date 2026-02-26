# AI CV Analysis Feature - Implementation Guide

## Overview

The "Upload your CV for AI analysis" feature lets users:
1. Upload PDF/DOCX CV files
2. AI analyzes the CV content
3. Provides improvement suggestions
4. Shows missing skills/keywords vs job role
5. Generates improved CV version

---

## Current Status ✅

You **already have the backend setup** (database table exists):

```sql
CREATE TABLE user_cvs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    extracted_text TEXT,
    original_content BYTEA,
    file_size INT,
    mime_type TEXT DEFAULT 'application/pdf',
    analyzed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);
```

---

## Option A: Complete the Feature (Recommended for v1.1+)

### What's Missing

- UI screen for CV upload
- File picker integration  
- PDF/DOCX parsing
- AI analysis integration
- Improvement suggestions display

### Implementation Steps

#### Step 1: Create CV Upload Screen

Create `src/screens/Profile/CVUpload.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../config/supabase';
import { useTheme } from '../../theme/ThemeContext';
import PrimaryButton from '../../components/PrimaryButton';

export default function CVUpload() {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(false);
  const [cvFile, setCVFile] = useState<any>(null);

  const handlePickCV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });

      if (result.type === 'success') {
        setCVFile(result);
        Alert.alert('Success', `CV selected: ${result.name}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleUploadCV = async () => {
    if (!cvFile) {
      Alert.alert('Error', 'Please select a CV first');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload file to Supabase storage
      const userId = await AsyncStorage.getItem('userId');
      const fileName = `${userId}_${Date.now()}_${cvFile.name}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('user-cvs')
        .upload(fileName, cvFile);

      if (uploadError) throw uploadError;

      // 2. Save metadata to user_cvs table
      const { error: dbError } = await supabase
        .from('user_cvs')
        .upsert({
          user_id: userId,
          file_name: cvFile.name,
          file_path: data?.path,
          file_size: cvFile.size,
          mime_type: cvFile.mimeType,
          analyzed: false,
        });

      if (dbError) throw dbError;

      Alert.alert('Success', 'CV uploaded! AI analysis starting...');
      
      // 3. TODO: Trigger AI analysis via Supabase Edge Function
      // This would call a function to parse CV and generate suggestions
      
    } catch (error) {
      Alert.alert('Error', 'Failed to upload CV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f0f0f' : '#fff' }]}>
      <Text style={styles.title}>Upload Your CV</Text>
      <Text style={styles.subtitle}>Let AI analyze and improve your CV</Text>

      <TouchableOpacity 
        style={[styles.uploadBox, !cvFile && styles.uploadBoxEmpty]}
        onPress={handlePickCV}
      >
        <Text style={styles.uploadText}>
          {cvFile ? `📄 ${cvFile.name}` : '📥 Tap to select CV'}
        </Text>
      </TouchableOpacity>

      <PrimaryButton
        title="Upload & Analyze"
        onPress={handleUploadCV}
        loading={loading}
        disabled={!cvFile || loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#999', marginBottom: 20 },
  uploadBox: { 
    padding: 40, 
    borderWidth: 2, 
    borderDashed: true,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadBoxEmpty: { borderColor: '#ddd', backgroundColor: '#f9f9f9' },
  uploadText: { fontSize: 16, fontWeight: '600' },
});
```

#### Step 2: Create AI CV Analysis Service

Create `src/services/cvAnalysisService.ts`:

```typescript
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const analyzeCV = async (cvText: string, jobRole: string) => {
  try {
    const prompt = `
    Analyze this CV for a ${jobRole} position. 
    
    CV Content:
    ${cvText}
    
    Provide:
    1. Missing keywords for this role
    2. Skills gaps
    3. Experience gaps
    4. Formatting improvements
    5. 5 specific improvement suggestions
    
    Format as JSON with these exact keys:
    {
      "missingKeywords": ["keyword1", "keyword2"],
      "skillsGaps": ["skill1", "skill2"],
      "improvements": [
        { "title": "...", "description": "..." },
        ...
      ]
    }
    `;

    // Call your AI API (Groq, OpenAI, etc.)
    const response = await callAIAPI(prompt);
    
    // Save suggestions to cv_suggestions table
    const userId = await AsyncStorage.getItem('userId');
    const suggestions = JSON.parse(response);
    
    for (const improvement of suggestions.improvements) {
      await supabase.from('cv_suggestions').insert({
        user_id: userId,
        category: improvement.title,
        suggestion: improvement.description,
        completed: false,
      });
    }

    // Mark CV as analyzed
    await supabase
      .from('user_cvs')
      .update({ analyzed: true })
      .eq('user_id', userId);

    return suggestions;
  } catch (error) {
    console.error('CV analysis error:', error);
    throw error;
  }
};
```

#### Step 3: Add to Navigation

Edit `src/navigation/RootNavigator.tsx`:

```typescript
// Add to profile stack
<Stack.Screen 
  name="CVUpload" 
  component={CVUpload}
  options={{ title: 'Upload CV' }}
/>
```

---

## Option B: Remove from Marketing (Fastest for Now) ✅ RECOMMENDED

Since Apple rejected it for missing feature, just remove from metadata:

### Step 1: Update App Description

Edit `app.json`:

```json
{
  "expo": {
    "description": "Practice interviews with AI coaching. Get personalized feedback on your performance, search UK job opportunities, and track your progress. Perfect for interview preparation."
  }
}
```

**Remove:** "Upload your CV for AI analysis"

### Step 2: Update App Store Connect Metadata

Go to: https://appstoreconnect.apple.com/ → Your App → App Information

**Description (OLD):**
> "Practice interviews with AI coaching. Upload your CV for analysis. Get feedback and find UK jobs."

**Description (NEW):**
> "Practice interviews with AI coaching. Get detailed feedback on your responses, track your progress over time, and search for UK job opportunities. Perfect for job seekers preparing for interviews."

### Step 3: Update Screenshots

Remove any screenshots showing CV upload feature. Keep only:
1. Interview practice screen
2. Feedback/scoring screen
3. Job search screen
4. Progress dashboard

### Step 4: Test & Resubmit

```bash
# Increment version in app.json
"version": "1.0.1"

# Rebuild
eas build --platform ios

# Submit to App Review
eas submit --platform ios
```

---

## How to Find if CV Feature Exists

If you want to know if it's already implemented:

### Check File System

```bash
# Look for CV-related files
find src -name "*CV*" -o -name "*cv*" -o -name "*upload*"

# Expected output might show:
# - src/screens/CV.tsx (UI)
# - src/services/cvAnalysisService.ts (AI logic)
```

### Check Database

```sql
-- Verify table exists
SELECT * FROM user_cvs LIMIT 1;

-- Check if any suggestions stored
SELECT * FROM cv_suggestions LIMIT 5;
```

### Check Navigation

In `src/navigation/RootNavigator.tsx`:

```typescript
// Search for CVUpload, CV, or upload screens
grep -n "CVUpload\|CV\|upload" src/navigation/*.tsx
```

---

## Recommendation for Apple Submission

### For v1.0 (Current):
✅ **Use Option B** - Remove CV feature from marketing
- Faster (5 mins)
- Cleaner submission
- No risk of bugs
- Just delete metadata mentions

### For v1.1+ (Later):
✅ **Use Option A** - Implement full CV feature
- Takes 2-4 hours
- Marketing advantage
- Can charge extra for it
- Launch after v1.0 is live

---

## Timeline

| Task | Time | Priority |
|------|------|----------|
| Remove from metadata | 5 min | 🔴 DO NOW |
| Rebuild app | 5 min | 🔴 DO NOW |
| Resubmit to App Store | 2 min | 🔴 DO NOW |
| Implement CV feature | 4 hours | 🟢 v1.1 feature |

---

## Response to Apple

When resubmitting, reply to their message:

> "Thank you for the feedback. We've updated the app description to accurately reflect v1.0 features. CV analysis will be available in the upcoming v1.1 release. The current version focuses on interview practice with AI feedback and job search functionality."

