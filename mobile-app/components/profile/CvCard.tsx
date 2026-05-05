import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface CvCardProps {
  cvId: string;
  title: string;
  date: string;
  isMain: boolean;
  onDelete: () => void;
  onSetMain: () => void;
}

export const CvCard: React.FC<CvCardProps> = ({
  title,
  date,
  isMain,
  onDelete,
  onSetMain,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="document-text" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.date}>Tải lên: {date}</Text>
        </View>
        {isMain && (
          <View style={styles.mainBadge}>
            <Text style={styles.mainBadgeText}>Chính</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {!isMain && (
          <TouchableOpacity style={styles.actionBtn} onPress={onSetMain}>
            <Text style={styles.actionTextPrimary}>Đặt làm mặc định</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(25, 103, 210, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  mainBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  mainBadgeText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  actionBtn: {
    paddingVertical: 4,
  },
  actionTextPrimary: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
