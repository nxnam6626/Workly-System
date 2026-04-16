import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { useSocketStore } from '../../stores/socket';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface Message {
  messageId: string;
  content: string;
  senderId: string;
  sentAt: string;
  isRead: boolean;
}

export default function ChatScreen() {
  const { conversationId, otherName } = useLocalSearchParams<{ conversationId: string; otherName?: string }>();
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

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Listen for new messages in this conversation
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => [msg, ...prev]);
        setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
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
      // Remove optimistic on error
      setMessages((prev) => prev.filter((m) => m.messageId !== optimistic.messageId));
    } finally {
      setSending(false);
    }
  }, [inputText, sending, conversationId, user]);

  const renderItem = useCallback(({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.userId;
    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
            {item.content}
          </Text>
          <Text style={styles.timeText}>
            {new Date(item.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  }, [user?.userId]);

  const keyExtractor = useCallback((item: Message) => item.messageId, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarText}>{(otherName || 'U').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.headerName}>{otherName || 'Cuộc hội thoại'}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
                <Ionicons name="chatbubbles-outline" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyChatText}>Gửi tin nhắn đầu tiên!</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputArea}>
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
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={18} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardDark, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  avatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(30,90,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: COLORS.primary, fontWeight: '800', fontSize: 15 },
  headerName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  messageList: { padding: SPACING.md, gap: 8 },
  messageRow: { flexDirection: 'row' },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: RADIUS.lg, padding: SPACING.sm + 2 },
  bubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#1e293b', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextMe: { color: '#fff' },
  bubbleTextOther: { color: '#e2e8f0' },
  timeText: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 4, textAlign: 'right' },
  inputArea: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
  },
  input: {
    flex: 1, backgroundColor: '#1e293b', borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md, paddingTop: 12, paddingBottom: 12,
    color: '#fff', fontSize: 15, maxHeight: 120,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  sendBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  emptyChat: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyChatText: { color: COLORS.textMuted, fontSize: 14 },
});
