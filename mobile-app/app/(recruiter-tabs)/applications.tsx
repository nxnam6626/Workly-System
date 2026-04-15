import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface Application {
  applicationId: string;
  candidateId: string;
  appStatus: string;
  applyDate: string;
  coverLetter?: string;
  feedback?: string;
  cvSnapshotUrl?: string;
  candidate?: { fullName: string; userId: string };
  jobPosting?: { title: string };
  cv?: { fileUrl?: string };
}

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  PENDING:      { color: COLORS.accent,   label: 'Chờ xem' },
  REVIEWED:     { color: COLORS.primary,  label: 'Đã xem' },
  ACCEPTED:     { color: COLORS.success,  label: 'Chấp nhận' },
  REJECTED:     { color: COLORS.error,    label: 'Từ chối' },
  INTERVIEWING: { color: '#a78bfa',       label: 'Phỏng vấn' },
};

export default function RecruiterApplicationsScreen() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchApps = useCallback(async () => {
    try {
      const { data } = await api.get('/applications/my-job-applications?limit=50');
      setApplications(Array.isArray(data) ? data : (data.applications || []));
    } catch {
      Alert.alert('Lỗi', 'Không thể tải đơn ứng tuyển');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchApps();
    setRefreshing(false);
  }, [fetchApps]);

  const handleAction = useCallback(async (id: string, action: 'ACCEPTED' | 'REJECTED' | 'INTERVIEWING') => {
    const labels: Record<string, string> = {
      ACCEPTED: 'Chấp nhận',
      REJECTED: 'Từ chối',
      INTERVIEWING: 'Mời phỏng vấn',
    };
    Alert.alert(
      `${labels[action]} ứng viên?`,
      `Bạn chắc chắn muốn ${labels[action].toLowerCase()} ứng viên này?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          style: action === 'REJECTED' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await api.patch(`/applications/${id}/status`, { appStatus: action });
              setApplications((prev) =>
                prev.map((a) => (a.applicationId === id ? { ...a, appStatus: action } : a))
              );
            } catch {
              Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
            }
          },
        },
      ]
    );
  }, []);

  const filtered = filterStatus === 'ALL' ? applications : applications.filter((a) => a.appStatus === filterStatus);

  const renderItem = useCallback(({ item }: { item: Application }) => {
    const cfg = STATUS_CFG[item.appStatus] || { color: COLORS.textMuted, label: item.appStatus };
    const name = item.candidate?.fullName || 'Ứng viên';
    const job = item.jobPosting?.title || 'Công việc';

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.job} numberOfLines={1}>{job}</Text>
            <Text style={styles.date}>{new Date(item.applyDate).toLocaleDateString('vi-VN')}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${cfg.color}20` }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {item.coverLetter ? (
          <View style={styles.coverLetter}>
            <Text style={styles.coverLetterLabel}>Thư xin việc:</Text>
            <Text style={styles.coverLetterText} numberOfLines={3}>{item.coverLetter}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {item.cv?.fileUrl || item.cvSnapshotUrl ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setCvUrl(item.cv?.fileUrl || item.cvSnapshotUrl || null)}
            >
              <Ionicons name="document-text" size={14} color={COLORS.primary} />
              <Text style={[styles.actionText, { color: COLORS.primary }]}>Xem CV</Text>
            </TouchableOpacity>
          ) : null}

          {item.appStatus === 'PENDING' || item.appStatus === 'REVIEWED' ? (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: 'rgba(34,197,94,0.1)' }]}
                onPress={() => handleAction(item.applicationId, 'ACCEPTED')}
              >
                <Ionicons name="checkmark" size={14} color={COLORS.success} />
                <Text style={[styles.actionText, { color: COLORS.success }]}>Chấp nhận</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: 'rgba(124,58,237,0.1)' }]}
                onPress={() => handleAction(item.applicationId, 'INTERVIEWING')}
              >
                <Ionicons name="mic" size={14} color="#a78bfa" />
                <Text style={[styles.actionText, { color: '#a78bfa' }]}>Phỏng vấn</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
                onPress={() => handleAction(item.applicationId, 'REJECTED')}
              >
                <Ionicons name="close" size={14} color={COLORS.error} />
                <Text style={[styles.actionText, { color: COLORS.error }]}>Từ chối</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    );
  }, [handleAction]);

  const keyExtractor = useCallback((item: Application) => item.applicationId, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn ứng tuyển</Text>
        <Text style={styles.count}>{applications.length} đơn</Text>
      </View>

      {/* Filter */}
      <FlatList
        data={['ALL', 'PENDING', 'REVIEWED', 'ACCEPTED', 'INTERVIEWING', 'REJECTED']}
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
              <Ionicons name="document-text-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Chưa có đơn ứng tuyển</Text>
            </View>
          }
        />
      )}

      {/* CV Viewer Modal */}
      <Modal visible={!!cvUrl} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Xem CV / Hồ sơ</Text>
            <TouchableOpacity onPress={() => setCvUrl(null)} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          {cvUrl && (
            <WebView
              source={{ uri: cvUrl }}
              style={{ flex: 1 }}
              startInLoadingState
              renderLoading={() => (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator color={COLORS.primary} />
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
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
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(30,90,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: COLORS.primary, fontWeight: '800', fontSize: 18 },
  name: { color: '#fff', fontWeight: '700', fontSize: 15 },
  job: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  date: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700' },
  coverLetter: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  coverLetterLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  coverLetterText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actionText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 15 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  closeBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full },
});
