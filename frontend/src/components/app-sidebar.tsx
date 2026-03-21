import { useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Bot, MessageSquare, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const sellerNavItems: NavItem[] = [
  { to: '/seller/copilot', label: 'Copilot', icon: <Bot className="size-4" /> },
  { to: '/seller/chat', label: 'Conversas', icon: <MessageSquare className="size-4" /> },
];

const adminNavItems: NavItem[] = [
  { to: '/admin/documents', label: 'Documentos', icon: <FileText className="size-4" /> },
];

const clerkOAuthScopes = {
  google: [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.freebusy',
  ],
};

interface AppSidebarProps {
  variant: 'seller' | 'admin';
  sellerName?: string;
  companyName?: string;
  isAdmin?: boolean;
}

export default function AppSidebar({ variant, sellerName, companyName, isAdmin }: AppSidebarProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  const navItems = variant === 'seller' ? sellerNavItems : adminNavItems;
  const userButtonRef = useRef<HTMLDivElement>(null);

  const handleProfileClick = () => {
    const btn = userButtonRef.current?.querySelector('button');
    btn?.click();
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight group-data-[collapsible=icon]:hidden">
          Sales<span className="text-pink">bud</span>
        </h1>
        {variant === 'admin' && (
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-[10px] text-sidebar-foreground/30 uppercase tracking-widest">Admin</p>
            <p className="text-xs text-sidebar-foreground/50 truncate" title={companyName}>
              {companyName}
            </p>
          </div>
        )}

        {/* Profile card with embedded UserButton */}
        <div
          onClick={handleProfileClick}
          className="mt-2 bg-sidebar-accent rounded-xl p-3 cursor-pointer hover:bg-sidebar-accent/80 transition-colors group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:rounded-lg"
        >
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            {/* Hidden UserButton for Clerk popup */}
            <div ref={userButtonRef} className="absolute -left-[9999px]">
              <UserButton
                afterSignOutUrl="/sign-in"
                userProfileProps={{ additionalOAuthScopes: clerkOAuthScopes }}
              />
            </div>
            <Avatar className="size-8 shrink-0">
              <AvatarImage src={user?.imageUrl} alt={sellerName ?? user?.firstName ?? ''} />
              <AvatarFallback className="bg-pink text-white text-xs font-bold">
                {(sellerName ?? user?.firstName ?? 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {variant === 'seller' ? sellerName : (user?.firstName ?? 'Conta')}
              </p>
              <p className="text-[11px] text-sidebar-foreground/50 truncate">{companyName}</p>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu>
          {navItems.map(({ to, label, icon }) => (
            <SidebarMenuItem key={to}>
              <NavLink to={to}>
                {({ isActive }) => (
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={label}
                    className={cn(
                      'rounded-lg transition-all duration-150',
                      isActive && 'bg-pink text-white hover:bg-pink-hover hover:text-white'
                    )}
                  >
                    {icon}
                    <span>{label}</span>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {variant === 'seller' && isAdmin && (
        <SidebarFooter className="px-2 pb-4">
          <SidebarSeparator className="mb-2 bg-sidebar-border" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Painel Admin"
                onClick={() => navigate('/admin')}
                className="text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent rounded-lg"
              >
                <Settings className="size-4" />
                <span>Painel Admin</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
