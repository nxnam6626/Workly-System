import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { useMessageStore } from '../../stores/message';
import { useSocketStore } from '../../stores/socket';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface Conversation {
  conversationId: string;
  lastMessage?: string;
  isRead: boolean;
  updatedAt: string;
  candidate?: { fullName: string; userId: string };
  recruiter?: { user?: { name?: string }; companyName?: string };
}

export default function RecruiterMessagesScreen() {
  const router = useRouter();
  const { socket } = useSocketStore();
  const { resetUnread } = useMessageStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    resetUnread();
  }, [fetchConversations, resetUnread]);

  // Live: khi có message mới → update conversation list
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = () => fetchConversations();
    socket.on('newMessage', handleNewMessage);
    return () => { socket.off('newMessage', handleNewMessage); };
  }, [socket, fetchConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const keyExtractor = useCallback((item: Conversation) => item.conversationId, []);

  const renderItem = useCallback(({ item }: { item: Conversation }) => {
    const name = item.candidate?.fullName || 'Ứng viên';
    const preview = item.lastMessage || 'Bắt đầu cuộc hội thoại...';
    const time = new Date(item.updatedAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });

    return (
      <TouchableOpacity
        style={[styles.convRow, !item.isRead && styles.convRowUnread]}
        onPress={() => router.push({
          pathname: '/chat/[conversationId]' as any,
          params: { conversationId: item.conversationId, otherName: name },
        })}
        activeOpacity={0.75}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.convTop}>
            <Text style={[styles.convName, !item.isRead && styles.convNameBold]}>{name}</Text>
            <Text style={styles.convTime}>{time}</Text>
          </View>
          <Text style={[styles.convPreview, !item.isRead && styles.convPreviewBold]} numberOfLines={1}>
            {preview}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>
    );
  }, [router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Tin nhắn</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={56} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
              <Text style={styles.emptySubText}>Ứng viên sẽ liên hệ với bạn qua đây</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  list: { paddingTop: SPACING.sm },
  convRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  convRowUnread: { backgroundColor: 'rgba(30,90,255,0.05)' },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(30,90,255,0.2)', justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  avatarText: { color: COLORS.primary, fontWeight: '800', fontSize: 20 },
  unreadDot: {
    position: 'absolute', top: 2, right: 2,
    width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.error,
    borderWidth: 2, borderColor: COLORS.bgDark,
  },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  convName: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 15 },
  convNameBold: { color: '#fff', fontWeight: '800' },
  convTime: { color: COLORS.textMuted, fontSize: 12 },
  convPreview: { color: COLORS.textMuted, fontSize: 13 },
  convPreviewBold: { color: COLORS.textSecondary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 100, gap: 12 },
  emptyText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  emptySubText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', maxWidth: 260 },
});
