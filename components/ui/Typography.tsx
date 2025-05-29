import React from 'react';
import { Text, StyleSheet, TextStyle, TextProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySmall' | 'caption';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: string;
  style?: TextStyle;
  children: React.ReactNode;
}

export default function Typography({
  variant = 'body',
  weight = 'regular',
  color,
  style,
  children,
  ...props
}: TypographyProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const getFontFamily = () => {
    const fontPrefix = variant === 'body' || variant === 'bodySmall' || variant === 'caption'
      ? 'Inter'
      : 'PlusJakartaSans';
    
    switch (weight) {
      case 'regular':
        return `${fontPrefix}-Regular`;
      case 'medium':
        return `${fontPrefix}-Medium`;
      case 'semibold':
        return `${fontPrefix}-SemiBold`;
      case 'bold':
        return `${fontPrefix}-Bold`;
      default:
        return `${fontPrefix}-Regular`;
    }
  };

  const getTextStyle = (): TextStyle => {
    let textStyle: TextStyle = {
      fontFamily: getFontFamily(),
      color: color || colors.text,
    };

    switch (variant) {
      case 'h1':
        textStyle = {
          ...textStyle,
          fontSize: 32,
          lineHeight: 38,
        };
        break;
      case 'h2':
        textStyle = {
          ...textStyle,
          fontSize: 24,
          lineHeight: 32,
        };
        break;
      case 'h3':
        textStyle = {
          ...textStyle,
          fontSize: 20,
          lineHeight: 28,
        };
        break;
      case 'h4':
        textStyle = {
          ...textStyle,
          fontSize: 18,
          lineHeight: 24,
        };
        break;
      case 'body':
        textStyle = {
          ...textStyle,
          fontSize: 16,
          lineHeight: 24,
        };
        break;
      case 'bodySmall':
        textStyle = {
          ...textStyle,
          fontSize: 14,
          lineHeight: 20,
        };
        break;
      case 'caption':
        textStyle = {
          ...textStyle,
          fontSize: 12,
          lineHeight: 16,
        };
        break;
    }

    return textStyle;
  };

  return (
    <Text style={[getTextStyle(), style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({});