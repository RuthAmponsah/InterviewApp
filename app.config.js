const baseConfig = require('./app.json').expo;

const readEnv = (...names) => {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim() && !value.trim().startsWith('@')) {
      return value.trim();
    }
  }

  return '';
};

module.exports = ({ config }) => ({
  ...config,
  ...baseConfig,
  extra: {
    ...baseConfig.extra,
    supabaseUrl: readEnv('EXPO_PUBLIC_SUPABASE_URL', 'supabaseUrl'),
    supabaseAnonKey: readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'supabaseAnonKey'),
    groqApiKey: readEnv('EXPO_PUBLIC_GROQ_API_KEY', 'groqApiKey'),
    adzunaAppId: readEnv('EXPO_PUBLIC_ADZUNA_APP_ID', 'adzunaAppId'),
    adzunaAppKey: readEnv('EXPO_PUBLIC_ADZUNA_APP_KEY', 'adzunaAppKey'),
    elevenlabsApiKey: readEnv('EXPO_PUBLIC_ELEVENLABS_API_KEY', 'elevenlabsApiKey'),
    revenuecatIosKey: readEnv('EXPO_PUBLIC_REVENUECAT_IOS_KEY', 'revenuecatIosKey'),
    revenuecatAndroidKey: readEnv('EXPO_PUBLIC_REVENUECAT_ANDROID_KEY', 'revenuecatAndroidKey'),
  },
});
