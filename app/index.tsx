import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we determine if user has completed onboarding
SplashScreen.preventAutoHideAsync();

export default function Index() {
  // For this MVP, we'll always redirect to onboarding
  // In a real app, we'd check if onboarding was completed
  const onboardingCompleted = false;

  useEffect(() => {
    // Hide splash screen after a short delay
    const hideSplash = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await SplashScreen.hideAsync();
    };
    
    hideSplash();
  }, []);

  if (onboardingCompleted) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/onboarding" />;
  }
}