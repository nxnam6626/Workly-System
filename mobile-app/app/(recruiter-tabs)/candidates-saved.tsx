import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface SavedCandidate {
  candidateId: string;
  fullName: string;
  avatar: string | null;
  university: string | null;
  major: string | null;
  gpa: number | null;
  isOpenToWork: boolean;
  skills: { skillName: string }[];
  savedAt: string;
  jobTitle?: string;
}

export default function CandidatesSavedScreen() {
  const router = useRouter();
  const [saved, setSaved] = useState<SavedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSaved = useCallback(async () => {
    try {
      const { data } = await api.get('/recruiters/saved-candidates');
      setSaved(data || []);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải danh sách ứng viên đã lưu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);
  const onRefresh = async () => { setRefreshing(true); await fetchSaved(); setRefreshing(false); };

  const handleRemove = (candidateId: string, name: string) => {
    Alert.alert('Xóa khỏi danh sách', `Bỏ lưu ứng viên ${name}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/recruiters/saved-candidates/${candidateId}`);
            setSaved(prev => prev.filter(c => c.candidateId !== candidateId));
          } catch {
            Alert.alert('Lỗi', 'Không thể xóa ứng viên');
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ứng Viên Đã Lưu</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{saved.length}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: 40, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {saved.length === 0 ? (
          <EmptyState
            emoji="🔖"
            title="Chưa lưu ứng viên nào"
            description="Khi duyệt danh sách ứng viên, nhấn nút bookmark để lưu lại những ứng viên tiềm năng"
          />
        ) : (
          saved.map(candidate => (
            <View key={candidate.candidateId} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  {candidate.avatar ? (
                    <Image source={{ uri: candidate.avatar }} style={{ width: 52, height: 52 }} contentFit="cover" />
                  ) : (
                    <Text style={styles.avatarText}>{candidate.fullName.charAt(0)}</Text>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{candidate.fullName}</Text>
                    {candidate.isOpenToWork && (
                      <View style={styles.openBadge}>
                        <Text style={styles.openText}>Tìm việc</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.meta} numberOfLines={1}>
                    {[candidate.university, candidate.major].filter(Boolean).join(' · ')}
                  </Text>
                  {candidate.gpa && (
                    <Text style={styles.gpa}>GPA: {candidate.gpa.toFixed(1)}</Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => handleRemove(candidate.candidateId, candidate.fullName)}
                  style={styles.removeBtn}
                  hitSlop={8}
                >
                  <Ionicons name="bookmark" size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              {candidate.skills.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.skillsRow}>
                  {candidate.skills.slice(0, 5).map(s => (
                    <View key={s.skillName} style={styles.skillChip}>
                      <Text style={styles.skillText}>{s.skillName}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}

              <View style={styles.footer}>
                <Text style={styles.savedAt}>
                  Lưu: {new Date(candidate.savedAt).toLocaleDateString('vi-VN')}
                </Text>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => router.push({ pathname: '/(recruiter-tabs)/candidates', params: { candidateId: candidate.candidateId } })}
                >
                  <Text style={styles.viewBtnText}>Xem hồ sơ</Text>
                  <Ionicons name="arrow-forward" size={12} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  countBadge: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3 },
  countText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
  avatar: { width: 52, height: 52, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  openBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  openText: { fontSize: 10, color: '#15803d', fontWeight: '700' },
  meta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  gpa: { fontSize: 11, color: COLORS.success, fontWeight: '700', marginTop: 2 },
  removeBtn: { padding: 4 },
  skillsRow: { marginBottom: SPACING.sm },
  skillChip: { backgroundColor: '#eff6ff', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, borderWidth: 1, borderColor: '#bfdbfe' },
  skillText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  savedAt: { fontSize: 11, color: COLORS.textMuted },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
});
