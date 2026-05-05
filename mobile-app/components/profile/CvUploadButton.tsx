import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface CvUploadButtonProps {
  onPress: () => void;
  loading: boolean;
}

export const CvUploadButton: React.FC<CvUploadButtonProps> = ({ onPress, loading }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.primary} size="small" />
      ) : (
        <>
          <View style={styles.iconWrap}>
            <Ionicons name="cloud-upload-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>Tải lên CV (PDF/Word)</Text>
            <Text style={styles.subtitle}>AI sẽ tự động cập nhật kỹ năng & học vấn của bạn</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 103, 210, 0.04)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    marginBottom: SPACING.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(25, 103, 210, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
