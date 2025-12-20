module.exports = {
  expo: {
    name: "InterviewApp",
    slug: "InterviewApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.myinterview.app",
      infoPlist: {
        NSPhotoLibraryUsageDescription: "MY INTERVIEW needs access to your photo library to let you choose a profile photo.",
        NSUserNotificationsUsageDescription: "MY INTERVIEW would like to send you interview reminders and progress updates to help you stay consistent with your practice.",
        NSDocumentsFolderUsageDescription: "MY INTERVIEW needs access to your documents to let you upload your CV for AI analysis."
      }
    },
    android: {
      package: "com.myinterview.app",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "POST_NOTIFICATIONS",
        "READ_MEDIA_IMAGES",
        "READ_EXTERNAL_STORAGE"
      ],
      blockedPermissions: [
        "RECORD_AUDIO",
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ],
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-font"
    ],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      groqApiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY,
      resendApiKey: process.env.EXPO_PUBLIC_RESEND_API_KEY,
      fromEmail: process.env.EXPO_PUBLIC_FROM_EMAIL,
      fromName: process.env.EXPO_PUBLIC_FROM_NAME,
      adzunaAppId: process.env.EXPO_PUBLIC_ADZUNA_APP_ID,
      adzunaAppKey: process.env.EXPO_PUBLIC_ADZUNA_APP_KEY,
      revenuecatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
      revenuecatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
    }
  }
};
