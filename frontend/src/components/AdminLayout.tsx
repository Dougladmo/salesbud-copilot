import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { UserButton, useOrganization, useUser } from '@clerk/clerk-react';
import { useSeller } from '../context/SellerContext';

const navItems = [
  { to: '/admin/sellers', label: 'Vendedores', icon: '👤' },
  { to: '/admin/documents', label: 'Documentos', icon: '📄' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { seller } = useSeller();
  const { membership, isLoaded } = useOrganization();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Carregando...</p>
      </div>
    );
  }

  if (membership?.role !== 'org:admin') {
    return <Navigate to="/seller/copilot" replace />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-60 bg-navy-dark fixed top-0 left-0 bottom-0 flex flex-col p-6">
        <h1 className="text-xl font-bold text-white mb-1 px-2 tracking-tight">
          Sales<span className="text-accent">bud</span>
        </h1>
        <p className="text-[10px] text-white/30 px-2 mb-1 uppercase tracking-widest">Admin</p>
        <p className="text-xs text-white/50 px-2 mb-6 truncate" title={seller?.company?.name}>
          {seller?.company?.name}
        </p>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10 space-y-3">
          <button
            onClick={() => navigate('/seller/copilot')}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-full text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition cursor-pointer bg-transparent border-none"
          >
            <span>↩️</span>
            Voltar ao Copilot
          </button>
          <div className="flex items-center gap-3 px-4">
            <UserButton
              afterSignOutUrl="/sign-in"
              userProfileProps={{
                additionalOAuthScopes: {
                  google: [
                    'https://www.googleapis.com/auth/calendar.events',
                    'https://www.googleapis.com/auth/calendar.freebusy',
                  ],
                },
              }}
            />
            <span className="text-xs text-white/40 truncate">{user?.firstName ?? 'Conta'}</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 ml-60 p-8 max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
}
