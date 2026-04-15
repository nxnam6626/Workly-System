import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS, JOB_TYPE_LABEL, formatSalary } from '../../lib/constants';

interface Job {
  jobPostingId: string;
  title: string;
  status: string;
  jobType: string;
  locationCity?: string;
  viewCount: number;
  salaryMin?: number;
  salaryMax?: number;
  createdAt: string;
  _count?: { applications: number };
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  APPROVED: { color: COLORS.success, label: 'Đang hiển thị', icon: 'checkmark-circle' },
  PENDING:  { color: COLORS.accent,  label: 'Chờ duyệt',     icon: 'time' },
  REJECTED: { color: COLORS.error,   label: 'Bị từ chối',    icon: 'close-circle' },
  EXPIRED:  { color: COLORS.textMuted, label: 'Đã hết hạn',  icon: 'calendar' },
  CLOSED:   { color: COLORS.textMuted, label: 'Đã đóng',     icon: 'ban' },
};

const FILTER_TABS = ['Tất cả', 'APPROVED', 'PENDING', 'REJECTED', 'EXPIRED'];

function JobCard({ job, onDelete }: { job: Job; onDelete: (id: string) => void }) {
  const cfg = STATUS_CONFIG[job.status] || { color: COLORS.textMuted, label: job.status, icon: 'help' };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
          <View style={styles.metaRow}>
            {job.locationCity && (
              <View style={styles.metaBadge}>
                <Ionicons name="location" size={11} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{job.locationCity}</Text>
              </View>
            )}
            {job.jobType && (
              <View style={styles.metaBadge}>
                <Ionicons name="briefcase" size={11} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{JOB_TYPE_LABEL[job.jobType] || job.jobType}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${cfg.color}20` }]}>
          <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <Text style={styles.salary}>
        {formatSalary(job.salaryMin ?? null, job.salaryMax ?? null)}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="eye" size={14} color={COLORS.textMuted} />
            <Text style={styles.statText}>{job.viewCount} lượt xem</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="document-text" size={14} color={COLORS.textMuted} />
            <Text style={styles.statText}>{job._count?.applications ?? 0} ứng viên</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() =>
            Alert.alert('Xóa tin?', 'Bạn muốn xóa tin tuyển dụng này?', [
              { text: 'Hủy', style: 'cancel' },
              { text: 'Xóa', style: 'destructive', onPress: () => onDelete(job.jobPostingId) },
            ])
          }
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RecruiterJobsScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filtered, setFiltered] = useState<Job[]>([]);
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const { data } = await api.get('/jobs/my-jobs?limit=100');
      const list = data.jobs || data || [];
      setJobs(list);
      setFiltered(list);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể tải danh sách tin đăng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const applyFilter = useCallback((filter: string) => {
    setActiveFilter(filter);
    setFiltered(filter === 'Tất cả' ? jobs : jobs.filter((j) => j.status === filter));
  }, [jobs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }, [fetchJobs]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.delete(`/jobs/${id}`);
      const updated = jobs.filter((j) => j.jobPostingId !== id);
      setJobs(updated);
      applyFilter(activeFilter);
    } catch {
      Alert.alert('Lỗi', 'Không thể xóa tin. Thử lại sau.');
    }
  }, [jobs, activeFilter, applyFilter]);

  const keyExtractor = useCallback((item: Job) => item.jobPostingId, []);
  const renderItem = useCallback(({ item }: { item: Job }) =>
    <JobCard job={item} onDelete={handleDelete} />, [handleDelete]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin tuyển dụng</Text>
        <TouchableOpacity
          style={styles.postBtn}
          onPress={() => router.push('/(recruiter-tabs)/post-job' as any)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.postBtnText}>Đăng tin</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <FlatList
        data={FILTER_TABS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === item && styles.filterTabActive]}
            onPress={() => applyFilter(item)}
          >
            <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
              {item === 'Tất cả' ? item :
               item === 'APPROVED' ? '✅ Hiển thị' :
               item === 'PENDING' ? '⏳ Chờ duyệt' :
               item === 'REJECTED' ? '❌ Bị từ chối' : '🕐 Hết hạn'}
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
              <Ionicons name="briefcase-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Chưa có tin tuyển dụng</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(recruiter-tabs)/post-job' as any)}>
                <Text style={styles.emptyBtnText}>Đăng tin ngay</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  postBtn: {
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.lg, gap: 4,
  },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  filterList: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, gap: 8 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: RADIUS.full, backgroundColor: COLORS.cardDark,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: 'transparent' },
  filterText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: { padding: SPACING.md, gap: 12 },
  card: {
    backgroundColor: COLORS.cardDark, borderRadius: RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  cardHeader: { flexDirection: 'row', gap: 12, marginBottom: SPACING.xs },
  jobTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 6 },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { color: COLORS.textMuted, fontSize: 12 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, alignSelf: 'flex-start',
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  salary: { color: COLORS.success, fontWeight: '700', fontSize: 14, marginVertical: SPACING.xs },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.xs },
  statsRow: { flexDirection: 'row', gap: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { color: COLORS.textMuted, fontSize: 12 },
  deleteBtn: { padding: 6 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 15 },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.lg },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
