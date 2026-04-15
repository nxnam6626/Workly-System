import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface Ticket {
  ticketId: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  response?: string;
}

const CATEGORIES = ['Vấn đề tài khoản', 'Thanh toán', 'Tính năng', 'Báo lỗi', 'Khác'];

export default function SupportScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: CATEGORIES[0] });

  const fetchTickets = useCallback(async () => {
    try {
      const { data } = await api.get('/support/my-tickets');
      setTickets(data || []);
    } catch {
      // No tickets yet is ok
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  const onRefresh = async () => { setRefreshing(true); await fetchTickets(); setRefreshing(false); };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền tiêu đề và mô tả vấn đề');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/support/tickets', form);
      setForm({ title: '', description: '', category: CATEGORIES[0] });
      setShowForm(false);
      await fetchTickets();
      Alert.alert('✅ Đã gửi', 'Yêu cầu hỗ trợ của bạn đã được ghi nhận. Chúng tôi sẽ phản hồi sớm!');
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hỗ Trợ</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.addBtn}>
          <Ionicons name={showForm ? 'close' : 'add'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: 40, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Gửi yêu cầu hỗ trợ</Text>

            <Text style={styles.label}>Danh mục</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, form.category === cat && styles.catChipActive]}
                  onPress={() => setForm(p => ({ ...p, category: cat }))}
                >
                  <Text style={[styles.catText, form.category === cat && styles.catTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Tiêu đề <Text style={{ color: COLORS.error }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={v => setForm(p => ({ ...p, title: v }))}
              placeholder="Mô tả ngắn gọn vấn đề"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.label}>Mô tả chi tiết <Text style={{ color: COLORS.error }}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.description}
              onChangeText={v => setForm(p => ({ ...p, description: v }))}
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="send" size={16} color="#fff" />
                  <Text style={styles.submitBtnText}>Gửi yêu cầu</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Lịch sử yêu cầu ({tickets.length})</Text>

        {tickets.length === 0 ? (
          <EmptyState
            emoji="🎫"
            title="Chưa có yêu cầu nào"
            description="Bấm nút + ở góc trên để gửi yêu cầu hỗ trợ đầu tiên của bạn"
          />
        ) : (
          tickets.map(ticket => (
            <View key={ticket.ticketId} style={styles.ticket}>
              <View style={styles.ticketTop}>
                <Text style={styles.ticketTitle} numberOfLines={1}>{ticket.title}</Text>
                <StatusBadge status={ticket.status} />
              </View>
              <Text style={styles.ticketDesc} numberOfLines={2}>{ticket.description}</Text>
              {ticket.response && (
                <View style={styles.responseBox}>
                  <Ionicons name="chatbubble" size={12} color={COLORS.success} />
                  <Text style={styles.responseText} numberOfLines={3}>{ticket.response}</Text>
                </View>
              )}
              <Text style={styles.ticketDate}>
                {new Date(ticket.createdAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  form: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  formTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: COLORS.bg, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  catChipActive: { backgroundColor: '#eff6ff', borderColor: COLORS.primary },
  catText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  catTextActive: { color: COLORS.primary },
  input: { backgroundColor: COLORS.bg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, paddingVertical: 11, fontSize: 14, color: COLORS.text, marginBottom: SPACING.sm },
  textarea: { minHeight: 100, paddingTop: 11 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 14, marginTop: SPACING.sm },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  ticket: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  ticketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  ticketTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.text, marginRight: 8 },
  ticketDesc: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginBottom: 6 },
  responseBox: { flexDirection: 'row', gap: 6, backgroundColor: '#f0fdf4', borderRadius: RADIUS.sm, padding: 8, marginBottom: 6 },
  responseText: { flex: 1, fontSize: 12, color: '#15803d' },
  ticketDate: { fontSize: 11, color: COLORS.textMuted },
});
