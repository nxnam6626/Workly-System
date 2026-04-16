import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface SupportRequest {
  requestId: string;
  name?: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  user?: { name?: string; email: string };
}

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  OPEN:        { color: COLORS.error,  label: '🆕 Mới' },
  IN_PROGRESS: { color: COLORS.accent, label: '⚙️ Đang xử lý' },
  CLOSED:      { color: COLORS.success, label: '✅ Đã đóng' },
};

export default function AdminSupportScreen() {
  const [tickets, setTickets] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchTickets = useCallback(async () => {
    try {
      const { data } = await api.get('/support');
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải danh sách hỗ trợ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  }, [fetchTickets]);

  const handleUpdateStatus = useCallback(async (id: string, status: string) => {
    try {
      await api.patch(`/support/${id}`, { status });
      setTickets((prev) => prev.map((t) => t.requestId === id ? { ...t, status } : t));
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  }, []);

  const filtered = filterStatus === 'ALL' ? tickets : tickets.filter((t) => t.status === filterStatus);

  const renderItem = useCallback(({ item }: { item: SupportRequest }) => {
    const cfg = STATUS_CFG[item.status] || { color: COLORS.textMuted, label: item.status };
    const submitter = item.user?.name || item.name || item.email;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.subject} numberOfLines={2}>{item.subject}</Text>
            <Text style={styles.submitter}>{submitter} · {new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${cfg.color}15` }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <Text style={styles.message} numberOfLines={4}>{item.message}</Text>

        {item.status !== 'CLOSED' && (
          <View style={styles.actions}>
            {item.status === 'OPEN' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: 'rgba(245,158,11,0.1)' }]}
                onPress={() => handleUpdateStatus(item.requestId, 'IN_PROGRESS')}
              >
                <Ionicons name="play" size={14} color={COLORS.accent} />
                <Text style={[styles.actionText, { color: COLORS.accent }]}>Đang xử lý</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: 'rgba(34,197,94,0.1)' }]}
              onPress={() => handleUpdateStatus(item.requestId, 'CLOSED')}
            >
              <Ionicons name="checkmark" size={14} color={COLORS.success} />
              <Text style={[styles.actionText, { color: COLORS.success }]}>Đóng ticket</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }, [handleUpdateStatus]);

  const keyExtractor = useCallback((item: SupportRequest) => item.requestId, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎫 Hỗ trợ</Text>
        <Text style={styles.count}>{tickets.length} tickets</Text>
      </View>

      <FlatList
        data={['ALL', 'OPEN', 'IN_PROGRESS', 'CLOSED']}
        horizontal showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 8, gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === item && styles.filterChipActive]}
            onPress={() => setFilterStatus(item)}
          >
            <Text style={[styles.filterText, filterStatus === item && styles.filterTextActive]}>
              {item === 'ALL' ? 'Tất cả' : STATUS_CFG[item]?.label || item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="ticket-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Không có ticket nào</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  count: { color: COLORS.textMuted, fontSize: 14 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.cardDark, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: 'transparent' },
  filterText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: { padding: SPACING.md, gap: 12 },
  card: { backgroundColor: COLORS.cardDark, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cardHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: SPACING.sm },
  subject: { color: '#fff', fontWeight: '700', fontSize: 15 },
  submitter: { color: COLORS.textMuted, fontSize: 12, marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700' },
  message: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: SPACING.sm },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actionText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 15 },
});
