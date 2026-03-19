import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/companies', label: 'Empresas', icon: '🏢' },
  { to: '/sellers', label: 'Vendedores', icon: '👤' },
  { to: '/documents', label: 'Documentos', icon: '📄' },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-60 bg-navy-dark fixed top-0 left-0 bottom-0 flex flex-col p-6 gap-2">
        <h1 className="text-xl font-bold text-white mb-6 px-2 tracking-tight">
          Sales<span className="text-accent">bud</span>
        </h1>
        <nav className="flex flex-col gap-1">
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
      </aside>
      <main className="flex-1 ml-60 p-8 max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
}
