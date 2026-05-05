import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, formatSalary } from '../lib/constants';

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

interface JobCardProps {
  item: Job;
  onPress: () => void;
}

export const JobCard: React.FC<JobCardProps> = React.memo(({ item, onPress }) => {
  const isUrgent = item.jobTier === 'URGENT';
  const isPro = item.jobTier === 'PROFESSIONAL';

  return (
    <TouchableOpacity
      style={[styles.card, isUrgent && styles.cardUrgent, isPro && styles.cardPro]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardInner}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          {item.company?.logoUrl ? (
            <Image
              source={{ uri: item.company.logoUrl }}
              style={styles.logo}
              contentFit="contain"
            />
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
          <Text style={styles.jobTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.company} numberOfLines={1}>
            {item.company?.companyName}
          </Text>
          
          <View style={styles.metaRow}>
             {item.locationCity && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{item.locationCity}</Text>
                </View>
             )}
             <View style={styles.metaItem}>
                <Ionicons name="cash-outline" size={12} color={COLORS.success} />
                <Text style={[styles.metaText, { color: COLORS.success, fontWeight: '700' }]}>
                  {formatSalary(item.salaryMin, item.salaryMax, item.currency || undefined)}
                </Text>
             </View>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badges}>
          {isUrgent && (
            <View style={styles.badgeUrgent}>
              <Text style={styles.badgeText}>Gấp</Text>
            </View>
          )}
          {isPro && (
            <View style={styles.badgePro}>
              <Text style={styles.badgeText}>Hot</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    // Subtle shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardUrgent: {
    borderColor: 'rgba(239,68,68,0.2)',
    backgroundColor: '#FFF5F5',
  },
  cardPro: {
    borderColor: 'rgba(245,158,11,0.2)',
    backgroundColor: '#FFFBEB',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrap: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
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
    fontSize: 18,
  },
  info: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  company: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  badges: {
    position: 'absolute',
    top: -8,
    right: -8,
    flexDirection: 'row',
    gap: 4,
  },
  badgeUrgent: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePro: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
