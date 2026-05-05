import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../lib/constants';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'social';
  loading?: boolean;
  style?: ViewStyle | ((state: { pressed: boolean }) => ViewStyle);
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  style,
  textStyle,
  disabled,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outline;
      case 'ghost':
        return styles.ghost;
      case 'social':
        return styles.social;
      default:
        return styles.primary;
    }
  };

  const getVariantTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      case 'ghost':
        return styles.ghostText;
      case 'social':
        return styles.socialText;
      default:
        return styles.primaryText;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        getVariantStyle(),
        (disabled || loading) && styles.disabled,
        pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : COLORS.primary} />
      ) : (
        <Text style={[styles.baseText, getVariantTextStyle(), textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: RADIUS.xl, // Pill-shaped for Workly style
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.xs,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  social: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  primaryText: {
    color: '#fff',
  },
  outlineText: {
    color: COLORS.primary,
  },
  ghostText: {
    color: COLORS.primary,
  },
  socialText: {
    color: COLORS.text,
  },
  baseText: {
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
});
