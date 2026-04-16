import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface Job {
  jobPostingId: string;
  title: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  company: { companyName: string };
  jobTier: string;
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: COLORS.professional,
  APPROVED: COLORS.success,
  REJECTED: COLORS.error,
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

const JobRow = React.memo(({ item, onApprove, onReject }: { item: Job; onApprove: () => void; onReject: () => void }) => (
  <View style={styles.row}>
    <View style={{ flex: 1 }}>
      <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.company}>{item.company?.companyName}</Text>
      <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLOR[item.status]}20` }]}>
        <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
      </View>
    </View>
    {item.status === 'PENDING' && (
      <View style={styles.actions}>
        <TouchableOpacity style={styles.approveBtn} onPress={onApprove}>
          <Ionicons name="checkmark" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    )}
  </View>
));

export default function AdminJobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 30 };
      if (filter !== 'ALL') params.status = filter;
      const { data } = await api.get('/admin/jobs', { params });
      setJobs(data.items || data || []);
    } catch {}
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const approve = async (id: string) => {
    try {
      await api.patch(`/admin/jobs/${id}/approve`);
      setJobs((prev) => prev.map((j) => j.jobPostingId === id ? { ...j, status: 'APPROVED' } : j));
    } catch { Alert.alert('Lỗi', 'Không thể duyệt tin'); }
  };

  const reject = (id: string) => {
    Alert.alert('Từ chối tin', 'Bạn có chắc muốn từ chối tin tuyển dụng này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Từ chối', style: 'destructive',
        onPress: async () => {
          try {
            await api.patch(`/admin/jobs/${id}/reject`);
            setJobs((prev) => prev.map((j) => j.jobPostingId === id ? { ...j, status: 'REJECTED' } : j));
          } catch { Alert.alert('Lỗi', 'Không thể từ chối tin'); }
        },
      },
    ]);
  };

  const renderItem = useCallback(
    ({ item }: { item: Job }) => (
      <JobRow
        item={item}
        onApprove={() => approve(item.jobPostingId)}
        onReject={() => reject(item.jobPostingId)}
      />
    ),
    []
  );

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterTab, filter === f && styles.filterTabActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'ALL' ? 'Tất cả' : STATUS_LABEL[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} size="large" />
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderItem}
          keyExtractor={(item) => item.jobPostingId}
          contentContainerStyle={{ padding: SPACING.md }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: 8 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.cardDark, borderRadius: RADIUS.lg,
    padding: SPACING.sm, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  title: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  company: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  statusText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  approveBtn: { width: 38, height: 38, borderRadius: RADIUS.md, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { width: 38, height: 38, borderRadius: RADIUS.md, backgroundColor: COLORS.error, justifyContent: 'center', alignItems: 'center' },
});
