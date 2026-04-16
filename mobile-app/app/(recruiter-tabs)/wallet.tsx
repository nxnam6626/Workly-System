import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';
import { connectSocket, getSocket } from '../../lib/socket';
import { useAuthStore } from '../../stores/auth';

interface WalletData {
  walletId: string;
  balance: number;
  cvUnlockQuota: number;
}

interface Transaction {
  transactionId: string;
  amount: number;
  realMoney?: number;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

const TX_STATUS_COLOR: Record<string, string> = {
  SUCCESS: COLORS.success,
  PENDING: COLORS.accent,
  CANCELLED: COLORS.error,
};

const TX_TYPE_LABEL: Record<string, string> = {
  DEPOSIT: 'Nạp tiền',
  OPEN_CV: 'Mở CV',
  BUY_PACKAGE: 'Mua gói',
  WITHDRAWAL: 'Rút tiền',
};

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

function TransactionItem({ tx }: { tx: Transaction }) {
  const isDeposit = tx.type === 'DEPOSIT';
  const statusColor = TX_STATUS_COLOR[tx.status] || COLORS.textMuted;
  const desc = tx.description?.split('|')[0] || tx.description; // remove URL part

  return (
    <View style={txStyles.row}>
      <View style={[txStyles.icon, { backgroundColor: isDeposit ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }]}>
        <Ionicons
          name={isDeposit ? 'arrow-down' : 'arrow-up'}
          size={16}
          color={isDeposit ? COLORS.success : COLORS.error}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={txStyles.desc} numberOfLines={1}>{desc}</Text>
        <Text style={txStyles.date}>{new Date(tx.createdAt).toLocaleString('vi-VN')}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[txStyles.amount, { color: isDeposit ? COLORS.success : COLORS.error }]}>
          {isDeposit ? '+' : '-'}{tx.amount} xu
        </Text>
        <View style={[txStyles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
          <Text style={[txStyles.statusText, { color: statusColor }]}>{tx.status}</Text>
        </View>
      </View>
    </View>
  );
}

export default function RecruiterWalletScreen() {
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [payOsUrl, setPayOsUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'topup' | 'history'>('topup');

  const fetchWallet = useCallback(async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        api.get('/wallets/balance'),
        api.get('/wallets/transactions'),
      ]);
      setWallet(walletRes.data);
      setTransactions(txRes.data);
    } catch (err) {
      console.error('Wallet fetch error:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Realtime socket — lắng nghe wallet:updated từ server
  useEffect(() => {
    const socket = connectSocket();

    const handleWalletUpdated = (data: { newBalance?: number }) => {
      // Re-fetch to get accurate data
      fetchWallet();
      if (data?.newBalance !== undefined) {
        setWallet((prev) => prev ? { ...prev, balance: data.newBalance! } : prev);
      }
      Alert.alert('✅ Thanh toán thành công!', 'Số dư ví của bạn đã được cập nhật.', [
        { text: 'OK' }
      ]);
    };

    // Server emits `wallet:updated:{userId}` or `wallet_updated`
    socket.on('wallet_updated', handleWalletUpdated);
    socket.on(`wallet:updated:${user?.userId}`, handleWalletUpdated);

    return () => {
      socket.off('wallet_updated', handleWalletUpdated);
      socket.off(`wallet:updated:${user?.userId}`, handleWalletUpdated);
    };
  }, [user?.userId, fetchWallet]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWallet();
    setRefreshing(false);
  }, [fetchWallet]);

  const handleTopup = async () => {
    const value = parseInt(amount.replace(/\D/g, ''), 10);
    if (!value || value < 10000) {
      Alert.alert('Lỗi', 'Số tiền tối thiểu là 10,000đ');
      return;
    }
    setLoading(true);
    try {
      const xuAmount = Math.floor(value / 1000); // VND → xu (10k VND = 10 xu)
      const { data } = await api.post('/wallets/top-up', { amount: xuAmount });
      if (data.checkoutUrl) {
        setPayOsUrl(data.checkoutUrl);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo link thanh toán lúc này');
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewNavigationChange = useCallback(
    (navState: { url: string }) => {
      const url = navState.url;
      if (url.includes('status=SUCCESS') || url.includes('status=CANCEL')) {
        setPayOsUrl(null);
        if (url.includes('status=SUCCESS')) {
          fetchWallet();
        }
      }
    },
    [fetchWallet]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ví & Thanh toán</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <View style={styles.balanceIcon}>
            <Ionicons name="wallet" size={22} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
            <Text style={styles.balanceValue}>
              {wallet !== null ? `${wallet.balance.toLocaleString('vi-VN')} xu` : '---'}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
        {wallet && wallet.cvUnlockQuota > 0 && (
          <View style={styles.quotaBadge}>
            <Ionicons name="document-text" size={14} color={COLORS.accent} />
            <Text style={styles.quotaText}>{wallet.cvUnlockQuota} lượt mở CV miễn phí</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['topup', 'history'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'topup' ? '💳 Nạp tiền' : '📋 Lịch sử'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'topup' ? (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.label}>Nhập số tiền (VND)</Text>
            <TextInput
              style={styles.input}
              placeholder="0đ"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={(val) => {
                const numeric = val.replace(/\D/g, '');
                setAmount(numeric ? parseInt(numeric).toLocaleString('vi-VN') : '');
              }}
            />

            <View style={styles.chipsRow}>
              {QUICK_AMOUNTS.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={styles.chip}
                  onPress={() => setAmount(val.toLocaleString('vi-VN'))}
                >
                  <Text style={styles.chipText}>{val / 1000}k</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.conversionNote}>
              {amount
                ? `≈ ${Math.floor(parseInt(amount.replace(/\D/g, '') || '0') / 1000)} xu`
                : '1,000đ = 1 xu'}
            </Text>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleTopup}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="qr-code" size={18} color="#fff" />
                  <Text style={styles.btnText}>Thanh toán bằng QR Code</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Số dư sẽ được cập nhật tự động ngay sau khi giao dịch thành công qua PayOS.
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.transactionId}
          renderItem={({ item }) => <TransactionItem tx={item} />}
          contentContainerStyle={styles.txList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
            </View>
          }
        />
      )}

      {/* PayOS WebView Modal */}
      <Modal visible={!!payOsUrl} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cổng thanh toán PayOS</Text>
            <TouchableOpacity onPress={() => setPayOsUrl(null)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {payOsUrl && (
            <WebView
              source={{ uri: payOsUrl }}
              style={{ flex: 1, backgroundColor: '#fff' }}
              startInLoadingState
              onNavigationStateChange={handleWebViewNavigationChange}
              renderLoading={() => (
                <View style={[{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' }]}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
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
  header: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  balanceCard: {
    margin: SPACING.md,
    backgroundColor: COLORS.cardDark,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(30,90,255,0.25)',
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(30,90,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  balanceValue: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 2 },
  refreshBtn: { marginLeft: 'auto', padding: 8 },
  quotaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(245,158,11,0.1)',
    padding: SPACING.xs + 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  quotaText: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.cardDark,
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.sm,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIUS.md },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 14 },
  tabTextActive: { color: '#fff' },
  content: { flex: 1 },
  card: {
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.cardDark,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  label: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600', marginBottom: SPACING.sm },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.lg,
    height: 56,
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: SPACING.md,
  },
  chipsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: SPACING.sm },
  chip: {
    backgroundColor: 'rgba(30,90,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(30,90,255,0.3)',
  },
  chipText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  conversionNote: { color: COLORS.textMuted, fontSize: 12, marginBottom: SPACING.lg, textAlign: 'center' },
  btn: {
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: 'rgba(30,90,255,0.05)',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(30,90,255,0.2)',
  },
  infoText: { flex: 1, color: COLORS.textMuted, fontSize: 13, lineHeight: 20 },
  txList: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, gap: 8 },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 15 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  closeBtn: { padding: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full },
});

const txStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.cardDark,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desc: { color: '#fff', fontSize: 14, fontWeight: '600' },
  date: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full, marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
});
