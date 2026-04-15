import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, TextInput, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS, formatSalary, JOB_TYPE_LABEL } from '../../lib/constants';
import { useAuthStore } from '../../stores/auth';

interface Job {
  jobPostingId: string;
  title: string;
  locationCity: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  jobTier: 'BASIC' | 'PROFESSIONAL' | 'URGENT';
  company: { companyName: string; logoUrl: string | null };
  slug?: string;
}

const ITEM_HEIGHT = 110;

const JobItem = React.memo(({ item, onPress }: { item: Job; onPress: () => void }) => {
  const isUrgent = item.jobTier === 'URGENT';
  const isPro = item.jobTier === 'PROFESSIONAL';

  return (
    <TouchableOpacity
      style={[styles.card, isUrgent && styles.cardUrgent, isPro && styles.cardPro]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Tier badge */}
      {isUrgent && (
        <View style={styles.badgeUrgent}>
          <Text style={styles.badgeText}>Tuyển Gấp</Text>
        </View>
      )}
      {isPro && (
        <View style={styles.badgePro}>
          <Text style={styles.badgeText}>Nổi Bật</Text>
        </View>
      )}

      <View style={styles.cardInner}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          {item.company?.logoUrl ? (
            <Image source={{ uri: item.company.logoUrl || undefined }} style={styles.logo} contentFit="contain" />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>
                {item.company?.companyName?.slice(0, 2).toUpperCase() || 'TC'}
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.company} numberOfLines={1}>{item.company?.companyName}</Text>
          <View style={styles.tags}>
            {item.locationCity && (
              <View style={styles.tag}>
                <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
                <Text style={styles.tagText}>{item.locationCity}</Text>
              </View>
            )}
            <View style={[styles.tag, styles.salaryTag]}>
              <Ionicons name="cash-outline" size={11} color={COLORS.success} />
              <Text style={[styles.tagText, { color: COLORS.success }]}>
                {formatSalary(item.salaryMin, item.salaryMax, item.currency || undefined)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

import React from 'react';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingMore = useRef(false);

  const fetchJobs = useCallback(async (pageNum = 1, refresh = false) => {
    if (loadingMore.current && !refresh) return;
    loadingMore.current = true;
    try {
      const { data } = await api.get('/job-postings', {
        params: { page: pageNum, limit: 10 },
      });
      const items: Job[] = data.items || [];
      if (refresh || pageNum === 1) {
        setJobs(items);
      } else {
        setJobs((prev) => [...prev, ...items]);
      }
      setHasMore(items.length === 10);
      setPage(pageNum);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
      loadingMore.current = false;
    }
  }, []);

  useEffect(() => { fetchJobs(1, true); }, [fetchJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs(1, true);
  };

  const onEndReached = () => {
    if (hasMore && !loadingMore.current) fetchJobs(page + 1);
  };

  const renderItem = useCallback(
    ({ item }: { item: Job }) => (
      <JobItem
        item={item}
        onPress={() => router.push(`/jobs/${item.slug || item.jobPostingId}`)}
      />
    ),
    [router]
  );

  const keyExtractor = useCallback((item: Job) => item.jobPostingId, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({ length: ITEM_HEIGHT + 12, offset: (ITEM_HEIGHT + 12) * index, index }),
    []
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào, {user?.name?.split(' ').pop() || 'bạn'} 👋</Text>
          <Text style={styles.subtitle}>Tìm công việc phù hợp với bạn</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/notifications')} style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search shortcut */}
      <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/jobs')} activeOpacity={0.8}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <Text style={styles.searchPlaceholder}>Tìm kiếm việc làm...</Text>
      </TouchableOpacity>

      {/* Job Feed */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={COLORS.primary} size="large" />
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListFooterComponent={hasMore ? <ActivityIndicator color={COLORS.primary} style={{ paddingVertical: 20 }} /> : null}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.md,
  },
  greeting: { fontSize: 20, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  bellBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginHorizontal: SPACING.md, marginBottom: SPACING.md,
    backgroundColor: COLORS.cardDark, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, height: 48,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  searchPlaceholder: { color: COLORS.textMuted, fontSize: 14 },
  list: { paddingHorizontal: SPACING.md, paddingBottom: 20 },
  card: {
    backgroundColor: COLORS.cardDark, borderRadius: RADIUS.lg, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  cardUrgent: { borderColor: 'rgba(239,68,68,0.4)', borderWidth: 1.5 },
  cardPro: { borderColor: 'rgba(245,158,11,0.4)', borderWidth: 1.5 },
  badgeUrgent: {
    backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 3,
    alignSelf: 'flex-start', borderBottomRightRadius: RADIUS.md,
  },
  badgePro: {
    backgroundColor: '#f59e0b', paddingHorizontal: 10, paddingVertical: 3,
    alignSelf: 'flex-start', borderBottomRightRadius: RADIUS.md,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardInner: { flexDirection: 'row', padding: SPACING.sm, alignItems: 'center', gap: SPACING.sm },
  logoWrap: { width: 52, height: 52, borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)' },
  logo: { width: 52, height: 52 },
  logoPlaceholder: { width: 52, height: 52, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  info: { flex: 1 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 3 },
  company: { fontSize: 13, color: COLORS.textMuted, marginBottom: 6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  salaryTag: { backgroundColor: 'rgba(34,197,94,0.1)' },
  tagText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
});
