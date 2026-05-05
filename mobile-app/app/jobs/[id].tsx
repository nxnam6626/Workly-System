import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS, formatSalary, JOB_TYPE_LABEL } from '../../lib/constants';
import { useAuthStore } from '../../stores/auth';
import { DetailSection } from '../../components/ui/DetailSection';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

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
      } catch {
        // Silent error
      } finally {
        setLoading(false);
      }
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
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    try {
      if (isSaved) {
        await api.delete(`/favorites/${job?.jobPostingId}`);
      } else {
        await api.post(`/favorites`, { jobPostingId: job?.jobPostingId });
      }
      setIsSaved(!isSaved);
    } catch {
      // Silent error
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Không tìm thấy tin tuyển dụng</Text>
      </View>
    );
  }

  const isUrgent = job.jobTier === 'URGENT';
  const isPro = job.jobTier === 'PROFESSIONAL';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="dark" />
      {/* Top Navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleSave} style={styles.navBtn}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isSaved ? COLORS.primary : COLORS.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            {job.company?.logo ? (
              <Image
                source={{ uri: job.company.logo }}
                style={styles.logo}
                contentFit="contain"
              />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>
                  {job.company?.companyName?.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.companyName}>{job.company?.companyName}</Text>

          <View style={styles.badgeRow}>
            {isUrgent && <Badge label="Tuyển gấp" color={COLORS.urgent} backgroundColor="rgba(239,68,68,0.1)" />}
            {isPro && <Badge label="Nổi bật" color={COLORS.accent} backgroundColor="rgba(245,158,11,0.1)" />}
            {job.jobType && (
              <Badge
                label={JOB_TYPE_LABEL[job.jobType] || job.jobType}
                color={COLORS.primary}
                backgroundColor="rgba(25, 103, 210, 0.1)"
              />
            )}
          </View>
          
          <View style={styles.salaryContainer}>
             <Text style={styles.salaryText}>
                {formatSalary(job.salaryMin, job.salaryMax, job.currency ?? undefined)}
             </Text>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.quickInfoRow}>
             <View style={styles.quickInfoItem}>
                <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                <Text style={styles.quickInfoText}>{job.locationCity || 'Toàn quốc'}</Text>
             </View>
             <View style={styles.quickInfoItem}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                <Text style={styles.quickInfoText}>Hạn nộp: 30 ngày tới</Text>
             </View>
          </View>
        </View>

        {/* Content Sections */}
        <View style={styles.sectionsContainer}>
          <DetailSection title="Mô tả công việc">
            <Text style={styles.bodyText}>{job.description}</Text>
          </DetailSection>

          {job.requirements && (
            <DetailSection title="Yêu cầu ứng viên">
              <Text style={styles.bodyText}>{job.requirements}</Text>
            </DetailSection>
          )}

          <DetailSection title="Thông tin công ty">
            <View style={styles.companyInfoBox}>
              <Text style={styles.companyInfoName}>{job.company?.companyName}</Text>
              {job.company?.website && (
                <Text style={styles.companyWebsite}>{job.company.website}</Text>
              )}
              <TouchableOpacity style={styles.viewCompanyBtn}>
                <Text style={styles.viewCompanyText}>Xem trang công ty</Text>
              </TouchableOpacity>
            </View>
          </DetailSection>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <Button
          title="Ứng tuyển ngay"
          onPress={handleApply}
          loading={applying}
          style={styles.applyBtn}
        />
      </View>
    </SafeAreaView>
  );
}

import { StatusBar } from 'expo-status-bar';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    height: 60,
  },
  navBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    backgroundColor: '#fff',
  },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.lg,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  logo: {
    width: 70,
    height: 70,
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  logoText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 28,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  salaryContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
  },
  salaryText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    width: '100%',
    marginBottom: SPACING.lg,
  },
  quickInfoRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickInfoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  sectionsContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  bodyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  companyInfoBox: {
    paddingVertical: SPACING.xs,
  },
  companyInfoName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  companyWebsite: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  viewCompanyBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignSelf: 'flex-start',
  },
  viewCompanyText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: 30, // iOS handle space
  },
  applyBtn: {
    height: 54,
  },
});
