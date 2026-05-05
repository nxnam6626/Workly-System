import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface MenuOptionProps {
  label: string;
  icon: keyof typeof Ionicons.prototype.name;
  color?: string;
  backgroundColor?: string;
  badge?: string;
  onPress: () => void;
  showChevron?: boolean;
}

export const MenuOption: React.FC<MenuOptionProps> = ({
  label,
  icon,
  color = COLORS.text,
  backgroundColor = '#f8f9fa',
  badge,
  onPress,
  showChevron = true,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconWrap, { backgroundColor }]}>
        <Ionicons name={icon as any} size={20} color={color === COLORS.text ? COLORS.primary : color} />
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {showChevron && (
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: '#fff',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginRight: SPACING.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#856404',
  },
});
