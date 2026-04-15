import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS, formatSalary, JOB_TYPE_LABEL } from '../../lib/constants';
import { useAuthStore } from '../../stores/auth';

interface JobDetail {
  jobPostingId: string;
  title: string;
  description: string;
  requirements?: string;
  salary_display?: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  locationCity: string | null;
  jobType: string | null;
  jobTier: 'BASIC' | 'PROFESSIONAL' | 'URGENT';
  experience?: string;
  company: { companyName: string; logo: string | null; website?: string };
  slug?: string;
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/job-postings/${id}`);
        setJob(data);
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleApply = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    setApplying(true);
    try {
      await api.post(`/applications`, { jobPostingId: job?.jobPostingId });
      Alert.alert('✅ Nộp đơn thành công', 'Hồ sơ của bạn đã được gửi đến nhà tuyển dụng!');
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể nộp đơn lúc này');
    } finally {
      setApplying(false);
    }
  };

  const toggleSave = async () => {
    if (!isAuthenticated) { router.push('/(auth)/login'); return; }
    try {
      if (isSaved) {
        await api.delete(`/favorites/${job?.jobPostingId}`);
      } else {
        await api.post(`/favorites`, { jobPostingId: job?.jobPostingId });
      }
      setIsSaved(!isSaved);
    } catch {}
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgDark }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgDark }}>
        <Text style={{ color: COLORS.textMuted }}>Không tìm thấy tin tuyển dụng</Text>
      </View>
    );
  }

  const isUrgent = job.jobTier === 'URGENT';
  const isPro = job.jobTier === 'PROFESSIONAL';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Custom header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleSave} style={styles.saveBtn}>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={24} color={isSaved ? COLORS.primary : '#fff'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header Card */}
        <View style={[styles.headerCard, isUrgent && styles.headerCardUrgent, isPro && styles.headerCardPro]}>
          {(isUrgent || isPro) && (
            <View style={[styles.tierBadge, { backgroundColor: isUrgent ? COLORS.urgent : COLORS.professional }]}>
              <Text style={styles.tierBadgeText}>{isUrgent ? '🔥 Tuyển Gấp' : '⭐ Nổi Bật'}</Text>
            </View>
          )}
          <View style={styles.logoWrap}>
            {job.company?.logo ? (
              <Image source={{ uri: job.company.logo || undefined }} style={{ width: 64, height: 64 }} contentFit="contain" />
            ) : (
              <Text style={styles.logoText}>{job.company?.companyName?.slice(0, 2).toUpperCase()}</Text>
            )}
          </View>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.companyName}>{job.company?.companyName}</Text>

          {/* Tags Row */}
          <View style={styles.tagRow}>
            {job.locationCity && (
              <View style={styles.tag}>
                <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.tagText}>{job.locationCity}</Text>
              </View>
            )}
            {job.jobType && (
              <View style={styles.tag}>
                <Ionicons name="briefcase-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.tagText}>{JOB_TYPE_LABEL[job.jobType] || job.jobType}</Text>
              </View>
            )}
            <View style={[styles.tag, styles.salaryTag]}>
              <Ionicons name="cash-outline" size={13} color={COLORS.success} />
              <Text style={[styles.tagText, { color: COLORS.success, fontWeight: '700' }]}>
                {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả công việc</Text>
          <Text style={styles.body}>{job.description}</Text>
        </View>

        {job.requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yêu cầu ứng viên</Text>
            <Text style={styles.body}>{job.requirements}</Text>
          </View>
        )}
      </ScrollView>

      {/* Apply CTA — fixed at bottom */}
      <View style={styles.applyBar}>
        <TouchableOpacity
          style={[
            styles.applyBtn,
            isUrgent && styles.applyBtnUrgent,
            isPro && styles.applyBtnPro,
            applying && styles.applyBtnDisabled,
          ]}
          onPress={handleApply}
          disabled={applying}
          activeOpacity={0.85}
        >
          {applying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.applyBtnText}>Ứng tuyển ngay</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.sm,
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  saveBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  headerCard: {
    backgroundColor: COLORS.cardDark, marginHorizontal: SPACING.md,
    marginTop: 106, borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  headerCardUrgent: { borderColor: 'rgba(239,68,68,0.3)' },
  headerCardPro: { borderColor: 'rgba(245,158,11,0.3)' },
  tierBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.full, marginBottom: SPACING.sm },
  tierBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  logoWrap: {
    width: 72, height: 72, borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md, overflow: 'hidden',
  },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 24 },
  jobTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 6 },
  companyName: { fontSize: 14, color: COLORS.textMuted, marginBottom: SPACING.md },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full,
  },
  salaryTag: { backgroundColor: 'rgba(34,197,94,0.1)' },
  tagText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  section: { margin: SPACING.md, backgroundColor: COLORS.cardDark, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: SPACING.sm },
  body: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22 },
  applyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.bgDark, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: SPACING.md, paddingBottom: 36, paddingTop: SPACING.sm,
  },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    height: 54, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
  },
  applyBtnUrgent: { backgroundColor: COLORS.urgent, shadowColor: COLORS.urgent },
  applyBtnPro: { backgroundColor: COLORS.professional, shadowColor: COLORS.professional },
  applyBtnDisabled: { opacity: 0.6 },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
