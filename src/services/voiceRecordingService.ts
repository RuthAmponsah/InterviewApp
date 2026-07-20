/**
 * Voice Recording Service
 * Uses expo-av (deprecated but stable) for recording
 * Uses Groq Whisper API for transcription
 */
import { Audio } from 'expo-av';
import {
  FileSystemSessionType,
  FileSystemUploadType,
  getInfoAsync,
  uploadAsync,
} from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { AppState, AppStateStatus } from 'react-native';
import { firstConfigValue } from '../utils/env';

const GROQ_API_KEY = firstConfigValue(
  Constants.expoConfig?.extra?.groqApiKey,
  process.env.EXPO_PUBLIC_GROQ_API_KEY,
);

console.log('✅ Voice transcription config loaded:', { groqApiKey: Boolean(GROQ_API_KEY) });

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
 * Transcribe audio file using Groq Whisper API
 * @param uri The URI of the audio file to transcribe
 * @returns The transcribed text, or null if failed
 */
export const transcribeAudio = async (uri: string): Promise<string | null> => {
  try {
    console.log('🔄 Transcribing audio...');
    console.log('📁 File URI:', uri);
    
    if (!GROQ_API_KEY) {
      console.error('❌ Groq API key not configured!');
      cleanupRecording();
      return null;
    }
    
    // Check if file exists
    console.log('📖 Checking file...');
    const fileInfo = await getInfoAsync(uri);
    console.log('📊 File exists:', fileInfo.exists, 'Size:', fileInfo.exists ? (fileInfo as any).size : 'N/A');
    
    if (!fileInfo.exists) {
      console.error('❌ Audio file does not exist!');
      cleanupRecording();
      return null;
    }
    
    const parseTranscriptionResponse = (body: string) => {
      const response = JSON.parse(body);
      console.log('📥 Response:', JSON.stringify(response).substring(0, 200));
      const text = response.text || '';
      console.log('✅ Transcription:', text);
      return text;
    };

    const transcribeWithNativeUpload = async () => {
      console.log('📤 Sending to Groq Whisper API with native upload...');
      const response = await uploadAsync('https://api.groq.com/openai/v1/audio/transcriptions', uri, {
        httpMethod: 'POST',
        uploadType: FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        mimeType: 'audio/m4a',
        sessionType: FileSystemSessionType.FOREGROUND,
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        parameters: {
          model: 'whisper-large-v3-turbo',
          language: 'en',
          response_format: 'json',
        },
      });

      console.log('📥 Native upload status:', response.status);
      if (response.status >= 200 && response.status < 300) {
        return parseTranscriptionResponse(response.body);
      }

      console.error('❌ Native upload API error:', response.status, response.body.substring(0, 500));
      return null;
    };

    const transcribeWithXHR = async () => {
      // In React Native, we use the URI directly in FormData.
      console.log('📤 Creating FormData with file URI...');
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('language', 'en');
      formData.append('response_format', 'json');

      console.log('📤 Sending to Groq Whisper API with XHR...');
      return new Promise<string | null>((resolve) => {
      const xhr = new XMLHttpRequest();
      
      xhr.onload = () => {
        console.log('📥 Response status:', xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(parseTranscriptionResponse(xhr.responseText));
          } catch (parseError) {
            console.error('❌ Parse error:', parseError);
            console.log('📥 Raw response:', xhr.responseText.substring(0, 500));
            resolve(null);
          }
        } else {
          console.error('❌ API error:', xhr.status, xhr.responseText.substring(0, 500));
          resolve(null);
        }
      };
      
      xhr.onerror = () => {
        console.error('❌ XHR network error');
        resolve(null);
      };
      
      xhr.ontimeout = () => {
        console.error('❌ XHR timeout');
        resolve(null);
      };
      
      xhr.timeout = 60000; // 60 second timeout
      xhr.open('POST', 'https://api.groq.com/openai/v1/audio/transcriptions');
      xhr.setRequestHeader('Authorization', `Bearer ${GROQ_API_KEY}`);
      xhr.send(formData);
      });
    };
    
    let result = await transcribeWithNativeUpload();
    if (!result) {
      console.log('🔁 Native upload did not return transcription, trying XHR fallback...');
      result = await transcribeWithXHR();
    }
    
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
