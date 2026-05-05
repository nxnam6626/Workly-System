import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import api from '../../lib/api';
import { useMessageStore } from '../../stores/message';
import { useSocketStore } from '../../stores/socket';
import { COLORS, SPACING } from '../../lib/constants';
import { ConversationItem } from '../../components/ConversationItem';

interface Conversation {
  conversationId: string;
  lastMessage?: string;
  isRead: boolean;
  updatedAt: string;
  recruiter?: { user?: { name?: string }; companyName?: string; company?: { companyName: string } };
}

export default function CandidateMessagesScreen() {
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

  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchConversations();
    socket.on('newMessage', handler);
    return () => {
      socket.off('newMessage', handler);
    };
  }, [socket, fetchConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const keyExtractor = useCallback((item: Conversation) => item.conversationId, []);

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => {
      const name =
        item.recruiter?.company?.companyName ||
        item.recruiter?.user?.name ||
        'Nhà tuyển dụng';
      return (
        <ConversationItem
          item={item}
          onPress={() =>
            router.push({
              pathname: '/chat/[conversationId]' as any,
              params: { conversationId: item.conversationId, otherName: name },
            })
          }
        />
      );
    },
    [router]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trò chuyện</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="chatbubbles-outline" size={64} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
              <Text style={styles.emptySubText}>
                Khi bạn ứng tuyển hoặc nhận được tin nhắn từ nhà tuyển dụng, cuộc hội thoại sẽ hiện
                ở đây.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(25, 103, 210, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
