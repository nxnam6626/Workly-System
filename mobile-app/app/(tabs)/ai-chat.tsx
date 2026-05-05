import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../stores/auth';
import { connectAiSocket, disconnectAiSocket } from '../../lib/ai-socket';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';
import type { Socket } from 'socket.io-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  jobCards?: any[];
}

const CANDIDATE_SUGGESTIONS = [
  '💼 Tìm việc IT tại Hà Nội',
  '📄 Review CV của tôi',
  '💡 Lộ trình Junior Developer',
  '💰 Mức lương React Native',
];

// Typing indicator dots animation
function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();

    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={styles.typingDots}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[styles.dot, { transform: [{ translateY: dot }] }]} />
      ))}
    </View>
  );
}

const MessageBubble = React.memo(({ msg }: { msg: Message }) => {
  const isUser = msg.role === 'user';

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAI]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={14} color="#fff" />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        {msg.isStreaming && msg.content === '' ? (
          <TypingDots />
        ) : (
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
            {msg.content}
          </Text>
        )}
        {/* Job cards from ai_action */}
        {msg.jobCards && msg.jobCards.length > 0 && (
          <View style={styles.jobCardsContainer}>
            {msg.jobCards.map((job: any, idx: number) => (
              <View key={idx} style={styles.jobCard}>
                <Text style={styles.jobCardTitle}>{job.title}</Text>
                <Text style={styles.jobCardCompany}>{job.company}</Text>
                {job.salary && <Text style={styles.jobCardSalary}>{job.salary}</Text>}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

export default function CandidateAiChatScreen() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Xin chào ${user?.candidate?.fullName || user?.name || 'bạn'}! 👋 Tôi là trợ lý AI của Workly. Tôi có thể giúp bạn tìm việc làm, review CV, tư vấn lộ trình nghề nghiệp. Hỏi tôi bất cứ điều gì!`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);
  const currentStreamIdRef = useRef<string | null>(null);

  useEffect(() => {
    const socket = connectAiSocket();
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('stream_chunk', ({ text }: { text: string }) => {
      if (!currentStreamIdRef.current) return;
      const id = currentStreamIdRef.current;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, content: m.content + text, isStreaming: true } : m
        )
      );
    });

    socket.on('ai_action', (payload: any) => {
      if (!currentStreamIdRef.current) return;
      const id = currentStreamIdRef.current;
      if (payload?.type === 'job_cards' && payload?.data) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, jobCards: payload.data } : m
          )
        );
      }
    });

    socket.on('stream_end', () => {
      if (currentStreamIdRef.current) {
        const id = currentStreamIdRef.current;
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isStreaming: false } : m))
        );
      }
      currentStreamIdRef.current = null;
      setIsStreaming(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('stream_chunk');
      socket.off('ai_action');
      socket.off('stream_end');
      disconnectAiSocket();
    };
  }, []);

  const sendMessage = useCallback(() => {
    const text = inputText.trim();
    if (!text || isStreaming || !socketRef.current?.connected) return;

    Keyboard.dismiss();

    const userMsg: Message = { id: `user_${Date.now()}`, role: 'user', content: text };
    const streamId = `ai_${Date.now()}`;
    const aiMsg: Message = { id: streamId, role: 'assistant', content: '', isStreaming: true };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInputText('');
    setIsStreaming(true);
    currentStreamIdRef.current = streamId;

    socketRef.current.emit('send_message', {
      message: text,
      context: {
        userId: user?.userId,
        role: 'CANDIDATE',
        candidateName: user?.candidate?.fullName || user?.name,
      },
    });

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [inputText, isStreaming, user]);

  const handleSuggestion = useCallback(
    (suggestion: string) => {
      setInputText(suggestion);
    },
    []
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);
  const renderItem = useCallback(({ item }: { item: Message }) => <MessageBubble msg={item} />, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.aiAvatarLarge}>
            <Ionicons name="sparkles" size={22} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Trợ lý AI Workly</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? COLORS.success : COLORS.error }]} />
              <Text style={styles.statusText}>{isConnected ? 'Đang hoạt động' : 'Đang kết nối...'}</Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={<View style={{ height: 16 }} />}
        />

        {/* Suggestions */}
        {messages.length <= 1 && !inputText && (
          <View style={styles.suggestions}>
            <FlatList
              data={CANDIDATE_SUGGESTIONS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              contentContainerStyle={{ gap: 8, paddingHorizontal: SPACING.md }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.suggestionChip} onPress={() => handleSuggestion(item)}>
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Input */}
        <View style={styles.inputArea}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Hỏi AI bất cứ điều gì..."
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || isStreaming || !isConnected) && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isStreaming || !isConnected}
              activeOpacity={0.8}
            >
              {isStreaming ? (
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
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  aiAvatarLarge: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  messageList: { padding: SPACING.md, gap: 16 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAI: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 16, lineHeight: 24 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextAI: { color: COLORS.text },
  typingDots: { flexDirection: 'row', gap: 5, paddingVertical: 8, paddingHorizontal: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.textMuted },
  jobCardsContainer: { marginTop: 12, gap: 10 },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  jobCardTitle: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
  jobCardCompany: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  jobCardSalary: { color: COLORS.primary, fontSize: 12, fontWeight: '700', marginTop: 6 },
  suggestions: { paddingVertical: SPACING.md },
  suggestionChip: {
    backgroundColor: 'rgba(25, 103, 210, 0.06)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(25, 103, 210, 0.15)',
  },
  suggestionText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.5,
  },
});
