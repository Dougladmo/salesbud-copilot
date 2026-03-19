import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Companies from './pages/Companies';
import Sellers from './pages/Sellers';
import Documents from './pages/Documents';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/companies" replace />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/sellers" element={<Sellers />} />
          <Route path="/documents" element={<Documents />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
