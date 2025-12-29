import Groq from "groq-sdk";
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import Constants from 'expo-constants';

// Initialize Groq client
// Get your free API key from: https://console.groq.com/keys
const GROQ_API_KEY = Constants.expoConfig?.extra?.groqApiKey || process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

if (!GROQ_API_KEY) {
  console.error('⚠️ Groq API key not found. Please check your .env file.');
}

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
  // Role-specific guidance
  const roleGuidance: { [key: string]: string } = {
    'Software Engineer': 'Focus on coding skills, algorithms, system design, debugging, and problem-solving approaches.',
    'Data Analyst': 'Focus on SQL, data visualization, statistical analysis, Excel/Python, and business insights.',
    'Cyber Security': 'Focus on security protocols, threat analysis, risk management, compliance, and incident response.',
    'IT Support': 'Focus on troubleshooting, customer service, technical knowledge, and problem resolution.',
    'Project Manager': 'Focus on leadership, planning, stakeholder management, risk mitigation, and delivery.',
    'Sales': 'Focus on persuasion, customer relationships, targets, negotiation, and closing techniques.',
    'Customer Service': 'Focus on communication, empathy, problem-solving, patience, and customer satisfaction.',
    'Marketing': 'Focus on campaigns, analytics, creativity, brand strategy, and digital marketing.',
    'Accounting': 'Focus on financial reporting, compliance, attention to detail, and accounting software.',
    'Finance': 'Focus on analysis, forecasting, budgeting, risk assessment, and financial modeling.',
    'Human Resources': 'Focus on recruitment, employee relations, policies, conflict resolution, and HR systems.',
    'Healthcare': 'Focus on patient care, medical knowledge, empathy, teamwork, and clinical skills.',
    'Nursing': 'Focus on patient assessment, medication administration, care planning, and communication.',
    'Teaching': 'Focus on lesson planning, classroom management, student engagement, and assessment.',
    'Engineering': 'Focus on technical design, problem-solving, project execution, and safety compliance.',
    'Business Analyst': 'Focus on requirements gathering, process improvement, stakeholder communication, and data analysis.',
    'Product Manager': 'Focus on product strategy, user research, roadmapping, cross-functional leadership, and metrics.',
    'UX/UI Designer': 'Focus on user research, wireframing, prototyping, usability, and design tools.',
    'Graphic Designer': 'Focus on creativity, design software, brand consistency, and visual communication.',
    'Operations Manager': 'Focus on efficiency, process optimization, team management, and performance metrics.',
    'Supply Chain': 'Focus on logistics, inventory management, vendor relations, and cost optimization.',
    'Legal': 'Focus on legal research, contracts, compliance, analytical skills, and attention to detail.',
    'Architecture': 'Focus on design principles, technical drawings, building codes, and client communication.',
    'Consulting': 'Focus on problem-solving, client management, analytical thinking, and communication.',
  };

  const specificGuidance = roleGuidance[jobRole] || 'Focus on relevant skills, experience, and problem-solving ability.';

  // Reset conversation history
  conversationHistory = [
    {
      role: 'system',
      content: `You are Aya, an empathetic and professional interview coach. You're helping ${userName || 'the user'} prepare for a ${jobRole} position. 

Your responsibilities:
- Ask relevant interview questions for the ${jobRole} role
- ${specificGuidance}
- Provide constructive feedback on their answers
- Encourage them with positive reinforcement
- Ask follow-up questions to help them elaborate
- Keep responses concise (2-3 sentences max)
- Be friendly and supportive, not intimidating
- Mix behavioral (STAR method), technical, and situational questions

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
      console.log('No user responses in conversation history');
      return "NO_RESPONSES_SUBMITTED";
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
let currentPlayer: AudioPlayer | null = null;
let isSpeaking = false;

export const speakText = async (text: string): Promise<boolean> => {
  try {
    console.log('🔊 Starting TTS for text:', text.substring(0, 50) + '...');
    console.log('Full text length:', text.length);
    
    // Stop any currently playing audio
    await stopSpeaking();
    isSpeaking = true;

    // Configure audio mode for playback
    console.log('Configuring audio mode...');
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });

    // Split text into chunks for reliable playback (Google TTS has ~200 char limit per request)
    const maxLength = 180;
    const chunks: string[] = [];
    
    // Split by sentences first
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += sentence;
      } else {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        // If single sentence is too long, split by commas or just truncate
        if (sentence.length > maxLength) {
          const parts = sentence.split(/,\s*/);
          let part = '';
          for (const p of parts) {
            if ((part + p).length <= maxLength) {
              part += (part ? ', ' : '') + p;
            } else {
              if (part.trim()) chunks.push(part.trim());
              part = p.substring(0, maxLength);
            }
          }
          if (part.trim()) currentChunk = part;
          else currentChunk = '';
        } else {
          currentChunk = sentence;
        }
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    console.log(`Split into ${chunks.length} chunks for TTS`);

    // Play each chunk sequentially
    for (let i = 0; i < chunks.length; i++) {
      if (!isSpeaking) {
        console.log('Speech stopped by user');
        break;
      }
      
      const chunk = chunks[i];
      console.log(`Playing chunk ${i + 1}/${chunks.length}: "${chunk.substring(0, 30)}..."`);
      
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(chunk)}`;
      
      try {
        const player = createAudioPlayer({ uri: ttsUrl }, { rate: 1.5 });
        currentPlayer = player;
        player.play();
        
        // Wait for this chunk to finish before playing next
        await new Promise<void>((resolve) => {
          const checkStatus = setInterval(() => {
            // Check if player finished or if we're no longer speaking
            if (!isSpeaking || !player.playing) {
              clearInterval(checkStatus);
              player.remove();
              currentPlayer = null;
              resolve();
            }
          }, 100);
          
          // Timeout fallback in case callback doesn't fire (estimate ~100ms per char)
          setTimeout(() => {
            clearInterval(checkStatus);
            resolve();
          }, Math.max(chunk.length * 80, 3000));
        });
        
      } catch (chunkError) {
        console.error(`Error playing chunk ${i + 1}:`, chunkError);
        // Continue with next chunk
      }
    }
    
    console.log('✅ Completed speaking all chunks');
    isSpeaking = false;
    return true;
  } catch (error) {
    console.error('❌ Error with text-to-speech:', error);
    isSpeaking = false;
    return false;
  }
};

