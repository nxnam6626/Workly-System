import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';
import { useAuthStore } from '../../stores/auth';
import { JobCard } from '../../components/JobCard';

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
    } catch {
      // Silent error handling for feed
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingMore.current = false;
    }
  }, []);

  useEffect(() => {
    fetchJobs(1, true);
  }, [fetchJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs(1, true);
  };

  const onEndReached = () => {
    if (hasMore && !loadingMore.current) fetchJobs(page + 1);
  };

  const renderItem = useCallback(
    ({ item }: { item: Job }) => (
      <JobCard
        item={item}
        onPress={() => router.push(`/jobs/${item.slug || item.jobPostingId}`)}
      />
    ),
    [router]
  );

  const keyExtractor = useCallback((item: Job) => item.jobPostingId, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT + 12,
      offset: (ITEM_HEIGHT + 12) * index,
      index,
    }),
    []
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Xin chào, <Text style={styles.userName}>{user?.name?.split(' ').pop() || 'bạn'}</Text> 👋
          </Text>
          <Text style={styles.subtitle}>Tìm công việc mơ ước của bạn</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/notifications')}
          style={styles.bellBtn}
        >
          <View style={styles.bellIconWrap}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            <View style={styles.dot} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar - Workly Style */}
      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/jobs')}
          activeOpacity={0.9}
        >
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <Text style={styles.searchPlaceholder}>Tìm kiếm việc làm, công ty...</Text>
        </TouchableOpacity>
      </View>

      {/* Job Feed */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Việc làm mới nhất</Text>
              <TouchableOpacity>
                <Text style={styles.viewAll}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            hasMore ? (
              <ActivityIndicator
                color={COLORS.primary}
                style={{ paddingVertical: 20 }}
              />
            ) : (
              <View style={styles.endList}>
                <Text style={styles.endListText}>Bạn đã xem hết việc làm mới nhất ✨</Text>
              </View>
            )
          }
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  greeting: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  bellBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIconWrap: {
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    borderWidth: 1.5,
    borderColor: COLORS.bg,
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#fff',
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }
    })
  },
  searchPlaceholder: {
    color: COLORS.textMuted,
    fontSize: 15,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  viewAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  endList: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  endListText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});
