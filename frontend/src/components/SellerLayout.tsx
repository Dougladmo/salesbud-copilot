import { Outlet, useLocation } from 'react-router-dom';
import { useOrganization } from '@clerk/clerk-react';
import { useSeller } from '../context/SellerContext';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import AppSidebar from './app-sidebar';

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
        <main className={isChatPage ? 'h-screen' : 'p-8 max-w-4xl'}>
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
