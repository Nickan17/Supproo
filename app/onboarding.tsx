import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import OnboardingStep from '@/components/OnboardingStep';
import Typography from '@/components/ui/Typography';
import { CheckCircle2 } from 'lucide-react-native';

const HEALTH_GOALS = [
  { id: 'muscle', label: 'Muscle Building' },
  { id: 'weight', label: 'Weight Management' },
  { id: 'energy', label: 'Energy & Focus' },
  { id: 'sleep', label: 'Sleep Quality' },
  { id: 'immunity', label: 'Immune Support' },
  { id: 'hair', label: 'Hair & Skin Health' },
  { id: 'longevity', label: 'Longevity & Aging' },
];

export default function Onboarding() {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const handleGoalToggle = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter(id => id !== goalId));
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save preferences and navigate to main app
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const renderGoalItem = ({ item }: { item: { id: string, label: string } }) => {
    const isSelected = selectedGoals.includes(item.id);
    
    return (
      <View 
        style={[
          styles.goalItem, 
          { 
            backgroundColor: isSelected ? colors.primaryLight : colors.backgroundSecondary,
            borderColor: isSelected ? colors.primary : colors.border,
          }
        ]}
      >
        <Typography 
          variant="body" 
          weight={isSelected ? 'semibold' : 'regular'}
          style={styles.goalLabel}
          onPress={() => handleGoalToggle(item.id)}
        >
          {item.label}
        </Typography>
        
        {isSelected && (
          <CheckCircle2 size={20} color={colors.primary} fill={colors.primary} />
        )}
      </View>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <OnboardingStep
            title="Welcome to SuppScan"
            description="Your trusted guide to supplement truth. We analyze ingredients, dosages, and claims to help you make informed choices."
            imageUrl="https://images.pexels.com/photos/3683098/pexels-photo-3683098.jpeg"
            primaryButtonText="Get Started"
            secondaryButtonText="Skip for Now"
            onPrimaryButtonPress={handleNext}
            onSecondaryButtonPress={handleSkip}
          />
        );
      case 1:
        return (
          <OnboardingStep
            title="What are your goals?"
            description="Select your health goals so we can tailor recommendations and insights to your needs."
            imageUrl="https://images.pexels.com/photos/6551136/pexels-photo-6551136.jpeg"
            primaryButtonText="Continue"
            secondaryButtonText="Skip"
            onPrimaryButtonPress={handleNext}
            onSecondaryButtonPress={handleSkip}
          >
            <FlatList
              data={HEALTH_GOALS}
              renderItem={renderGoalItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.goalsList}
              scrollEnabled={false}
            />
          </OnboardingStep>
        );
      case 2:
        return (
          <OnboardingStep
            title="Ready to Scan"
            description="Easily scan barcodes, search products, or upload supplement labels to get instant analysis and science-based ratings."
            imageUrl="https://images.pexels.com/photos/5327584/pexels-photo-5327584.jpeg"
            primaryButtonText="Let's Go"
            onPrimaryButtonPress={handleNext}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderStep()}
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  goalsList: {
    paddingHorizontal: 8,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  goalLabel: {
    flex: 1,
  },
});