export const stopSpeaking = async () => {
  isSpeaking = false;
  if (currentPlayer) {
    try {
      currentPlayer.pause();
      currentPlayer.remove();
      currentPlayer = null;
    } catch (error) {
      // Ignore - may already be stopped
    }
  }
};

// CV Analysis Function
export const analyzeCVWithAI = async (cvContent: string, jobRole: string) => {
  try {
    const prompt = `You are Aya, an expert CV/resume consultant. I will provide you with someone's CV content and their target job role. Analyze their ACTUAL CV and provide 6-8 SPECIFIC suggestions based on what you see in their CV.

Target Job Role: ${jobRole}

CV Content:
${cvContent}

You MUST respond with ONLY valid JSON in this EXACT format (no other text):
{
  "suggestions": [
    {"category": "Content", "suggestion": "Your SPECIFIC observation about their CV and actionable suggestion"},
    {"category": "Skills", "suggestion": "Your SPECIFIC observation about their CV and actionable suggestion"},
    {"category": "Experience", "suggestion": "Your SPECIFIC observation about their CV and actionable suggestion"},
    {"category": "Keywords", "suggestion": "Your SPECIFIC observation about their CV and actionable suggestion"},
    {"category": "Achievements", "suggestion": "Your SPECIFIC observation about their CV and actionable suggestion"},
    {"category": "Formatting", "suggestion": "Your SPECIFIC observation about their CV and actionable suggestion"}
  ]
}

IMPORTANT: 
- Base ALL suggestions on the ACTUAL CV content provided above
- Reference specific parts of their CV in your suggestions
- Give personalized, actionable advice, NOT generic tips
- Focus on what's missing, what's weak, and what could be stronger for ${jobRole} roles
- Suggest specific keywords, skills, or improvements based on their content

Respond with ONLY the JSON object, no markdown, no code blocks, no explanations.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are Aya, a professional CV advisor. Analyze the provided CV content and give SPECIFIC feedback. Respond with ONLY valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    
    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }
    
    // Parse JSON response
    try {
      const analysis = JSON.parse(cleanedResponse);
      
      // Validate that suggestions exist and is an array
      if (!analysis.suggestions || !Array.isArray(analysis.suggestions) || analysis.suggestions.length === 0) {
        throw new Error('Invalid suggestions format');
      }
      
      return analysis;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Return fallback suggestions if parsing fails
      return {
        suggestions: [
          {
            category: "Skills",
            suggestion: `Add specific ${jobRole}-related technical skills and certifications`
          },
          {
            category: "Experience",
            suggestion: "Quantify your achievements with numbers and metrics"
          },
          {
            category: "Keywords",
            suggestion: `Include industry keywords for ${jobRole} roles to pass ATS systems`
          },
          {
            category: "Action Verbs",
            suggestion: "Use strong action verbs like 'Led', 'Implemented', 'Achieved'"
          }
        ]
      };
    }
  } catch (error) {
    console.error('Error analyzing CV with AI:', error);
    throw error;
  }
};

// Improve CV Function - Generates a rewritten, enhanced version
export const improveCV = async (cvContent: string, jobRole: string): Promise<string> => {
  try {
    const prompt = `You are Aya, an expert CV/resume writer. I will provide you with someone's CV content and their target job role. Your task is to REWRITE and IMPROVE their CV to make it more professional, impactful, and optimized for ${jobRole} positions.

Target Job Role: ${jobRole}

Current CV Content:
${cvContent}

Please REWRITE this CV with the following improvements:
1. Enhanced readability with clear sections and bullet points
2. Stronger action verbs and quantifiable achievements
3. Better formatting and structure
4. Optimized keywords for ${jobRole} roles (ATS-friendly)
5. More impactful language and professional tone
6. Highlight relevant skills and experience for ${jobRole}
7. Remove redundancies and improve conciseness

IMPORTANT INSTRUCTIONS:
- Keep all factual information (names, dates, companies, education) from the original
- Only improve the writing, formatting, and presentation
- Make it ready to copy-paste into a document
- Use professional formatting with clear section headers
- Keep the same general structure but make it more impactful
- Output plain text with line breaks for readability (no markdown)

Return the COMPLETE improved CV text.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are Aya, a professional CV writer. Rewrite the provided CV to be more professional and impactful. Output plain text only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 3000,
    });

    const improvedCVText = completion.choices[0]?.message?.content || '';
    
    if (!improvedCVText) {
      throw new Error('No improved CV returned from AI');
    }
    
    return improvedCVText;
  } catch (error) {
    console.error('Error improving CV with AI:', error);
    throw error;
  }
};
