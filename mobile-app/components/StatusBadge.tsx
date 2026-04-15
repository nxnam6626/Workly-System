import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RADIUS } from '../lib/constants';

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:   { label: 'Chờ duyệt',  bg: '#fef3c7', text: '#92400e' },
  APPROVED:  { label: 'Đã duyệt',   bg: '#dcfce7', text: '#14532d' },
  REJECTED:  { label: 'Từ chối',    bg: '#fee2e2', text: '#7f1d1d' },
  LOCKED:    { label: 'Bị khóa',    bg: '#fee2e2', text: '#7f1d1d' },
  ACTIVE:    { label: 'Hoạt động',  bg: '#dcfce7', text: '#14532d' },
  CLOSED:    { label: 'Đã đóng',    bg: '#f1f5f9', text: '#475569' },
  DRAFT:     { label: 'Nháp',       bg: '#f1f5f9', text: '#475569' },
  SUBMITTED: { label: 'Đã nộp',     bg: '#dbeafe', text: '#1e3a8a' },
  REVIEWED:  { label: 'Đã xem',     bg: '#e9d5ff', text: '#3b0764' },
  INTERVIEW: { label: 'Phỏng vấn',  bg: '#fef3c7', text: '#92400e' },
  OFFERED:   { label: 'Offer',      bg: '#dcfce7', text: '#14532d' },
  HIRED:     { label: 'Đã tuyển',   bg: '#dcfce7', text: '#14532d' },
  URGENT:    { label: 'Gấp',        bg: '#fee2e2', text: '#7f1d1d' },
  BASIC:     { label: 'Thường',     bg: '#f1f5f9', text: '#475569' },
  PREMIUM:   { label: 'Premium',    bg: '#fef3c7', text: '#92400e' },
};

export function StatusBadge({ status, size = 'sm' }: Props) {
  const config = STATUS_MAP[status] ?? { label: status, bg: '#f1f5f9', text: '#475569' };
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text, fontSize: isSmall ? 10 : 12 }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
