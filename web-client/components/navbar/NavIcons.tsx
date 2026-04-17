'use client';

import { useAuthStore } from '@/stores/auth';
import { SavedJobsDropdown } from './SavedJobsDropdown';
import { NotificationsDropdown } from './NotificationsDropdown';

export function NavIcons() {
  const { user, isAuthenticated } = useAuthStore();
  const isCandidate = !isAuthenticated || user?.roles?.includes('CANDIDATE');

  if (!isCandidate) return null;

  return (
    <div className="flex items-center gap-3">
      {/* Favorites Icon */}
      <SavedJobsDropdown />

      {/* Notifications Icon */}
      <NotificationsDropdown />
    </div>
  );
}
