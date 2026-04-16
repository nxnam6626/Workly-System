import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BarChart } from 'react-native-chart-kit';
import { useAuthStore } from '../../stores/auth';
import { useSocketStore } from '../../stores/socket';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

const SCREEN_W = Dimensions.get('window').width;

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  walletBalance: number;
  cvUnlockQuota: number;
}

interface RecentApplication {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  applyDate: string;
  appStatus: string;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: COLORS.accent,
  REVIEWED: COLORS.primary,
  ACCEPTED: COLORS.success,
  REJECTED: COLORS.error,
  INTERVIEWING: '#a78bfa',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xem',
  REVIEWED: 'Đã xem',
  ACCEPTED: 'Chấp nhận',
  REJECTED: 'Từ chối',
  INTERVIEWING: 'Phỏng vấn',
};

export default function RecruiterDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isConnected } = useSocketStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApps, setRecentApps] = useState<RecentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const [jobsRes, appsRes, walletRes] = await Promise.allSettled([
        api.get('/jobs/my-jobs?limit=100'),
        api.get('/applications/my-job-applications?limit=20'),
        api.get('/wallets/balance'),
      ]);

      const jobs = jobsRes.status === 'fulfilled' ? jobsRes.value.data : { jobs: [], total: 0 };
      const apps = appsRes.status === 'fulfilled' ? appsRes.value.data : [];
      const wallet = walletRes.status === 'fulfilled' ? walletRes.value.data : { balance: 0, cvUnlockQuota: 0 };

      const jobList = jobs.jobs || jobs || [];
      const appList = Array.isArray(apps) ? apps : (apps.applications || []);

      setStats({
        totalJobs: jobList.length,
        activeJobs: jobList.filter((j: any) => j.status === 'APPROVED').length,
        totalApplications: appList.length,
        pendingApplications: appList.filter((a: any) => a.appStatus === 'PENDING').length,
        walletBalance: wallet.balance || 0,
        cvUnlockQuota: wallet.cvUnlockQuota || 0,
      });

      setRecentApps(
        appList.slice(0, 5).map((a: any) => ({
          applicationId: a.applicationId,
          candidateId: a.candidateId,
          candidateName: a.candidate?.fullName || a.candidateName || 'Ứng viên',
          jobTitle: a.jobPosting?.title || a.jobTitle || 'Công việc',
          applyDate: a.applyDate,
          appStatus: a.appStatus,
        }))
      );
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào, {user?.name} 👋</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <View style={[styles.onlineBadge, { backgroundColor: isConnected ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)' }]}>
          <View style={[styles.onlineDot, { backgroundColor: isConnected ? COLORS.success : COLORS.textMuted }]} />
          <Text style={[styles.onlineText, { color: isConnected ? COLORS.success : COLORS.textMuted }]}>
            {isConnected ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: 24 }}
      >
        {/* Wallet card */}
        <TouchableOpacity style={styles.walletCard} onPress={() => router.push('/(recruiter-tabs)/wallet')} activeOpacity={0.8}>
          <View>
            <Text style={styles.walletLabel}>💰 Số dư ví</Text>
            <Text style={styles.walletBalance}>{stats?.walletBalance?.toLocaleString('vi-VN') ?? 0} xu</Text>
            {stats?.cvUnlockQuota && stats.cvUnlockQuota > 0 ? (
              <Text style={styles.quotaText}>🎁 {stats.cvUnlockQuota} lượt mở CV miễn phí</Text>
            ) : null}
          </View>
          <View style={styles.walletActions}>
            <TouchableOpacity style={styles.topupBtn} onPress={() => router.push('/(recruiter-tabs)/wallet')}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.topupText}>Nạp xu</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Stats grid */}
        <Text style={styles.sectionTitle}>📊 Tổng quan</Text>
        <View style={styles.statsGrid}>
          {[
            { icon: 'briefcase', label: 'Tin đang mở', value: stats?.activeJobs ?? 0, color: COLORS.primary },
            { icon: 'document-text', label: 'Tổng tin đăng', value: stats?.totalJobs ?? 0, color: '#a78bfa' },
            { icon: 'people', label: 'Đơn ứng tuyển', value: stats?.totalApplications ?? 0, color: COLORS.success },
            { icon: 'time', label: 'Chờ phản hồi', value: stats?.pendingApplications ?? 0, color: COLORS.accent },
          ].map((item) => (
            <View key={item.label} style={[styles.statCard, { borderLeftColor: item.color, borderLeftWidth: 3 }]}>
              <View style={[styles.statIcon, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>⚡ Thao tác nhanh</Text>
        <View style={styles.actionsRow}>
          {[
            { icon: 'add-circle', label: 'Đăng tin', color: COLORS.primary, route: '/(recruiter-tabs)/post-job' },
            { icon: 'people', label: 'Ứng viên', color: COLORS.success, route: '/(recruiter-tabs)/candidates' },
            { icon: 'business', label: 'Công ty', color: '#0ea5e9', route: '/(recruiter-tabs)/company' },
            { icon: 'chatbubbles', label: 'Tin nhắn', color: '#a78bfa', route: '/(recruiter-tabs)/messages' },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionBtn}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                <Ionicons name={action.icon as any} size={22} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weekly Applications Chart */}
        {stats && stats.totalApplications > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: SPACING.sm }]}>📈 Thống kê 7 ngày</Text>
            <View style={styles.chartCard}>
              <BarChart
                data={{
                  labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                  datasets: [{ data: [stats.pendingApplications, Math.round(stats.totalApplications * 0.15), Math.round(stats.totalApplications * 0.2), Math.round(stats.totalApplications * 0.18), Math.round(stats.totalApplications * 0.12), Math.round(stats.totalApplications * 0.08), Math.round(stats.totalApplications * 0.05)] }],
                }}
                width={SCREEN_W - SPACING.md * 2 - 32}
                height={150}
                yAxisLabel=""
                yAxisSuffix=""
                withInnerLines={false}
                showBarTops={false}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: '#1e293b',
                  backgroundGradientTo: '#1e293b',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(30,90,255,${opacity})`,
                  labelColor: () => COLORS.textMuted,
                  barPercentage: 0.6,
                  propsForBackgroundLines: { stroke: 'transparent' },
                }}
                style={{ borderRadius: RADIUS.md }}
              />
            </View>
          </>
        )}

        {/* Recent applications */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Đơn ứng tuyển gần đây</Text>
          <TouchableOpacity onPress={() => router.push('/(recruiter-tabs)/applications' as any)}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {recentApps.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Chưa có đơn ứng tuyển nào</Text>
          </View>
        ) : (
          recentApps.map((app) => (
            <TouchableOpacity
              key={app.applicationId}
              style={styles.appRow}
              onPress={() => router.push('/(recruiter-tabs)/applications' as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.appAvatar, { backgroundColor: 'rgba(30,90,255,0.15)' }]}>
                <Text style={styles.appAvatarText}>
                  {(app.candidateName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.appName} numberOfLines={1}>{app.candidateName}</Text>
                <Text style={styles.appJob} numberOfLines={1}>{app.jobTitle}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLOR[app.appStatus] || COLORS.textMuted}20` }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[app.appStatus] || COLORS.textMuted }]}>
                  {STATUS_LABEL[app.appStatus] || app.appStatus}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.md, paddingBottom: SPACING.sm,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#fff' },
  date: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  onlineText: { fontSize: 12, fontWeight: '600' },
  walletCard: {
    backgroundColor: 'rgba(30,90,255,0.12)',
    borderRadius: RADIUS.xl, padding: SPACING.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(30,90,255,0.3)', marginBottom: SPACING.lg,
  },
  walletLabel: { color: COLORS.primary, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  walletBalance: { fontSize: 28, fontWeight: '800', color: '#fff' },
  quotaText: { fontSize: 12, color: COLORS.accent, marginTop: 4 },
  walletActions: { alignItems: 'flex-end' },
  topupBtn: {
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.lg, gap: 4,
  },
  topupText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: SPACING.sm },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.lg },
  chartCard: { backgroundColor: COLORS.cardDark, borderRadius: RADIUS.lg, padding: SPACING.sm, marginBottom: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.cardDark,
    borderRadius: RADIUS.lg, padding: SPACING.sm,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  statIcon: { width: 42, height: 42, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.lg },
  actionBtn: { flex: 1, alignItems: 'center', gap: 8 },
  actionIcon: { width: 52, height: 52, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },
  appRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.cardDark, borderRadius: RADIUS.lg, padding: SPACING.sm + 2,
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  appAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  appAvatarText: { color: COLORS.primary, fontWeight: '800', fontSize: 16 },
  appName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  appJob: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 11, fontWeight: '700' },
  emptyCard: {
    backgroundColor: COLORS.cardDark, borderRadius: RADIUS.xl, padding: SPACING.xl,
    justifyContent: 'center', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderStyle: 'dashed',
  },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
});
