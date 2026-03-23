import { Outlet, useLocation } from 'react-router-dom';
import { useOrganization } from '@clerk/clerk-react';
import { Menu } from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import AppSidebar from './app-sidebar';

function MobileHeader() {
  const { toggleSidebar, isMobile } = useSidebar();
  if (!isMobile) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
      <Button variant="ghost" size="icon" className="size-8" onClick={toggleSidebar}>
        <Menu className="size-5" />
      </Button>
      <span className="text-base font-bold text-foreground tracking-tight">
        Sales<span className="text-pink">bud</span>
      </span>
    </div>
  );
}

export default function SellerLayout() {
  const { seller, loading } = useSeller();
  const location = useLocation();
  const { membership } = useOrganization();
  const isAdmin = membership?.role === 'org:admin';
  const isChatPage = location.pathname.startsWith('/seller/chat');

  if (loading || !seller) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar
        variant="seller"
        sellerName={seller.name}
        companyName={seller.company?.name}
        isAdmin={isAdmin}
      />
      <SidebarInset>
        {!isChatPage && <MobileHeader />}
        <main className={isChatPage ? 'h-dvh' : 'p-4 md:p-8 w-full max-w-5xl mx-auto'}>
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
