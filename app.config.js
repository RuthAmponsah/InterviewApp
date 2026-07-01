const baseConfig = require('./app.json').expo;

module.exports = ({ config }) => ({
  ...config,
  ...baseConfig,
  extra: {
    ...baseConfig.extra,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    groqApiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
    adzunaAppId: process.env.EXPO_PUBLIC_ADZUNA_APP_ID || '',
    adzunaAppKey: process.env.EXPO_PUBLIC_ADZUNA_APP_KEY || '',
    elevenlabsApiKey: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '',
    revenuecatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',
    revenuecatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',
  },
});
