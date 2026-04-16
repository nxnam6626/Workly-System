import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface Application {
  applicationId: string;
  applyDate: string;
  appStatus: string;
  feedback?: string;
  jobPosting?: { title: string; company?: { companyName: string; logo?: string } };
}

const STATUS_CFG: Record<string, { color: string; label: string; icon: string }> = {
  PENDING:      { color: COLORS.accent,   label: 'Chờ phản hồi', icon: 'time' },
  REVIEWED:     { color: COLORS.primary,  label: 'Đã xem',       icon: 'eye' },
  ACCEPTED:     { color: COLORS.success,  label: '✅ Chấp nhận', icon: 'checkmark-circle' },
  REJECTED:     { color: COLORS.error,    label: '❌ Từ chối',   icon: 'close-circle' },
  INTERVIEWING: { color: '#a78bfa',       label: '🎤 Phỏng vấn', icon: 'mic' },
};

const FILTER_OPTIONS = ['Tất cả', 'PENDING', 'REVIEWED', 'ACCEPTED', 'INTERVIEWING', 'REJECTED'];

export default function CandidateApplicationsScreen() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filtered, setFiltered] = useState<Application[]>([]);
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      const { data } = await api.get('/applications/my-applications');
      const list = Array.isArray(data) ? data : [];
      setApplications(list);
      setFiltered(list);
    } catch {
      setApplications([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const applyFilter = useCallback((filter: string) => {
    setActiveFilter(filter);
    setFiltered(filter === 'Tất cả' ? applications : applications.filter((a) => a.appStatus === filter));
  }, [applications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
  }, [fetchApplications]);

  const renderItem = useCallback(({ item }: { item: Application }) => {
    const cfg = STATUS_CFG[item.appStatus] || { color: COLORS.textMuted, label: item.appStatus, icon: 'help' };
    const company = item.jobPosting?.company?.companyName || 'Công ty';
    const job = item.jobPosting?.title || 'Vị trí';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.companyLogo}>
            <Text style={styles.companyInitial}>{company.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.jobTitle} numberOfLines={1}>{job}</Text>
            <Text style={styles.companyName} numberOfLines={1}>{company}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${cfg.color}15` }]}>
            <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <Text style={styles.applyDate}>
          Nộp ngày {new Date(item.applyDate).toLocaleDateString('vi-VN')}
        </Text>

        {item.feedback ? (
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackLabel}>Phản hồi từ nhà tuyển dụng:</Text>
            <Text style={styles.feedbackText}>{item.feedback}</Text>
          </View>
        ) : null}

        {item.appStatus === 'ACCEPTED' && (
          <View style={styles.acceptedBanner}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.acceptedText}>Chúc mừng! Hồ sơ của bạn đã được chấp nhận</Text>
          </View>
        )}
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item: Application) => item.applicationId, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn ứng tuyển</Text>
        <Text style={styles.count}>{applications.length} đơn</Text>
      </View>

      {/* Filter */}
      <FlatList
        data={FILTER_OPTIONS}
        horizontal showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 8, gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
            onPress={() => applyFilter(item)}
          >
            <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
              {item === 'Tất cả' ? 'Tất cả' : STATUS_CFG[item]?.label || item}
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
              <Ionicons name="document-text-outline" size={56} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Chưa ứng tuyển việc nào</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/jobs')}>
                <Text style={styles.emptyBtnText}>Tìm việc ngay</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  count: { color: COLORS.textMuted, fontSize: 14 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.cardDark, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: 'transparent' },
  filterText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: { padding: SPACING.md, gap: 12 },
  card: { backgroundColor: COLORS.cardDark, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
  companyLogo: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: 'rgba(30,90,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  companyInitial: { color: COLORS.primary, fontWeight: '800', fontSize: 18 },
  jobTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  companyName: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700' },
  applyDate: { color: COLORS.textMuted, fontSize: 12, marginBottom: SPACING.xs },
  feedbackBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.md, padding: SPACING.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  feedbackLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  feedbackText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  acceptedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(34,197,94,0.08)', borderRadius: RADIUS.md, padding: SPACING.sm, marginTop: SPACING.sm, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
  acceptedText: { color: COLORS.success, fontSize: 13, fontWeight: '600', flex: 1 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 16 },
  emptyTitle: { color: '#fff', fontWeight: '700', fontSize: 18 },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.lg },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
