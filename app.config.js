const baseConfig = require('./app.json').expo;

module.exports = ({ config }) => ({
  ...config,
  ...baseConfig,
  extra: {
    ...baseConfig.extra,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.supabaseUrl || '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.supabaseAnonKey || '',
    groqApiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || process.env.groqApiKey || '',
    adzunaAppId: process.env.EXPO_PUBLIC_ADZUNA_APP_ID || process.env.adzunaAppId || '',
    adzunaAppKey: process.env.EXPO_PUBLIC_ADZUNA_APP_KEY || process.env.adzunaAppKey || '',
    elevenlabsApiKey: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || process.env.elevenlabsApiKey || '',
    revenuecatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || process.env.revenuecatIosKey || '',
    revenuecatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || process.env.revenuecatAndroidKey || '',
  },
});
