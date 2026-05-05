import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { useSocketStore } from '../../stores/socket';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';
import { MessageBubble } from '../../components/ui/MessageBubble';

interface Message {
  messageId: string;
  content: string;
  senderId: string;
  sentAt: string;
  isRead: boolean;
}

export default function ChatScreen() {
  const { conversationId, otherName } = useLocalSearchParams<{
    conversationId: string;
    otherName?: string;
  }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await api.get(`/messages/${conversationId}`);
      setMessages(Array.isArray(data) ? data.reverse() : []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => [msg, ...prev]);
        setTimeout(
          () => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }),
          100
        );
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.emit('joinConversation', conversationId);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.emit('leaveConversation', conversationId);
    };
  }, [socket, conversationId]);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);

    const optimistic: Message = {
      messageId: `temp_${Date.now()}`,
      content: text,
      senderId: user!.userId,
      sentAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [optimistic, ...prev]);

    try {
      await api.post(`/messages/${conversationId}`, { content: text });
    } catch {
      setMessages((prev) => prev.filter((m) => m.messageId !== optimistic.messageId));
    } finally {
      setSending(false);
    }
  }, [inputText, sending, conversationId, user]);

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      const isMe = item.senderId === user?.userId;
      return <MessageBubble item={item} isMe={isMe} />;
    },
    [user?.userId]
  );

  const keyExtractor = useCallback((item: Message) => item.messageId, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarText}>
              {(otherName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.headerName} numberOfLines={1}>
            {otherName || 'Cuộc hội thoại'}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            inverted
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="chatbubbles-outline" size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyChatText}>Bắt đầu cuộc trò chuyện với {otherName}</Text>
              </View>
            }
          />
        )}

        {/* Input Area */}
        <View style={styles.inputArea}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() || sending) && styles.sendBtnDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(25, 103, 210, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  moreBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: SPACING.md,
  },
  emptyChat: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 16,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(25, 103, 210, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChatText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  inputArea: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? 10 : SPACING.sm,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: RADIUS.xl,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    color: COLORS.text,
    fontSize: 16,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.5,
  },
});
