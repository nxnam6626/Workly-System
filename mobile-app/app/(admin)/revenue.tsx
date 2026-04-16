import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useSocketStore } from '../../stores/socket';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface RevenueStats {
  totalRevenue: number;
  totalDeposits: number;
  totalTransactions: number;
  periodRevenue: number;
}

interface Transaction {
  transactionId: string;
  amount: number;
  realMoney?: number;
  type: string;
  description?: string;
  status: string;
  createdAt: string;
  wallet?: { recruiter?: { user?: { name?: string; email: string } } };
}

export default function AdminRevenueScreen() {
  const { socket } = useSocketStore();
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRevenue = useCallback(async () => {
    try {
      const [statsRes, txRes] = await Promise.allSettled([
        api.get('/admin/revenue/stats'),
        api.get('/admin/revenue/transactions?limit=30'),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (txRes.status === 'fulfilled') {
        const data = txRes.value.data;
        setTransactions(Array.isArray(data) ? data : (data.transactions || []));
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRevenue(); }, [fetchRevenue]);

  // Realtime: khi có giao dịch mới (từ webhook)
  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchRevenue();
    socket.on('wallet_updated', handler);
    return () => { socket.off('wallet_updated', handler); };
  }, [socket, fetchRevenue]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRevenue();
    setRefreshing(false);
  }, [fetchRevenue]);

  const STAT_ITEMS = stats ? [
    { icon: 'card', label: 'Tổng doanh thu', value: `${stats.totalRevenue?.toLocaleString('vi-VN') ?? 0} xu`, color: COLORS.success },
    { icon: 'trending-up', label: 'Đơn đặt cọc', value: stats.totalDeposits ?? 0, color: COLORS.primary },
    { icon: 'receipt', label: 'Tổng giao dịch', value: stats.totalTransactions ?? 0, color: '#a78bfa' },
    { icon: 'calendar', label: 'Tháng này', value: `${stats.periodRevenue?.toLocaleString('vi-VN') ?? 0} xu`, color: COLORS.accent },
  ] : [];

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
        <Text style={styles.headerTitle}>📈 Doanh thu</Text>
        <Text style={styles.subtitle}>Realtime</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={styles.content}
      >
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {STAT_ITEMS.map((item) => (
            <View key={item.label} style={[styles.statCard, { borderTopColor: item.color, borderTopWidth: 3 }]}>
              <View style={[styles.statIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={styles.statValue} numberOfLines={1}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Recent transactions */}
        <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
        {transactions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Chưa có giao dịch</Text>
          </View>
        ) : (
          transactions.map((tx) => {
            const name = tx.wallet?.recruiter?.user?.name || tx.wallet?.recruiter?.user?.email || 'Người dùng';
            const isDeposit = tx.type === 'DEPOSIT';
            return (
              <View key={tx.transactionId} style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: isDeposit ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                  <Ionicons name={isDeposit ? 'arrow-down' : 'arrow-up'} size={16} color={isDeposit ? COLORS.success : COLORS.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txName} numberOfLines={1}>{name}</Text>
                  <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString('vi-VN')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.txAmount, { color: isDeposit ? COLORS.success : COLORS.error }]}>
                    {isDeposit ? '+' : '-'}{tx.amount} xu
                  </Text>
                  {tx.realMoney && (
                    <Text style={styles.txReal}>{tx.realMoney.toLocaleString('vi-VN')}đ</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { color: COLORS.success, fontSize: 12, fontWeight: '700' },
  content: { padding: SPACING.md, paddingBottom: 24 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.lg },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.cardDark,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', gap: 8,
  },
  statIcon: { width: 40, height: 40, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  statLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: SPACING.sm },
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.cardDark, borderRadius: RADIUS.lg, padding: SPACING.sm + 2,
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  txIcon: { width: 38, height: 38, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  txName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  txDate: { color: COLORS.textMuted, fontSize: 12 },
  txAmount: { fontSize: 14, fontWeight: '800' },
  txReal: { color: COLORS.textMuted, fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
});
