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
  '💼 Tìm việc lập trình Front-end tại Hà Nội',
  '📄 Bạn có thể review CV của tôi không?',
  '💡 Lộ trình phát triển cho lập trình viên Junior?',
  '💰 Mức lương cho React Developer 2 năm kinh nghiệm?',
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
      content: `Xin chào ${user?.candidate?.fullName || user?.name || 'bạn'}! 👋 Tôi là trợ lý AI của Workly. Tôi có thể giúp bạn tìm việc làm, review CV, tư vấn lộ trình nghề nghiệp và mức lương phù hợp. Hỏi tôi bất cứ điều gì!`,
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

    // Auto scroll
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
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={<View style={{ height: 8 }} />}
        />

        {/* Suggestions (only when empty input) */}
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
          <TextInput
            style={styles.input}
            placeholder="Hỏi tôi về việc làm, CV, lương..."
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  aiAvatarLarge: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, color: COLORS.textMuted },
  messageList: { padding: SPACING.md, gap: 12 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAI: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: RADIUS.lg,
    padding: SPACING.sm + 4,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextAI: { color: '#e2e8f0' },
  typingDots: { flexDirection: 'row', gap: 5, paddingVertical: 4, paddingHorizontal: 2 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.textMuted },
  jobCardsContainer: { marginTop: SPACING.sm, gap: 8 },
  jobCard: {
    backgroundColor: 'rgba(30,90,255,0.12)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(30,90,255,0.25)',
  },
  jobCardTitle: { color: '#fff', fontWeight: '700', fontSize: 13 },
  jobCardCompany: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  jobCardSalary: { color: COLORS.success, fontSize: 12, marginTop: 4 },
  suggestions: { paddingVertical: SPACING.sm },
  suggestionChip: {
    backgroundColor: 'rgba(30,90,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(30,90,255,0.3)',
  },
  suggestionText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingTop: 12,
    paddingBottom: 12,
    color: '#fff',
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  sendBtnDisabled: { opacity: 0.4 },
});
