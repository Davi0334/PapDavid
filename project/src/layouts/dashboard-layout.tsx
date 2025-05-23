import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <Sidebar className="hidden lg:flex" />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t" />
    </div>
  );
}