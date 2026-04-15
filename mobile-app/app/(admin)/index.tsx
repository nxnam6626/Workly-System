import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface Stats {
  totalUsers?: number;
  totalJobs?: number;
  pendingJobs?: number;
  totalRevenue?: number;
  activeRecruiters?: number;
  openTickets?: number;
}

const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) => (
  <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
    <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon as any} size={22} color={color} />
    </View>
    <View>
      <Text style={styles.statValue}>{value?.toLocaleString() ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const QuickAction = ({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon as any} size={24} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/stats');
        setStats(data);
      } catch {}
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Welcome */}
        <View style={styles.welcome}>
          <View style={styles.shieldWrap}>
            <Ionicons name="shield-checkmark" size={28} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.welcomeTitle}>Admin Dashboard</Text>
            <Text style={styles.welcomeSub}>Quản trị hệ thống Workly</Text>
          </View>
        </View>

        {/* Stats Grid */}
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 30 }} />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard icon="people" label="Người dùng" value={stats.totalUsers ?? 0} color={COLORS.primary} />
            <StatCard icon="briefcase" label="Tin đăng" value={stats.totalJobs ?? 0} color={COLORS.success} />
            <StatCard icon="time" label="Chờ duyệt" value={stats.pendingJobs ?? 0} color={COLORS.professional} />
            <StatCard icon="cash" label="Doanh thu" value={`${((stats.totalRevenue ?? 0) / 1_000_000).toFixed(1)}M₫`} color="#a78bfa" />
            <StatCard icon="business" label="NTD hoạt động" value={stats.activeRecruiters ?? 0} color="#06b6d4" />
            <StatCard icon="chatbubble-ellipses" label="Ticket mở" value={stats.openTickets ?? 0} color={COLORS.urgent} />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.actionsGrid}>
            <QuickAction icon="document-text" label="Tin đăng" color={COLORS.primary} onPress={() => router.push('/(admin)/jobs' as any)} />
            <QuickAction icon="people" label="Người dùng" color="#a78bfa" onPress={() => router.push('/(admin)/users' as any)} />
            <QuickAction icon="chatbubble-ellipses" label="Hỗ trợ" color={COLORS.success} onPress={() => router.push('/(admin)/support' as any)} />
            <QuickAction icon="bar-chart" label="Doanh thu" color={COLORS.professional} onPress={() => router.push('/(admin)/revenue' as any)} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  welcome: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.lg,
  },
  shieldWrap: {
    width: 52, height: 52, borderRadius: RADIUS.md,
    backgroundColor: 'rgba(30,90,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  welcomeTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  welcomeSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.md, gap: 10, marginBottom: SPACING.md },
  statCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1,
    minWidth: '45%', backgroundColor: COLORS.cardDark,
    borderRadius: RADIUS.lg, padding: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  statIcon: { width: 44, height: 44, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  section: { paddingHorizontal: SPACING.md, marginBottom: SPACING.xl },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: {
    width: '47%', backgroundColor: COLORS.cardDark, borderRadius: RADIUS.lg,
    padding: SPACING.md, alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  actionIcon: { width: 52, height: 52, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
