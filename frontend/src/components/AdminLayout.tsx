import { Navigate, Outlet } from 'react-router-dom';
import { useOrganization } from '@clerk/clerk-react';
import { useSeller } from '../context/SellerContext';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import AppSidebar from './app-sidebar';

export default function AdminLayout() {
  const { seller } = useSeller();
  const { membership, isLoaded } = useOrganization();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  if (membership?.role !== 'org:admin') {
    return <Navigate to="/seller/copilot" replace />;
  }

  return (
    <SidebarProvider>
      <AppSidebar
        variant="admin"
        companyName={seller?.company?.name}
      />
      <SidebarInset>
        <main className="p-8 max-w-5xl">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
