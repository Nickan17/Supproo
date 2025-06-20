import 'dotenv/config';

export default {
  "expo": {
    "name": "bolt-expo-nativewind",
    "slug": "bolt-expo-nativewind",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": ["expo-router", "expo-font", "expo-web-browser"],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "supabaseUrl": process.env.EXPO_PUBLIC_SUPABASE_URL,
      "supabaseAnonKey": process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      "OPENROUTER_API_KEY": process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
      "FIRECRAWL_API_KEY": process.env.FIRECRAWL_API_KEY,
      "eas": {
        "projectId": "your-eas-project-id" // Replace with your actual EAS project ID if you have one
      }
    }
  }
}
