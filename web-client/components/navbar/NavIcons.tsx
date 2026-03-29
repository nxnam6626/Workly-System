'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { SavedJobsDropdown } from './SavedJobsDropdown';
import { NotificationsDropdown } from './NotificationsDropdown';

export function NavIcons() {
  return (
    <div className="flex items-center gap-3">
      {/* Favorites Icon */}
      <SavedJobsDropdown />

      {/* Notifications Icon */}
      <NotificationsDropdown />
    </div>
  );
}
