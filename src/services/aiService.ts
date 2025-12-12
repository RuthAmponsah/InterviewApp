import Groq from "groq-sdk";
import { Audio } from 'expo-av';

// Initialize Groq client
// Get your free API key from: https://console.groq.com/keys
const GROQ_API_KEY = "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"; // Replace with your actual key

const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Keep conversation history for context
let conversationHistory: ChatMessage[] = [];

export const initializeInterviewChat = (jobRole: string, userName?: string) => {
  // Reset conversation history
  conversationHistory = [
    {
      role: 'system',
      content: `You are Aya, an empathetic and professional interview coach. You're helping ${userName || 'the user'} prepare for a ${jobRole} position. 

Your responsibilities:
- Ask relevant interview questions for the ${jobRole} role
- Provide constructive feedback on their answers
- Encourage them with positive reinforcement
- Ask follow-up questions to help them elaborate
- Keep responses concise (2-3 sentences max)
- Be friendly and supportive, not intimidating
- Focus on behavioral, technical, and situational questions relevant to ${jobRole}

Start by asking them to tell you about themselves and their interest in the ${jobRole} role.`
    }
  ];
};

export const sendMessageToAI = async (userMessage: string): Promise<string> => {
  try {
    // Add user message to history
    conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: conversationHistory,
      model: "llama-3.3-70b-versatile", // Latest and best model
      temperature: 0.7,
      max_tokens: 200, // Keep responses concise
      top_p: 1,
      stream: false,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "I'm sorry, could you repeat that?";

    // Add AI response to history
    conversationHistory.push({
      role: 'assistant',
      content: aiResponse,
    });

    return aiResponse;
  } catch (error) {
    console.error('Error calling Groq AI:', error);
    return "I'm having trouble connecting right now. Could you try again?";
  }
};

export const getConversationSummary = async (): Promise<string> => {
  try {
    const summaryPrompt = {
      role: 'user' as const,
      content: 'Please provide a brief summary of this interview practice session, highlighting key strengths and areas for improvement.',
    };

    const chatCompletion = await groq.chat.completions.create({
      messages: [...conversationHistory, summaryPrompt],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 300,
    });

    return chatCompletion.choices[0]?.message?.content || "Practice session completed.";
  } catch (error) {
    console.error('Error generating summary:', error);
    return "Unable to generate summary at this time.";
  }
};

export const clearConversationHistory = () => {
  conversationHistory = [];
};

// Text-to-Speech using PlayAI
let currentSound: Audio.Sound | null = null;

export const speakText = async (text: string): Promise<boolean> => {
  try {
    // Stop any currently playing audio
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }

    // Configure audio mode for playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    // Use free StreamElements TTS API (no API key needed!)
    const ttsUrl = `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodeURIComponent(text)}`;
    
    // Load and play the audio
    const { sound } = await Audio.Sound.createAsync(
      { uri: ttsUrl },
      { shouldPlay: true }
    );
      
    currentSound = sound;
      
    // Clean up when finished
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        currentSound = null;
      }
    });

    return true;
  } catch (error) {
    console.error('Error with text-to-speech:', error);
    return false;
  }
};

export const stopSpeaking = async () => {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }
};
