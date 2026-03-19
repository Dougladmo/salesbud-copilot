import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SellerProvider } from './context/SellerContext';
import SellerLayout from './components/SellerLayout';
import AdminLayout from './components/AdminLayout';
import SellerSelect from './pages/seller/SellerSelect';
import AgentConfig from './pages/seller/AgentConfig';
import WhatsApp from './pages/seller/WhatsApp';
import SellerDocuments from './pages/seller/SellerDocuments';
import Companies from './pages/admin/Companies';
import Sellers from './pages/admin/Sellers';
import Documents from './pages/admin/Documents';

export default function App() {
  return (
    <BrowserRouter>
      <SellerProvider>
        <Routes>
          {/* Seller select (login) */}
          <Route path="/" element={<SellerSelect />} />

          {/* Seller area */}
          <Route path="/seller" element={<SellerLayout />}>
            <Route index element={<Navigate to="/seller/agent" replace />} />
            <Route path="agent" element={<AgentConfig />} />
            <Route path="whatsapp" element={<WhatsApp />} />
            <Route path="documents" element={<SellerDocuments />} />
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
  );
}
