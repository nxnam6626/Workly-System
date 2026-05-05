import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const DetailSection: React.FC<DetailSectionProps> = ({ title, children, containerStyle }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    paddingLeft: SPACING.sm,
  },
  content: {
    // Add any content specific styling here
  },
});
