import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS, formatSalary, INDUSTRIES, LOCATIONS } from '../../lib/constants';

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

// Chips for quick filters
const FilterChip = React.memo(({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
));

const JobRow = React.memo(({ item, onPress }: { item: Job; onPress: () => void }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.rowLogo}>
      {item.company?.logoUrl ? (
            <Image source={{ uri: item.company?.logoUrl || undefined }} style={{ width: 44, height: 44 }} contentFit="contain" />
      ) : (
        <Text style={styles.rowLogoText}>{item.company?.companyName?.slice(0, 2).toUpperCase()}</Text>
      )}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.rowCompany} numberOfLines={1}>{item.company?.companyName}</Text>
      <Text style={styles.rowSalary}>{formatSalary(item.salaryMin, item.salaryMax, item.currency || undefined)}</Text>
    </View>
    {item.jobTier === 'URGENT' && <View style={styles.urgentDot} />}
    {item.jobTier === 'PROFESSIONAL' && <View style={styles.proDot} />}
  </TouchableOpacity>
));

export default function JobsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<any>(null);

  const fetchJobs = useCallback(async (q: string, ind: string, loc: string) => {
    setLoading(true);
    try {
      const params: any = { limit: 20 };
      if (q) params.search = q;
      if (ind) params.industry = ind;
      if (loc) params.location = loc;
      const { data } = await api.get('/job-postings', { params });
      setJobs(data.items || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchJobs(text, industry, location), 500);
  };

  const toggleIndustry = (ind: string) => {
    const next = industry === ind ? '' : ind;
    setIndustry(next);
    fetchJobs(search, next, location);
  };

  const toggleLocation = (loc: string) => {
    const next = location === loc ? '' : loc;
    setLocation(next);
    fetchJobs(search, industry, next);
  };

  const renderItem = useCallback(
    ({ item }: { item: Job }) => (
      <JobRow item={item} onPress={() => router.push(`/jobs/${item.slug || item.jobPostingId}`)} />
    ),
    [router]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm tên công việc, kỹ năng..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); fetchJobs('', industry, location); }}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Active filters pills */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: SPACING.md, marginBottom: 8 }}>
        {industry && (
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>{industry}</Text>
            <TouchableOpacity onPress={() => toggleIndustry(industry)}><Ionicons name="close" size={12} color={COLORS.primary} /></TouchableOpacity>
          </View>
        )}
        {location && (
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>{location}</Text>
            <TouchableOpacity onPress={() => toggleLocation(location)}><Ionicons name="close" size={12} color={COLORS.primary} /></TouchableOpacity>
          </View>
        )}
      </View>

      {/* Horizontal filter chips - Industries */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={{ paddingHorizontal: SPACING.md, gap: 8 }}>
        {INDUSTRIES.map((ind) => (
          <FilterChip key={ind} label={ind} active={industry === ind} onPress={() => toggleIndustry(ind)} />
        ))}
      </ScrollView>

      {/* Location chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.chipsScroll, { marginTop: 6 }]} contentContainerStyle={{ paddingHorizontal: SPACING.md, gap: 8 }}>
        {LOCATIONS.map((loc) => (
          <FilterChip key={loc} label={loc} active={location === loc} onPress={() => toggleLocation(loc)} />
        ))}
      </ScrollView>

      {/* Results */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={COLORS.primary} size="large" />
      ) : jobs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Không tìm thấy việc làm</Text>
          <Text style={styles.emptyHint}>Thử thay đổi từ khóa hoặc bộ lọc</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderItem}
          keyExtractor={(item) => item.jobPostingId}
          contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
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
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    margin: SPACING.md, backgroundColor: COLORS.cardDark,
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, height: 48,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  chipsScroll: { flexGrow: 0, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(30,90,255,0.15)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(30,90,255,0.3)',
  },
  activePillText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.cardDark, borderRadius: RADIUS.lg,
    padding: SPACING.sm, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  rowLogo: {
    width: 44, height: 44, borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  rowLogoText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  rowCompany: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
  rowSalary: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
  urgentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.urgent },
  proDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.professional },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyHint: { color: COLORS.textMuted, fontSize: 13 },
});
