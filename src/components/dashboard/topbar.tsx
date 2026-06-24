'use client';

import { signOut } from '@/actions/auth.actions';
import { LogOut, ExternalLink } from 'lucide-react';
import type { Profile } from '@/types';
import Link from 'next/link';

export function DashboardTopbar({
  profile,
}: {
  profile: Profile;
}) {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 11) return 'Good morning';
    if (h < 15) return 'Good afternoon';
    if (h < 19) return 'Good evening';
    return 'Good evening';
  })();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">
          {greeting},{' '}
          <span className="text-gray-900 font-bold">{profile.full_name ?? 'User'}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-200"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Site
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-red-500 hover:text-red-600 transition-colors duration-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </form>
      </div>
    </header>
  );
}
