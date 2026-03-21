import { useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { UserButton, useOrganization, useUser } from '@clerk/clerk-react';
import { useSeller } from '../context/SellerContext';

export default function SellerLayout() {
  const { seller, loading } = useSeller();
  const navigate = useNavigate();
  const location = useLocation();
  const { membership } = useOrganization();
  const { user } = useUser();
  const isAdmin = membership?.role === 'org:admin';
  const isChatPage = location.pathname.startsWith('/seller/chat');
  const userButtonRef = useRef<HTMLDivElement>(null);

  const handleHeaderClick = () => {
    const btn = userButtonRef.current?.querySelector('button');
    btn?.click();
  };

  if (loading || !seller) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-64 bg-navy-dark fixed top-0 left-0 bottom-0 flex flex-col p-6">
        <h1 className="text-xl font-bold text-white mb-2 px-2 tracking-tight">
          Sales<span className="text-accent">bud</span>
        </h1>

        <div
          onClick={handleHeaderClick}
          className="bg-white/10 rounded-xl p-3 mb-6 cursor-pointer hover:bg-white/15 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div ref={userButtonRef} className="shrink-0 absolute -left-[9999px]">
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
            </div>
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={seller.name} className="w-9 h-9 rounded-full shrink-0 object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold shrink-0">
                {seller.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{seller.name}</p>
              <p className="text-[11px] text-white/50 truncate">{seller.company?.name}</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <NavLink
            to="/seller/copilot"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-accent text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <span>🤖</span>
            Copilot
          </NavLink>
          <NavLink
            to="/seller/chat"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-accent text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <span>💬</span>
            Conversas
          </NavLink>
        </nav>

        <div className="mt-auto space-y-2 pt-4 border-t border-white/10">
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-full text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition cursor-pointer bg-transparent border-none"
            >
              <span>⚙️</span>
              Painel Admin
            </button>
          )}
        </div>
      </aside>
      <main className={`flex-1 ml-64 ${isChatPage ? 'p-0' : 'p-8 max-w-4xl'}`}>
        <Outlet />
      </main>
    </div>
  );
}
