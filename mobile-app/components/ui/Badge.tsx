import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../lib/constants';

interface BadgeProps {
  label: string;
  color?: string;
  backgroundColor?: string;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'solid' | 'outline' | 'subtle';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = COLORS.primary,
  backgroundColor = 'rgba(25, 103, 210, 0.1)',
  containerStyle,
  textStyle,
  variant = 'subtle',
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'solid':
        return {
          container: { backgroundColor: color },
          text: { color: '#fff' },
        };
      case 'outline':
        return {
          container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: color },
          text: { color: color },
        };
      default: // subtle
        return {
          container: { backgroundColor },
          text: { color },
        };
    }
  };

  const style = getStyles();

  return (
    <View style={[styles.container, style.container, containerStyle]}>
      <Text style={[styles.text, style.text, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
