'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { DashboardModuleKey, Profile } from '@/types';
import {
  LayoutDashboard,
  FileText,
  Newspaper,
  Image as ImageIcon,
  Users,
  Settings,
  ScrollText,
  ChevronLeft,
  Presentation,
} from 'lucide-react';
import { useState } from 'react';
import { hasDashboardModuleAccess } from '@/lib/permissions';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, moduleKey: 'overview' as DashboardModuleKey },
  { href: '/dashboard/hero', label: 'Hero Slider', icon: Presentation, moduleKey: 'hero' as DashboardModuleKey },
  { href: '/dashboard/pages', label: 'Pages', icon: FileText, moduleKey: 'pages' as DashboardModuleKey },
  { href: '/dashboard/posts', label: 'Posts', icon: Newspaper, moduleKey: 'posts' as DashboardModuleKey },
  { href: '/dashboard/media', label: 'Media', icon: ImageIcon, moduleKey: 'media' as DashboardModuleKey },
  { href: '/dashboard/users', label: 'Users', icon: Users, moduleKey: 'users' as DashboardModuleKey },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, moduleKey: 'settings' as DashboardModuleKey },
  { href: '/dashboard/audit-logs', label: 'Audit Logs', icon: ScrollText, moduleKey: 'audit_logs' as DashboardModuleKey },
];

export function DashboardSidebar({
  profile,
  siteName = 'Bison Denim',
  logoUrl = '/icon.png',
}: {
  profile: Profile;
  siteName?: string;
  logoUrl?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const visibleNavItems = navItems.filter((item) => hasDashboardModuleAccess(profile, item.moduleKey));

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-[#2a2a2a] bg-[#1E1E1E] transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-[#2a2a2a] px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="relative h-7 w-7 overflow-hidden">
              <Image
                src={logoUrl}
                alt={siteName}
                fill
                className="object-contain"
              />
            </div>
            <span className="text-sm font-bold text-[#f5f5f5] tracking-tight uppercase">
              {siteName}
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-sm p-1.5 text-[#666] hover:text-[#f5f5f5] hover:bg-[#1c1c1c] transition-colors duration-200"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform duration-200', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {visibleNavItems.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          const badgeCount = 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors duration-200',
                isActive
                  ? 'bg-[#f5f5f5] text-[#0a0a0a] font-bold'
                  : 'text-[#a3a3a3] hover:text-[#f5f5f5] hover:bg-[#1c1c1c]'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && badgeCount > 0 && (
                <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-[#2a2a2a] p-3">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1c1c1c] border border-[#2a2a2a] text-xs font-bold text-[#f5f5f5]">
              {profile.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#f5f5f5]">
                {profile.full_name ?? 'User'}
              </p>
              <p className="truncate text-[11px] text-[#666] uppercase tracking-wider">
                {profile.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
