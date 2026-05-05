import Constants from 'expo-constants';

/**
 * App Configuration Utilities
 * Detects the current app variant (Candidate vs Recruiter) from Expo constants.
 */

export const APP_VARIANT = Constants.expoConfig?.extra?.variant || 'candidate';
export const IS_RECRUITER_APP = APP_VARIANT === 'recruiter';
export const IS_CANDIDATE_APP = APP_VARIANT === 'candidate';

export const APP_NAME = IS_RECRUITER_APP ? 'Workly Recruit' : 'Workly';
