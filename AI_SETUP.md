# AI Interview Coach Setup with Groq

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your Free Groq API Key

1. Go to **https://console.groq.com/**
2. Sign up with Google/GitHub (it's free!)
3. Click on **"API Keys"** in the left sidebar
4. Click **"Create API Key"**
5. Give it a name like "Interview App"
6. Copy the key (starts with `gsk_...`)

### Step 2: Add Your API Key

Open `src/services/aiService.ts` and replace this line:

```typescript
const GROQ_API_KEY = "YOUR_GROQ_API_KEY_HERE";
```

With your actual key:

```typescript
const GROQ_API_KEY = "gsk_your_actual_key_here";
```

### Step 3: Test It!

Run your app and start an interview. Aya will now respond intelligently using AI!

---

## ✨ Features

- **Real AI Responses**: Uses Llama 3.1 70B model via Groq
- **Context-Aware**: Remembers the conversation and job role
- **Super Fast**: Groq responses are nearly instant
- **Free Tier**: Plenty of free requests for development
- **Interview-Specific**: Trained to ask relevant interview questions

---

## 🎯 How It Works

1. When user starts interview, AI is initialized with their job role
2. Each message is sent to Groq with full conversation history
3. AI responds as "Aya" - an empathetic interview coach
4. Responses are kept concise (2-3 sentences)
5. AI asks follow-up questions and provides feedback

---

## 🔧 Customization

### Change AI Model

In `aiService.ts`, change the model:

```typescript
model: "llama-3.1-8b-instant", // Faster, less detailed
model: "llama-3.1-70b-versatile", // Current (best balance)
model: "mixtral-8x7b-32768", // Alternative option
```

### Adjust Response Length

Change `max_tokens`:

```typescript
max_tokens: 150, // Shorter responses
max_tokens: 200, // Current
max_tokens: 300, // Longer responses
```

### Modify AI Personality

Edit the system prompt in `initializeInterviewChat()` to change Aya's behavior, tone, or focus areas.

---

## 💰 Cost & Limits

**Groq Free Tier:**
- 14,400 requests per day
- 6,000 requests per minute
- More than enough for development and small apps!

**For Production:**
- Consider adding rate limiting
- Monitor usage in Groq console
- Upgrade to paid plan if needed

---

## 🐛 Troubleshooting

**"Error calling Groq AI"**
- Check your API key is correct
- Verify you have internet connection
- Check Groq console for rate limit issues

**Slow responses**
- Switch to faster model: `llama-3.1-8b-instant`
- Check your internet connection
- Groq should be very fast (< 1 second typically)

**Generic responses**
- Make sure job role is set in user preferences
- Check the system prompt is loading correctly
- Try adjusting the temperature (0.7 = creative, 0.3 = focused)

---

## 🔄 Alternative AI Providers

If you want to switch from Groq later:

### OpenAI (Best quality)
```bash
npm install openai
```

### Anthropic Claude (Best for instructions)
```bash
npm install @anthropic-ai/sdk
```

### Google Gemini (Free tier)
```bash
npm install @google/generative-ai
```

The `aiService.ts` structure makes it easy to swap providers!

---

## 📝 Environment Variables (Optional)

For production, use environment variables instead of hardcoding:

1. Install expo-constants:
```bash
npx expo install expo-constants
```

2. Create `app.config.js`:
```javascript
export default {
  extra: {
    groqApiKey: process.env.GROQ_API_KEY,
  },
};
```

3. Update `aiService.ts`:
```typescript
import Constants from 'expo-constants';
const GROQ_API_KEY = Constants.expoConfig?.extra?.groqApiKey;
```

4. Create `.env` file:
```
GROQ_API_KEY=gsk_your_key_here
```

---

## ✅ Next Steps

1. Get your Groq API key
2. Add it to `aiService.ts`
3. Test the interview chat
4. Customize the AI personality if needed
5. Consider adding voice mode later!

**Need help?** Check the Groq docs: https://console.groq.com/docs
