import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../lib/constants';

interface Message {
  messageId: string;
  content: string;
  senderId: string;
  sentAt: string;
  isRead: boolean;
}

interface MessageBubbleProps {
  item: Message;
  isMe: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ item, isMe }) => {
  const time = new Date(item.sentAt).toLocaleTimeString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <View style={[styles.container, isMe ? styles.containerMe : styles.containerOther]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        <Text style={[styles.text, isMe ? styles.textMe : styles.textOther]}>
          {item.content}
        </Text>
        <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>
          {time}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 10,
    width: '100%',
  },
  containerMe: {
    justifyContent: 'flex-end',
  },
  containerOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    position: 'relative',
  },
  bubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  textMe: {
    color: '#fff',
  },
  textOther: {
    color: COLORS.text,
  },
  time: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timeOther: {
    color: COLORS.textMuted,
  },
});
