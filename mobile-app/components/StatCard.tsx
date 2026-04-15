import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../lib/constants';

interface Props {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
  bg?: string;
  trend?: number; // positive = up, negative = down
}

export function StatCard({ label, value, icon, color = COLORS.primary, bg = '#eff6ff', trend }: Props) {
  return (
    <View style={[styles.card]}>
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {trend !== undefined && (
        <View style={[styles.trend, { backgroundColor: trend >= 0 ? '#dcfce7' : '#fee2e2' }]}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: trend >= 0 ? '#15803d' : '#dc2626' }}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  trend: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
  },
});
