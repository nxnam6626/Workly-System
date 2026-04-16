import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface AiInsights {
  summary: string;
  insights: { type: string; title: string; desc: string; priority: string }[];
  jdScores: { id: string; title: string; score: number; trend: string; reason: string; weaknesses?: string[]; strengths?: string[] }[];
  stats?: { totalJobs: number; activeJobs: number; totalViews: number; totalApplicants: number; avgApplyRate: number };
  cachedAt?: string;
}

interface Subscription {
  planType: string;
  canViewAIReport: boolean;
  expiryDate: string;
}

export default function AiInsightScreen() {
  const router = useRouter();
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, insightsRes] = await Promise.allSettled([
          api.get('/subscriptions/current'),
          api.get('/ai/recruiter-insights'),
        ]);

        if (subRes.status === 'fulfilled') {
          setSubscription(subRes.value.data);
        }
        if (insightsRes.status === 'fulfilled') {
          setInsights(insightsRes.value.data);
        }
      } catch {
        // handled by allSettled
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Subscription hợp lệ = còn hạn VÀ canViewAIReport = true
  const isValid = subscription &&
    subscription.canViewAIReport &&
    new Date(subscription.expiryDate) > new Date();

  if (!isValid) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Insights</Text>
        </View>
        <View style={styles.lockContainer}>
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={40} color="#a78bfa" />
          </View>
          <Text style={styles.lockTitle}>Tính năng dành cho gói Growth</Text>
          <Text style={styles.lockDesc}>
            AI Insights phân tích toàn bộ hoạt động tuyển dụng của bạn: hiệu quả tin đăng, chất lượng ứng viên, và đề xuất chiến lược tuyển dụng thông minh.
          </Text>

          <View style={styles.featureList}>
            {[
              '📊 Phân tích hiệu quả tin đăng',
              '🎯 Gợi ý ứng viên tiềm năng',
              '💡 Chiến lược tuyển dụng AI',
              '📈 Báo cáo định kỳ hàng tuần',
              '🤖 Chat AI không giới hạn',
            ].map((item) => (
              <View key={item} style={styles.featureItem}>
                <Text style={styles.featureText}>{item}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => router.push('/(recruiter-tabs)/billing' as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={styles.upgradeBtnText}>Nâng cấp lên Growth</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧠 AI Insights</Text>
        <View style={styles.planBadge}>
          <Ionicons name="sparkles" size={12} color="#a78bfa" />
          <Text style={styles.planBadgeText}>{subscription.planType}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {insights ? (
          <>
            {/* Summary */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📝 Tổng quan</Text>
              <Text style={styles.summaryText}>{insights.summary || 'Đang phân tích...'}</Text>
              {insights.stats && (
                <View style={styles.statsRow}>
                  {[
                    { label: 'Tin đang mở', value: insights.stats.activeJobs },
                    { label: 'Lượt xem', value: insights.stats.totalViews },
                    { label: 'Ứng viên', value: insights.stats.totalApplicants },
                    { label: 'Tỉ lệ apply', value: `${insights.stats.avgApplyRate}%` },
                  ].map((item) => (
                    <View key={item.label} style={styles.statItem}>
                      <Text style={styles.statValue}>{item.value}</Text>
                      <Text style={styles.statLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* AI Insights list */}
            {insights.insights?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>💡 Gợi ý AI</Text>
                {insights.insights.map((item, i) => (
                  <View key={i} style={[styles.insightItem, { borderLeftColor: item.type === 'warning' ? COLORS.error : item.type === 'success' ? COLORS.success : COLORS.primary, borderLeftWidth: 3 }]}>
                    <Text style={styles.insightTitle}>{item.title}</Text>
                    <Text style={styles.insightDesc}>{item.desc}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* JD Scores */}
            {insights.jdScores?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📊 Điểm JD</Text>
                {insights.jdScores.slice(0, 5).map((jd, i) => (
                  <View key={i} style={styles.jdRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.jdTitle} numberOfLines={1}>{jd.title}</Text>
                      {jd.weaknesses?.[0] && <Text style={styles.jdWeak}>{jd.weaknesses[0]}</Text>}
                    </View>
                    <View style={[styles.scoreBadge, { backgroundColor: jd.score >= 70 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)' }]}>
                      <Text style={[styles.scoreText, { color: jd.score >= 70 ? COLORS.success : COLORS.accent }]}>{jd.score}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {insights.cachedAt && (
              <Text style={styles.reportDate}>
                Cập nhật: {new Date(insights.cachedAt).toLocaleString('vi-VN')}
              </Text>
            )}
          </>
        ) : (
          <View style={styles.noData}>
            <Ionicons name="sparkles-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.noDataText}>AI đang phân tích dữ liệu của bạn...</Text>
            <Text style={styles.noDataSub}>Thêm tin đăng và nhận đơn ứng tuyển để bắt đầu</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  planBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(124,58,237,0.15)', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
  },
  planBadgeText: { color: '#a78bfa', fontSize: 12, fontWeight: '700' },
  content: { padding: SPACING.md, gap: 12, paddingBottom: 24 },
  card: {
    backgroundColor: COLORS.cardDark, borderRadius: RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', gap: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  summaryText: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 },
  listItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  listText: { flex: 1, color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  reportDate: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 },
  noData: { alignItems: 'center', paddingTop: 60, gap: 12 },
  noDataText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  noDataSub: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', maxWidth: 280 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statItem: { flex: 1, minWidth: '40%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center' },
  statValue: { color: '#fff', fontWeight: '800', fontSize: 18 },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  insightItem: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: 8 },
  insightTitle: { color: '#fff', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  insightDesc: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  jdRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  jdTitle: { color: '#fff', fontWeight: '600', fontSize: 13 },
  jdWeak: { color: COLORS.error, fontSize: 11, marginTop: 2 },
  scoreBadge: { width: 44, height: 44, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  scoreText: { fontWeight: '800', fontSize: 15 },

  // Lock screen
  lockContainer: { flex: 1, alignItems: 'center', padding: SPACING.lg, paddingTop: 40 },
  lockIcon: {
    width: 84, height: 84, borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(124,58,237,0.15)', justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.lg, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
  },
  lockTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: SPACING.sm },
  lockDesc: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.lg, maxWidth: 320 },
  featureList: { gap: 10, width: '100%', marginBottom: SPACING.xl },
  featureItem: {
    backgroundColor: COLORS.cardDark, borderRadius: RADIUS.md, padding: SPACING.sm + 2,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  featureText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  upgradeBtn: {
    backgroundColor: '#7c3aed', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: RADIUS.xl, gap: 8,
    shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12,
  },
  upgradeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
