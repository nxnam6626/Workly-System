import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Modal } from 'react-native';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface Plan {
  planType: string;
  label: string;
  priceXu: number;
  priceLabelVND: string;
  durationDays: number;
  features: string[];
  color: string;
  recommended?: boolean;
}

const PLANS: Plan[] = [
  {
    planType: 'LITE',
    label: 'LITE',
    priceXu: 450,
    priceLabelVND: '450.000đ / tháng',
    durationDays: 30,
    color: '#3b82f6', // blue-500
    features: [
      'Đăng 10 Tin BASIC',
      'Đăng 5 Tin VIP & 2 Tin URGENT',
      'Mở khóa AI Report Dashboard',
      'Tiết kiệm cực sốc cho Khách hàng trải nghiệm',
    ],
  },
  {
    planType: 'GROWTH',
    label: 'GROWTH',
    priceXu: 2000,
    priceLabelVND: '2.000.000đ / tháng',
    durationDays: 30,
    color: '#f59e0b', // amber-500
    recommended: true,
    features: [
      'Đăng 5 Tin VIP chuyên nghiệp',
      'Đăng 2 Tin URGENT Tuyển gấp',
      'Mở khóa AI Report Dashboard',
      'Auto-refresh tin sau 48h',
      'Tiết kiệm 30% chi phí',
    ],
  },
];

const CV_PACKS = [
  { id: 'XEM_NHANH', name: 'Gói "Xem Nhanh"', price: '150.000', xuPrice: 150, quota: 6, subtitle: 'Mua 5 tặng 1' },
  { id: 'SAN_TAI', name: 'Gói "Săn Tài"', price: '400.000', xuPrice: 400, quota: 20, subtitle: 'Giá cực hời cho HR' }
];

