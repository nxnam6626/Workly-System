import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface Notification {
  notificationId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: string;
}

const NotifItem = React.memo(({ item, onPress }: { item: Notification; onPress: () => void }) => {
  const iconMap: Record<string, { icon: string; color: string }> = {
    JOB_APPROVED: { icon: 'checkmark-circle', color: COLORS.success },
    JOB_REJECTED: { icon: 'close-circle', color: COLORS.error },
    NEW_APPLICATION: { icon: 'person-add', color: COLORS.primary },
    APPLICATION_STATUS: { icon: 'document-text', color: '#a78bfa' },
    DEFAULT: { icon: 'notifications', color: COLORS.textMuted },
  };
  const { icon, color } = iconMap[item.type] || iconMap.DEFAULT;
  const date = new Date(item.createdAt);
  const timeStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.time}>{timeStr}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
});

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.items || data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.notificationId === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotifItem item={item} onPress={() => markRead(item.notificationId)} />
    ),
    []
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: COLORS.bgDark }} color={COLORS.primary} size="large" />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông báo {unreadCount > 0 && <Text style={styles.badge}> {unreadCount} </Text>}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Đọc tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={56} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.notificationId}
          contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={15}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  badge: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  markAll: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: COLORS.cardDark, borderRadius: RADIUS.lg,
    padding: SPACING.sm, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  itemUnread: { borderColor: 'rgba(30,90,255,0.25)', backgroundColor: 'rgba(30,90,255,0.05)' },
  iconWrap: { width: 44, height: 44, borderRadius: RADIUS.full, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 3 },
  message: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  time: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
