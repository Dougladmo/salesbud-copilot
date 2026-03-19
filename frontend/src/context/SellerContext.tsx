import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { sellers } from '../api/client';
import type { Seller } from '../types';

interface SellerContextType {
  seller: Seller | null;
  setSellerId: (id: string | null) => void;
  reload: () => void;
  /** Silently refresh seller data without showing loading state */
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
  const [sellerId, setSellerId] = useState<string | null>(() => localStorage.getItem('sellerId'));
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (id: string) => {
    setLoading(true);
    try {
      const data = await sellers.get(id);
      setSeller(data);
    } catch {
      setSeller(null);
      setSellerId(null);
      localStorage.removeItem('sellerId');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sellerId) {
      localStorage.setItem('sellerId', sellerId);
      load(sellerId);
    } else {
      localStorage.removeItem('sellerId');
      setSeller(null);
    }
  }, [sellerId]);

  const reload = () => {
    if (sellerId) load(sellerId);
  };

  const silentReload = async () => {
    if (!sellerId) return;
    try {
      const data = await sellers.get(sellerId);
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
