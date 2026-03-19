import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SellerProvider } from './context/SellerContext';
import ErrorBoundary from './components/ErrorBoundary';
import SellerLayout from './components/SellerLayout';
import AdminLayout from './components/AdminLayout';
import SellerSelect from './pages/seller/SellerSelect';
import Copilot from './pages/seller/Copilot';
import Companies from './pages/admin/Companies';
import Sellers from './pages/admin/Sellers';
import Documents from './pages/admin/Documents';

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <SellerProvider>
        <Routes>
          {/* Seller select (login) */}
          <Route path="/" element={<SellerSelect />} />

          {/* Seller area */}
          <Route path="/seller" element={<SellerLayout />}>
            <Route index element={<Navigate to="/seller/copilot" replace />} />
            <Route path="copilot" element={<Copilot />} />
          </Route>

          {/* Admin area */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/companies" replace />} />
            <Route path="companies" element={<Companies />} />
            <Route path="sellers" element={<Sellers />} />
            <Route path="documents" element={<Documents />} />
          </Route>
        </Routes>
      </SellerProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
