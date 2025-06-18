import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

export default function Card({ children, style, variant = 'default' }: CardProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const getCardStyle = (): ViewStyle => {
    let cardStyle: ViewStyle = {};

    if (variant === 'default') {
      cardStyle = {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 16,
      };
    } else if (variant === 'elevated') {
      cardStyle = {
        backgroundColor: colors.background,
        borderRadius: 16,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: colors.shadowOpacity,
        shadowRadius: 8,
        elevation: 4,
      };
    } else if (variant === 'outlined') {
      cardStyle = {
        backgroundColor: colors.background,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
      };
    }

    return cardStyle;
  };

  return (
    <View style={[styles.card, getCardStyle(), style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
});