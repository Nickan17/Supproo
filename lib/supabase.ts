import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = "https://uaqcehoocecvihubnbhp.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcWNlaG9vY2VjdmlodWJuYmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNzc4ODEsImV4cCI6MjA2Mzk1Mzg4MX0.vyahdG1amAhAwm_1FTe8bHs1o7onpXMLlJsFx3IOR0U";

// WARNING: Hardcoded Supabase credentials for testing.
// This should NOT be used in production.
// The original intention was to load these from Constants.expoConfig?.extra.

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});