export default function BillingScreen() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      const { data } = await api.get('/subscriptions/current');
      setSubscription(data);
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  const handlePurchase = useCallback(async (plan: Plan) => {
    Alert.alert(
      `Mua gói ${plan.label}`,
      `Bạn sẽ thanh toán ${plan.priceXu} xu (${plan.priceLabelVND.split(' ')[0]}) từ ví. Xác nhận?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận mua',
          onPress: async () => {
            setPurchasing(plan.planType);
            try {
              const { data } = await api.post('/subscriptions/buy', { planType: plan.planType });
              if (data.checkoutUrl) {
                setPayUrl(data.checkoutUrl);
              } else {
                Alert.alert('✅ Thành công!', `Đã kích hoạt gói ${plan.label}`, [
                  { text: 'OK', onPress: fetchSubscription },
                ]);
              }
            } catch (err: any) {
              const msg = err.response?.data?.message || 'Không thể mua gói. Kiểm tra số dư ví.';
              Alert.alert('Lỗi', msg);
            } finally {
              setPurchasing(null);
            }
          },
        },
      ]
    );
  }, [fetchSubscription]);

  const handleBuyCvPack = useCallback(async (pack: typeof CV_PACKS[0]) => {
    Alert.alert(
      `Mua ${pack.name}`,
      `Xác nhận mua gói này với giá ${pack.xuPrice} xu (${pack.price}đ) để nhận ${pack.quota} lượt mở CV.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Mua ngay',
          onPress: async () => {
            setPurchasing(pack.id);
            try {
              await api.post('/subscriptions/buy-cv-hunter', { packageType: pack.id });
              Alert.alert('✅ Thành công!', `Đã nhận được ${pack.quota} lượt xem hồ sơ CV.`);
            } catch (err: any) {
              const msg = err.response?.data?.message || 'Không thể mua gói do số dư ví.';
              Alert.alert('Lỗi thanh toán', msg);
            } finally {
              setPurchasing(null);
            }
          }
        }
      ]
    );
  }, []);

  const handleWebViewChange = useCallback((navState: { url: string }) => {
    const { url } = navState;
    if (url.includes('status=SUCCESS') || url.includes('status=CANCEL')) {
      setPayUrl(null);
      if (url.includes('status=SUCCESS')) {
        fetchSubscription();
        Alert.alert('✅ Thanh toán thành công!', 'Gói dịch vụ đã được kích hoạt.');
      }
    }
  }, [fetchSubscription]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isExpired = subscription?.expiryDate && new Date(subscription.expiryDate) < new Date();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gói dịch vụ</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Current plan banner */}
        {subscription && !isExpired ? (
          <View style={styles.currentPlan}>
            <View style={styles.currentPlanLeft}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <View>
                <Text style={styles.currentPlanLabel}>Gói hiện tại</Text>
                <Text style={styles.currentPlanName}>{subscription.planType}</Text>
              </View>
            </View>
            <Text style={styles.currentPlanExpiry}>
              HSD: {new Date(subscription.expiryDate).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        ) : (
          <View style={styles.noPlan}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.accent} />
            <Text style={styles.noPlanText}>
              {isExpired ? 'Gói dịch vụ đã hết hạn. Vui lòng gia hạn.' : 'Bạn chưa có gói dịch vụ nào.'}
            </Text>
          </View>
        )}

        {/* Plans */}
        {PLANS.map((plan) => {
          const isActive = subscription?.planType === plan.planType && !isExpired;
          const isBuying = purchasing === plan.planType;

          return (
            <View key={plan.planType} style={[styles.planCard, plan.recommended && styles.planCardHighlight, isActive && { borderColor: plan.color }]}>
              {plan.recommended && (
                <View style={[styles.recommendedBadge, { backgroundColor: plan.color }]}>
                  <Text style={styles.recommendedText}>Phổ biến nhất</Text>
                </View>
              )}

              <Text style={styles.planLabel}>{plan.label}</Text>
              <Text style={[styles.planPrice, { color: plan.color }]}>{plan.priceLabelVND}</Text>

              <View style={styles.featureList}>
                {plan.features.map((f, i) => (
                  <View key={i} style={styles.featureItem}>
                    <Ionicons name="checkmark" size={14} color={plan.color} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>

              {isActive ? (
                <View style={[styles.activeBtn, { borderColor: plan.color }]}>
                  <Ionicons name="checkmark-circle" size={16} color={plan.color} />
                  <Text style={[styles.activeBtnText, { color: plan.color }]}>Đang dùng</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.buyBtn, { backgroundColor: plan.color }, isBuying && styles.buyBtnDisabled]}
                  onPress={() => handlePurchase(plan)}
                  disabled={!!purchasing}
                  activeOpacity={0.85}
                >
                  {isBuying
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Ionicons name="sparkles" size={16} color="#fff" />
                        <Text style={styles.buyBtnText}>Mua ngay</Text>
                      </>
                  }
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <View style={styles.cvContainer}>
          <Text style={styles.cvTitle}>Nhu cầu Mở khóa ứng viên?</Text>
          <Text style={styles.cvSub}>Tiết kiệm lớn với các gói mở khóa riêng lẻ (Không cần mua gói tháng)</Text>
          
          {CV_PACKS.map(pack => (
            <View key={pack.id} style={styles.cvCard}>
              <View>
                <Text style={styles.cvName}>{pack.name}</Text>
                <Text style={styles.cvSubtitle}>{pack.subtitle}</Text>
                <Text style={styles.cvPrice}>{pack.price} đ</Text>
                <Text style={styles.cvQuota}>✨ Nhận ngay {pack.quota} lượt mở CV</Text>
              </View>
              <TouchableOpacity
                style={styles.cvBuyBtn}
                onPress={() => handleBuyCvPack(pack)}
                disabled={!!purchasing}
              >
                {purchasing === pack.id ? <ActivityIndicator size="small" color="#10b981" /> : <Text style={styles.cvBuyBtnText}>Mua ngay</Text>}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="wallet-outline" size={18} color={COLORS.textMuted} />
          <Text style={styles.infoText}>Thanh toán từ số dư ví. Vào mục Ví để nạp tiền.</Text>
        </View>
      </ScrollView>

      {/* PayOS Modal */}
      <Modal visible={!!payUrl} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thanh toán PayOS</Text>
            <TouchableOpacity onPress={() => setPayUrl(null)} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          {payUrl && (
            <WebView source={{ uri: payUrl }} style={{ flex: 1 }}
              onNavigationStateChange={handleWebViewChange} startInLoadingState />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  content: { padding: SPACING.md, gap: 16, paddingBottom: 32 },
  currentPlan: {
    backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: RADIUS.lg, padding: SPACING.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
  },
  currentPlanLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  currentPlanLabel: { color: COLORS.textMuted, fontSize: 12 },
  currentPlanName: { color: '#fff', fontWeight: '800', fontSize: 16 },
  currentPlanExpiry: { color: COLORS.textMuted, fontSize: 12 },
  noPlan: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
  },
  noPlanText: { color: COLORS.textSecondary, fontSize: 14, flex: 1 },
  planCard: {
    backgroundColor: COLORS.cardDark, borderRadius: RADIUS.xl, padding: SPACING.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden',
  },
  planCardHighlight: { borderColor: 'rgba(124,58,237,0.4)', borderWidth: 2 },
  recommendedBadge: {
    position: 'absolute', top: 14, right: -20, width: 120, alignItems: 'center',
    transform: [{ rotate: '45deg' }], paddingVertical: 4,
  },
  recommendedText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  planLabel: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  planPrice: { fontSize: 16, fontWeight: '700', marginBottom: SPACING.md },
  featureList: { gap: 8, marginBottom: SPACING.lg },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { color: COLORS.textSecondary, fontSize: 14 },
  buyBtn: {
    height: 50, borderRadius: RADIUS.lg, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  buyBtnDisabled: { opacity: 0.6 },
  buyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  activeBtn: {
    height: 50, borderRadius: RADIUS.lg, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
    borderWidth: 2, backgroundColor: 'transparent',
  },
  activeBtnText: { fontSize: 15, fontWeight: '800' },
  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.lg, padding: SPACING.md,
  },
  infoText: { flex: 1, color: COLORS.textMuted, fontSize: 13 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  closeBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full },
  cvContainer: { marginTop: SPACING.xl, gap: 12 },
  cvTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  cvSub: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', marginBottom: SPACING.sm },
  cvCard: {
    backgroundColor: COLORS.cardDark, borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  cvName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cvSubtitle: { color: '#10b981', fontSize: 12, fontWeight: '600', marginVertical: 2 },
  cvPrice: { color: '#fff', fontSize: 20, fontWeight: '900', marginVertical: 4 },
  cvQuota: { color: COLORS.textSecondary, fontSize: 13 },
  cvBuyBtn: { backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.md },
  cvBuyBtnText: { color: '#10b981', fontWeight: '800', fontSize: 14 },
});
