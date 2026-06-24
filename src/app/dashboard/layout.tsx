import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/helpers';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardTopbar } from '@/components/dashboard/topbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile || !profile.is_active) {
    redirect('/auth/login');
  }

  return (
    <div className="theme-dark flex h-screen overflow-hidden bg-[#0a0a0a]">
      <DashboardSidebar profile={profile} />
      <div className="flex flex-1 flex-col overflow-hidden bg-white text-gray-900">
        <DashboardTopbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
