import { PlanType, JobTier } from '@prisma/client';

export interface PlanConfig {
  cost: number;
  cvQuota: number;
  maxBasicPosts: number;
  maxVipPosts: number;
  maxUrgentPosts: number;
  canViewAIReport: boolean;
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  [PlanType.LITE]: {
    cost: 500,
    cvQuota: 10,
    maxBasicPosts: 3,
    maxVipPosts: 2,
    maxUrgentPosts: 0,
    canViewAIReport: true,
  },
  [PlanType.GROWTH]: {
    cost: 2000,
    cvQuota: 50,
    maxBasicPosts: 15,
    maxVipPosts: 10,
    maxUrgentPosts: 3,
    canViewAIReport: true,
  },
};

export const CV_PACKAGES: Record<
  string,
  { cost: number; quota: number; label: string }
> = {
  XEM_NHANH: { cost: 150, quota: 6, label: '"Quick View" (6 Unlocks)' },
  SAN_TAI: { cost: 400, quota: 20, label: '"Talent Hunter" (20 Unlocks)' },
};

export const SLOT_PRICING: Partial<
  Record<
    JobTier,
    {
      single: number;
      bundle: number;
      slots: { single: number; bundle: number };
    }
  >
> = {
  [JobTier.PROFESSIONAL]: {
    single: 160,
    bundle: 650,
    slots: { single: 1, bundle: 5 },
  },
  [JobTier.URGENT]: {
    single: 320,
    bundle: 1300,
    slots: { single: 1, bundle: 5 },
  },
};
