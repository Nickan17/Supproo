import React from 'react';
import { View, StyleSheet, Image, Dimensions, ScrollView } from 'react-native';
import Typography from './ui/Typography';
import Button from './ui/Button';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

interface OnboardingStepProps {
  title: string;
  description: string;
  imageUrl: string;
  primaryButtonText: string;
  secondaryButtonText?: string;
  onPrimaryButtonPress: () => void;
  onSecondaryButtonPress?: () => void;
  children?: React.ReactNode;
}

export default function OnboardingStep({
  title,
  description,
  imageUrl,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryButtonPress,
  onSecondaryButtonPress,
  children,
}: OnboardingStepProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const windowWidth = Dimensions.get('window').width;

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContent}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { width: windowWidth * 0.8 }]}
          resizeMode="contain"
        />
        
        <View style={styles.contentContainer}>
          <Typography variant="h1" weight="bold" style={styles.title}>
            {title}
          </Typography>
          
          <Typography 
            variant="body" 
            style={[styles.description, { color: colors.textSecondary }]}
          >
            {description}
          </Typography>
          
          {children && <View style={styles.childrenContainer}>{children}</View>}
          
          <View style={styles.buttonContainer}>
            <Button
              title={primaryButtonText}
              variant="primary"
              size="lg"
              fullWidth
              onPress={onPrimaryButtonPress}
              style={styles.primaryButton}
            />
            
            {secondaryButtonText && onSecondaryButtonPress && (
              <Button
                title={secondaryButtonText}
                variant="outline"
                size="lg"
                fullWidth
                onPress={onSecondaryButtonPress}
                style={styles.secondaryButton}
              />
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  image: {
    height: 240,
    marginBottom: 32,
    marginTop: 24,
  },
  contentContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
  },
  childrenContainer: {
    marginBottom: 32,
    width: '100%',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 'auto',
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {},
});