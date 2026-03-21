import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { sellers, auth } from '../api/client';
import type { Seller } from '../types';

interface SellerContextType {
  seller: Seller | null;
  setSellerId: (id: string | null) => void;
  reload: () => void;
  silentReload: () => void;
  loading: boolean;
}

const SellerContext = createContext<SellerContextType>({
  seller: null,
  setSellerId: () => {},
  reload: () => {},
  silentReload: () => {},
  loading: false,
});

export function SellerProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(false);

  const loadById = async (id: string) => {
    setLoading(true);
    try {
      const data = await sellers.get(id);
      setSeller(data);
    } catch {
      setSeller(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load seller linked to Clerk user
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setSeller(null);
      return;
    }

    setLoading(true);
    auth.me().then((mySeller) => {
      setSeller(mySeller);
    }).catch(() => {
      setSeller(null);
    }).finally(() => {
      setLoading(false);
    });
  }, [isLoaded, isSignedIn]);

  const setSellerId = (id: string | null) => {
    if (id) {
      loadById(id);
    } else {
      setSeller(null);
    }
  };

  const reload = () => {
    if (seller?.id) loadById(seller.id);
  };

  const silentReload = async () => {
    if (!seller?.id) return;
    try {
      const data = await sellers.get(seller.id);
      setSeller(data);
    } catch { /* keep current seller on silent reload failure */ }
  };

  return (
    <SellerContext.Provider value={{ seller, setSellerId, reload, silentReload, loading }}>
      {children}
    </SellerContext.Provider>
  );
}

export const useSeller = () => useContext(SellerContext);
