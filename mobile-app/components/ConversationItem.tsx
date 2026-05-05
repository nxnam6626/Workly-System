import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../lib/constants';

interface Conversation {
  conversationId: string;
  lastMessage?: string;
  isRead: boolean;
  updatedAt: string;
  recruiter?: { user?: { name?: string }; companyName?: string; company?: { companyName: string } };
}

interface ConversationItemProps {
  item: Conversation;
  onPress: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = React.memo(({ item, onPress }) => {
  const name =
    item.recruiter?.company?.companyName ||
    item.recruiter?.user?.name ||
    'Nhà tuyển dụng';
  const preview = item.lastMessage || 'Bắt đầu cuộc hội thoại...';
  const time = new Date(item.updatedAt).toLocaleDateString('vi-VN', { 
    day: 'numeric', 
    month: 'short' 
  });

  return (
    <TouchableOpacity
      style={[styles.container, !item.isRead && styles.containerUnread]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, !item.isRead && styles.nameUnread]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text 
            style={[styles.preview, !item.isRead && styles.previewUnread]} 
            numberOfLines={1}
          >
            {preview}
          </Text>
          {!item.isRead && (
             <View style={styles.unreadBadge} />
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  containerUnread: {
    backgroundColor: '#f8fbff',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(25, 103, 210, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 22,
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.error,
    borderWidth: 2,
    borderColor: '#fff',
  },
  content: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
    marginRight: SPACING.sm,
  },
  nameUnread: {
    fontWeight: '800',
  },
  time: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preview: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  previewUnread: {
    color: COLORS.text,
    fontWeight: '600',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
});
