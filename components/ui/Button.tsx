import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const getButtonStyles = (): ViewStyle => {
    let buttonStyle: ViewStyle = {};

    // Button size
    if (size === 'sm') {
      buttonStyle = { ...buttonStyle, paddingVertical: 8, paddingHorizontal: 16 };
    } else if (size === 'md') {
      buttonStyle = { ...buttonStyle, paddingVertical: 12, paddingHorizontal: 20 };
    } else if (size === 'lg') {
      buttonStyle = { ...buttonStyle, paddingVertical: 16, paddingHorizontal: 24 };
    }

    // Button variant
    if (variant === 'primary') {
      buttonStyle = {
        ...buttonStyle,
        backgroundColor: colors.primary,
        borderWidth: 0,
      };
    } else if (variant === 'secondary') {
      buttonStyle = {
        ...buttonStyle,
        backgroundColor: isDark ? 'rgba(58, 130, 246, 0.15)' : colors.blue[100],
        borderWidth: 0,
      };
    } else if (variant === 'outline') {
      buttonStyle = {
        ...buttonStyle,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
      };
    } else if (variant === 'ghost') {
      buttonStyle = {
        ...buttonStyle,
        backgroundColor: 'transparent',
        borderWidth: 0,
      };
    }

    // Full width
    if (fullWidth) {
      buttonStyle.width = '100%';
    }

    return buttonStyle;
  };

  const getTextStyles = (): TextStyle => {
    let textStyleObj: TextStyle = {
      fontFamily: 'Inter-SemiBold',
    };

    // Text size based on button size
    if (size === 'sm') {
      textStyleObj = { ...textStyleObj, fontSize: 14 };
    } else if (size === 'md') {
      textStyleObj = { ...textStyleObj, fontSize: 16 };
    } else if (size === 'lg') {
      textStyleObj = { ...textStyleObj, fontSize: 18 };
    }

    // Text color based on variant
    if (variant === 'primary') {
      textStyleObj = { ...textStyleObj, color: '#FFFFFF' };
    } else if (variant === 'secondary') {
      textStyleObj = { ...textStyleObj, color: colors.primary };
    } else if (variant === 'outline') {
      textStyleObj = { ...textStyleObj, color: colors.primary };
    } else if (variant === 'ghost') {
      textStyleObj = { ...textStyleObj, color: colors.primary };
    }

    return textStyleObj;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyles(),
        { opacity: props.disabled ? 0.6 : 1 },
        style,
      ]}
      activeOpacity={0.7}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : colors.primary}
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={[getTextStyles(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 8,
  },
});