import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SellerProvider } from './context/SellerContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import HomeRedirect from './components/HomeRedirect';
import SellerLayout from './components/SellerLayout';
import AdminLayout from './components/AdminLayout';
import Copilot from './pages/seller/Copilot';
import Chat from './pages/seller/Chat';
import Documents from './pages/admin/Documents';
import SignInPage from './pages/auth/SignInPage';

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <SellerProvider>
        <Routes>
          {/* Auth routes (public) */}
          <Route path="/sign-in/*" element={<SignInPage />} />

          {/* Home — redirects based on org role */}
          <Route path="/" element={<ProtectedRoute><HomeRedirect /></ProtectedRoute>} />

          {/* Seller area */}
          <Route path="/seller" element={<ProtectedRoute><SellerLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/seller/copilot" replace />} />
            <Route path="copilot" element={<Copilot />} />
            <Route path="chat" element={<Chat />} />
          </Route>

          {/* Admin area */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin/documents" replace />} />
            <Route path="documents" element={<Documents />} />
          </Route>
        </Routes>
      </SellerProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
