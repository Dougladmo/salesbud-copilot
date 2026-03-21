import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useOrganization } from '@clerk/clerk-react';
import { auth } from '../api/client';
import { useSeller } from '../context/SellerContext';

export default function HomeRedirect() {
  const { membership, isLoaded: orgLoaded } = useOrganization();
  const { setSellerId } = useSeller();
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!orgLoaded) return;

    const role = membership?.role;
    const admin = role === 'org:admin';
    setIsAdmin(admin);

    if (admin) {
      setReady(true);
      return;
    }

    // Member → load seller linked to Clerk user
    auth.me().then((seller) => {
      setSellerId(seller.id);
      setReady(true);
    }).catch(() => {
      // Seller not linked yet, still redirect to copilot
      setReady(true);
    });
  }, [orgLoaded, membership]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Carregando...</p>
      </div>
    );
  }

  if (isAdmin) return <Navigate to="/admin" replace />;
  return <Navigate to="/seller/copilot" replace />;
}
