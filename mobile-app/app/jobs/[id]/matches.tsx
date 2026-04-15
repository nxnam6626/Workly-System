import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../../lib/api';
import { StatusBadge } from '../../../components/StatusBadge';
import { EmptyState } from '../../../components/EmptyState';
import { COLORS, SPACING, RADIUS } from '../../../lib/constants';

interface Match {
  candidateId: string;
  fullName: string;
  avatar: string | null;
  email: string;
  university: string | null;
  major: string | null;
  gpa: number | null;
  skills: { skillName: string }[];
  score: number;
  scoreLabel: string;
  cvUrl: string | null;
  applicationStatus?: string;
}

export default function JobMatchesScreen() {
  const router = useRouter();
  const { id: jobId } = useLocalSearchParams<{ id: string }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = useCallback(async () => {
    try {
      const [matchRes, jobRes] = await Promise.all([
        api.get(`/job-postings/${jobId}/suggested-candidates`),
        api.get(`/job-postings/${jobId}`),
      ]);
      setMatches(matchRes.data || []);
      setJobTitle(jobRes.data?.title || 'Tin tuyển dụng');
    } catch {
      Alert.alert('Lỗi', 'Không thể tải danh sách ứng viên phù hợp');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const onRefresh = async () => { setRefreshing(true); await fetchMatches(); setRefreshing(false); };

  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.accent;
    return COLORS.textMuted;
  };

  const handleInvite = (match: Match) => {
    Alert.alert('Mời ứng tuyển', `Gửi lời mời tới ${match.fullName}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Gửi lời mời',
        onPress: async () => {
          try {
            await api.post(`/job-postings/${jobId}/invite`, { candidateId: match.candidateId });
            Alert.alert('✅ Thành công', `Đã gửi lời mời tới ${match.fullName}`);
          } catch {
            Alert.alert('Lỗi', 'Không thể gửi lời mời');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>AI Matching</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{jobTitle}</Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={12} color="#a78bfa" />
          <Text style={styles.badgeText}>{matches.length} phù hợp</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={{ color: COLORS.textMuted, marginTop: SPACING.sm }}>AI đang phân tích...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 40, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {matches.length === 0 ? (
            <EmptyState emoji="🤖" title="Chưa có ứng viên phù hợp" description="AI chưa tìm thấy ứng viên phù hợp với yêu cầu của tin này. Hãy thử lại sau." />
          ) : (
            matches.map((match, idx) => (
              <View key={match.candidateId} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{idx + 1}</Text>
                  </View>

                  <View style={styles.avatar}>
                    {match.avatar ? (
                      <Image source={{ uri: match.avatar }} style={{ width: 48, height: 48 }} contentFit="cover" />
                    ) : (
                      <Text style={styles.avatarText}>{match.fullName.charAt(0)}</Text>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{match.fullName}</Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {[match.university, match.major].filter(Boolean).join(' · ')}
                    </Text>
                    {match.gpa && (
                      <Text style={styles.gpa}>GPA: {match.gpa.toFixed(1)}</Text>
                    )}
                  </View>

                  {/* Score Circle */}
                  <View style={[styles.scoreCircle, { borderColor: getScoreColor(match.score) }]}>
                    <Text style={[styles.scoreNum, { color: getScoreColor(match.score) }]}>
                      {match.score}
                    </Text>
                    <Text style={styles.scorePct}>%</Text>
                  </View>
                </View>

                {/* Skills */}
                {match.skills.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.skillsRow}>
                    {match.skills.slice(0, 6).map(s => (
                      <View key={s.skillName} style={styles.skillChip}>
                        <Text style={styles.skillText}>{s.skillName}</Text>
                      </View>
                    ))}
                  </ScrollView>
                )}

                {/* Label */}
                <View style={styles.scoreLabelRow}>
                  <Ionicons name="sparkles" size={12} color="#a78bfa" />
                  <Text style={styles.scoreLabel}>{match.scoreLabel}</Text>
                  {match.applicationStatus && <StatusBadge status={match.applicationStatus} />}
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.inviteBtn}
                    onPress={() => handleInvite(match)}
                  >
                    <Ionicons name="mail" size={14} color="#fff" />
                    <Text style={styles.inviteBtnText}>Mời ứng tuyển</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.profileBtn}
                    onPress={() => router.push({ pathname: '/(recruiter-tabs)/candidates', params: { candidateId: match.candidateId } })}
                  >
                    <Ionicons name="person" size={14} color={COLORS.primary} />
                    <Text style={styles.profileBtnText}>Xem hồ sơ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: RADIUS.full,
    backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  headerSub: { fontSize: 11, color: COLORS.textMuted },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f5f3ff', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: '#e9d5ff',
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#7c3aed' },
  card: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  rankBadge: {
    width: 24, height: 24, backgroundColor: COLORS.bg, borderRadius: RADIUS.full,
    justifyContent: 'center', alignItems: 'center',
  },
  rankText: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted },
  avatar: {
    width: 48, height: 48, borderRadius: RADIUS.full, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  gpa: { fontSize: 11, color: COLORS.success, fontWeight: '700', marginTop: 1 },
  scoreCircle: {
    width: 52, height: 52, borderRadius: RADIUS.full,
    borderWidth: 2.5, justifyContent: 'center', alignItems: 'center',
  },
  scoreNum: { fontSize: 16, fontWeight: '900', lineHeight: 18 },
  scorePct: { fontSize: 9, color: COLORS.textMuted, fontWeight: '700' },
  skillsRow: { marginBottom: SPACING.sm },
  skillChip: {
    backgroundColor: '#eff6ff', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4,
    marginRight: 6, borderWidth: 1, borderColor: '#bfdbfe',
  },
  skillText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  scoreLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  scoreLabel: { flex: 1, fontSize: 12, color: '#7c3aed', fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: SPACING.sm },
  inviteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 10,
  },
  inviteBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  profileBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#eff6ff', borderRadius: RADIUS.md, paddingVertical: 10,
    borderWidth: 1, borderColor: '#bfdbfe',
  },
  profileBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
});
