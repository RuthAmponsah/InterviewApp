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
    console.log('Getting conversation summary...');
    console.log('Conversation history length:', conversationHistory.length);
    console.log('Full history:', JSON.stringify(conversationHistory, null, 2));
    
    if (conversationHistory.length <= 1) {
      console.log('Not enough conversation history to generate summary');
      return "Not enough conversation data to generate feedback.";
    }
    
    const summaryPrompt = {
      role: 'user' as const,
      content: `Please analyze this interview practice session and provide honest, critical feedback in this format:

STRENGTHS:
- [Specific positive observation 1]
- [Specific positive observation 2]
- [Specific positive observation 3]

IMPROVEMENTS:
- [Specific actionable improvement 1]
- [Specific actionable improvement 2]
- [Specific actionable improvement 3]

SCORE: [0-100]

CRITICAL: Only evaluate the USER'S responses. Do NOT give credit for MY (the interviewer's) questions or guidance. Ignore my responses entirely when scoring.

Scoring criteria - be HARSH and REALISTIC:
- 90-100: Outstanding - Detailed STAR method examples, quantifiable results, highly professional language, perfect alignment with questions, demonstrates deep expertise
- 75-89: Very Good - Specific examples with some detail, mostly professional, good structure, addresses questions well
- 60-74: Adequate - Vague answers, limited examples, somewhat relevant but lacks depth, needs better structure
- 40-59: Poor - Very brief responses (1-2 sentences), casual/unprofessional language, no concrete examples, doesn't fully answer questions
- 20-39: Very Poor - Single word answers, completely off-topic, shows no preparation or effort
- 0-19: Unacceptable - Inappropriate responses, refusal to engage, gibberish

Key factors to score HARSHLY on:
- Answer LENGTH: Brief answers (under 3 sentences) = automatic score penalty
- SPECIFICITY: Vague answers like "I like security" without examples = low score
- PROFESSIONALISM: Casual language like "it's scooo" or "money" = major penalty
- RELEVANCE: Not answering the actual question asked = deduct points
- EXAMPLES: No concrete examples or stories = significant deduction
- DEPTH: Surface-level responses without technical knowledge = low score

Remember: The user is practicing for a REAL interview. Be critical to help them improve. Most practice sessions should score 40-60 unless truly exceptional.`,
    };

    const chatCompletion = await groq.chat.completions.create({
      messages: [...conversationHistory, summaryPrompt],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 400,
    });

    const result = chatCompletion.choices[0]?.message?.content || "Practice session completed.";
    console.log('AI Summary result:', result);
    return result;
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
