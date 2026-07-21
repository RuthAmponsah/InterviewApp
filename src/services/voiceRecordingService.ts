/**
 * Voice Recording Service
 * Uses expo-av (deprecated but stable) for recording
 * Uses Supabase Edge Function secrets for Groq Whisper transcription
 */
import { Audio } from 'expo-av';
import {
  getInfoAsync,
  readAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../config/supabase';

console.log('✅ Voice transcription will use Supabase Edge Function secrets.');

let recording: Audio.Recording | null = null;

const waitForActiveAppState = async (timeoutMs = 1500): Promise<boolean> => {
  if (AppState.currentState === 'active') {
    return true;
  }

  return new Promise((resolve) => {
    let resolved = false;
    const finish = (value: boolean) => {
      if (resolved) return;
      resolved = true;
      subscription.remove();
      clearTimeout(timeout);
      resolve(value);
    };

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        finish(true);
      }
    });

    const timeout = setTimeout(() => finish(AppState.currentState === 'active'), timeoutMs);
  });
};

const resetAudioModeAfterRecording = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });
  } catch (error) {
    console.log('Could not reset audio mode:', error);
  }
};

/**
 * Request microphone permissions from the user
 * @returns True if permission granted, false otherwise
 */
export const requestMicrophonePermissions = async (): Promise<boolean> => {
  try {
    console.log('🎤 Requesting microphone permissions...');
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      console.log('🎤 Microphone permission denied');
      return false;
    }
    console.log('✅ Microphone permission granted');
    return true;
  } catch (error) {
    console.error('Error requesting microphone permissions:', error);
    return false;
  }
};

/**
 * Start recording audio
 * @returns True if recording started successfully
 */
export const startRecording = async (): Promise<boolean> => {
  try {
    const appIsActive = await waitForActiveAppState();
    if (!appIsActive) {
      console.warn('🎤 Cannot start recording because the app is not active.');
      return false;
    }

    const hasPermission = await requestMicrophonePermissions();
    
    if (!hasPermission) {
      return false;
    }

    // Stop any existing recording first
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch (e) {
        // Ignore errors when stopping old recording
      }
      recording = null;
    }

    console.log('🎤 Setting audio mode for recording...');
    // Set audio mode to allow recording on iOS
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    console.log('🎤 Creating recording object...');
    // Create a new recording instance
    const newRecording = new Audio.Recording();
    
    console.log('🎤 Preparing recording...');
    await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    
    console.log('🎤 Starting recording...');
    await newRecording.startAsync();
    
    recording = newRecording;
    console.log('✅ Recording started');
    return true;
  } catch (error) {
    console.error('Error starting recording:', error);
    await resetAudioModeAfterRecording();
    recording = null;
    return false;
  }
};

/**
 * Stop recording and return the URI
 * @returns The URI of the recorded audio file, or null if failed
 */
export const stopRecording = async (): Promise<string | null> => {
  try {
    if (!recording) {
      console.log('No active recording');
      return null;
    }

    console.log('🛑 Stopping recording...');
    await recording.stopAndUnloadAsync();
    
    // Reset audio mode but keep playsInSilentMode for TTS
    await resetAudioModeAfterRecording();
    
    const uri = recording.getURI();
    console.log('✅ Recording stopped. URI:', uri);
    
    // Keep the recording reference so file persists
    // Don't set to null yet - we need the file for transcription
    
    return uri;
  } catch (error) {
    console.error('Error stopping recording:', error);
    return null;
  }
};

/**
 * Transcribe audio file using the Groq transcription Edge Function
 * @param uri The URI of the audio file to transcribe
 * @returns The transcribed text, or null if failed
 */
export const transcribeAudio = async (uri: string): Promise<string | null> => {
  try {
    console.log('🔄 Transcribing audio...');
    console.log('📁 File URI:', uri);
    
    // Check if file exists
    console.log('📖 Checking file...');
    const fileInfo = await getInfoAsync(uri);
    console.log('📊 File exists:', fileInfo.exists, 'Size:', fileInfo.exists ? (fileInfo as any).size : 'N/A');
    
    if (!fileInfo.exists) {
      console.error('❌ Audio file does not exist!');
      cleanupRecording();
      return null;
    }
    
    console.log('📤 Reading audio file for Edge Function upload...');
    const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
    const { data, error } = await supabase.functions.invoke<{ text?: string }>('groq-transcribe', {
      method: 'POST',
      body: {
        base64,
        mimeType: 'audio/m4a',
        fileName: 'recording.m4a',
      },
    });

    if (error) {
      console.error('❌ Transcription Edge Function error:', error.message);
      cleanupRecording();
      return null;
    }

    const result = data?.text || null;
    console.log('✅ Transcription:', result);
    cleanupRecording();
    return result;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    cleanupRecording();
    return null;
  }
};

/**
 * Clean up recording reference
 */
const cleanupRecording = () => {
  if (recording) {
    console.log('🧹 Cleaning up recording');
    recording = null;
  }
};

/**
 * Cancel the current recording without saving
 */
export const cancelRecording = async (): Promise<void> => {
  try {
    if (recording) {
      console.log('❌ Cancelling recording...');
      await recording.stopAndUnloadAsync();
      
      // Reset audio mode
      await resetAudioModeAfterRecording();
      
      recording = null;
    }
  } catch (error) {
    console.error('Error cancelling recording:', error);
  }
};
