import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS, formatSalary } from '../../lib/constants';

interface Job {
  jobPostingId: string;
  title: string;
  locationCity: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  company: { companyName: string; logo: string | null };
  slug?: string;
}

const SavedItem = React.memo(({ item, onPress, onRemove }: { item: Job; onPress: () => void; onRemove: () => void }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.logoWrap}>
      {item.company?.logo ? (
        <Image source={{ uri: item.company.logo || undefined }} style={{ width: 44, height: 44 }} contentFit="contain" />
      ) : (
        <Text style={styles.logoText}>{item.company?.companyName?.slice(0, 2).toUpperCase()}</Text>
      )}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.company} numberOfLines={1}>{item.company?.companyName}</Text>
      <Text style={styles.salary}>{formatSalary(item.salaryMin, item.salaryMax, item.currency ?? undefined)}</Text>
    </View>
    <TouchableOpacity onPress={onRemove} style={styles.removeBtn} hitSlop={8}>
      <Ionicons name="bookmark" size={20} color={COLORS.primary} />
    </TouchableOpacity>
  </TouchableOpacity>
));

export default function SavedScreen() {
  const router = useRouter();
  const [saved, setSaved] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/favorites/my');
      setSaved(data.items || data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const removeSaved = async (id: string) => {
    try {
      await api.delete(`/favorites/${id}`);
      setSaved((prev) => prev.filter((j) => j.jobPostingId !== id));
    } catch {}
  };

  const renderItem = useCallback(
    ({ item }: { item: Job }) => (
      <SavedItem
        item={item}
        onPress={() => router.push(`/jobs/${item.slug || item.jobPostingId}`)}
        onRemove={() => removeSaved(item.jobPostingId)}
      />
    ),
    [router]
  );

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: COLORS.bgDark }} color={COLORS.primary} size="large" />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>Việc đã lưu</Text>
      {saved.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={56} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Chưa có việc làm nào được lưu</Text>
          <Text style={styles.emptyHint}>Bấm ❤️ để lưu các tin bạn quan tâm</Text>
        </View>
      ) : (
        <FlatList
          data={saved}
          renderItem={renderItem}
          keyExtractor={(item) => item.jobPostingId}
          contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: { fontSize: 22, fontWeight: '800', color: '#fff', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.cardDark, borderRadius: RADIUS.lg,
    padding: SPACING.sm, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  logoWrap: { width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  title: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  company: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
  salary: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
  removeBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyHint: { color: COLORS.textMuted, fontSize: 13 },
});
