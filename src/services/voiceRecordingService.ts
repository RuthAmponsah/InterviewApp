/**
 * Voice Recording Service
 * Uses expo-audio for recording
 * Uses Groq Whisper API for transcription
 */
import { 
  RecordingPresets, 
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
// @ts-ignore - AudioModule is not exported in types but exists at runtime
import AudioModule from 'expo-audio/build/AudioModule';
import { getInfoAsync } from 'expo-file-system/legacy';
import Constants from 'expo-constants';

const GROQ_API_KEY = Constants.expoConfig?.extra?.groqApiKey || process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

// Use AudioRecorder from the native module
const AudioRecorder = AudioModule.AudioRecorder;
let recorder: InstanceType<typeof AudioRecorder> | null = null;

/**
 * Request microphone permissions from the user
 * @returns True if permission granted, false otherwise
 */
export const requestMicrophonePermissions = async (): Promise<boolean> => {
  try {
    console.log('🎤 Requesting microphone permissions...');
    const { granted } = await requestRecordingPermissionsAsync();
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
    const hasPermission = await requestMicrophonePermissions();
    
    if (!hasPermission) {
      return false;
    }

    console.log('🎤 Setting audio mode for recording...');
    // Set audio mode to allow recording on iOS
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });

    console.log('🎤 Creating and starting recording...');
    // Create a new recorder using the native AudioRecorder class
    recorder = new AudioRecorder(RecordingPresets.HIGH_QUALITY);
    await recorder.prepareToRecordAsync();
    recorder.record();
    
    console.log('✅ Recording started');
    return true;
  } catch (error) {
    console.error('Error starting recording:', error);
    recorder = null;
    return false;
  }
};

/**
 * Stop recording and return the URI
 * @returns The URI of the recorded audio file, or null if failed
 */
export const stopRecording = async (): Promise<string | null> => {
  try {
    if (!recorder) {
      console.log('No active recording');
      return null;
    }

    console.log('🛑 Stopping recording...');
    await recorder.stop();
    
    // Reset audio mode but keep playsInSilentMode for TTS
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });
    
    const uri = recorder.uri;
    console.log('✅ Recording stopped. URI:', uri);
    
    // Keep the recorder reference so file persists
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
    console.log('🔑 API Key:', GROQ_API_KEY ? GROQ_API_KEY.substring(0, 10) + '...' : 'MISSING');
    
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
    
    // In React Native, we use the URI directly in FormData
    // React Native's FormData handles file:// URIs natively
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
    
    // Send to Groq using XMLHttpRequest for better React Native compatibility
    console.log('📤 Sending to Groq Whisper API...');
    
    const result = await new Promise<string | null>((resolve) => {
      const xhr = new XMLHttpRequest();
      
      xhr.onload = () => {
        console.log('📥 Response status:', xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('📥 Response:', JSON.stringify(response).substring(0, 200));
            const text = response.text || '';
            console.log('✅ Transcription:', text);
            resolve(text);
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
  if (recorder) {
    console.log('🧹 Cleaning up recording');
    recorder = null;
  }
};

/**
 * Cancel the current recording without saving
 */
export const cancelRecording = async (): Promise<void> => {
  try {
    if (recorder) {
      console.log('❌ Cancelling recording...');
      await recorder.stop();
      
      // Reset audio mode
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      
      recorder = null;
    }
  } catch (error) {
    console.error('Error cancelling recording:', error);
  }
};
