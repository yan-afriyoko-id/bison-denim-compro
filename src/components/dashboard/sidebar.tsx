'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  FolderKanban,
  Newspaper,
  Image as ImageIcon,
  MessageSquare,
  Users,
  Settings,
  ScrollText,
  ChevronLeft,
  Presentation,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/hero', label: 'Hero Slider', icon: Presentation },
  { href: '/dashboard/pages', label: 'Pages', icon: FileText },
  { href: '/dashboard/services', label: 'Services', icon: Briefcase },
  { href: '/dashboard/posts', label: 'Posts', icon: Newspaper },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { href: '/dashboard/media', label: 'Media', icon: ImageIcon },
  { href: '/dashboard/leads', label: 'Leads', icon: MessageSquare },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/audit-logs', label: 'Audit Logs', icon: ScrollText },
];

export function DashboardSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-[#2a2a2a] bg-[#111111] transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-[#2a2a2a] px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="relative h-7 w-7 overflow-hidden">
              <Image
                src="/icon.png"
                alt="Bison Denim"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-sm font-bold text-[#f5f5f5] tracking-tight uppercase">
              Bison Denim
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
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

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
