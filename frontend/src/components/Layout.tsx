import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h1 className="logo">SalesBud</h1>
        <nav>
          <NavLink to="/companies">Empresas</NavLink>
          <NavLink to="/sellers">Vendedores</NavLink>
          <NavLink to="/documents">Documentos</NavLink>
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
