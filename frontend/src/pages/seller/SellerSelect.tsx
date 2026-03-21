import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellers } from '../../api/client';
import { useSeller } from '../../context/SellerContext';
import type { Seller } from '../../types';

export default function SellerSelect() {
  const [list, setList] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const { setSellerId } = useSeller();
  const navigate = useNavigate();

  useEffect(() => {
    sellers.list().then(setList).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSelect = (id: string) => {
    setSellerId(id);
    navigate('/seller/copilot');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy-dark tracking-tight">
            Sales<span className="text-accent">bud</span>
          </h1>
          <p className="text-text-muted text-sm mt-2">Selecione seu perfil de vendedor</p>
        </div>

        {loading ? (
          <p className="text-center text-text-muted text-sm">Carregando...</p>
        ) : list.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-6 text-center">
            <p className="text-text-muted text-sm">Nenhum vendedor encontrado. Execute o seed do backend para criar vendedores.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s.id)}
                className="w-full bg-surface border border-border rounded-xl p-4 flex items-center gap-4 hover:border-accent hover:shadow-md transition cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-full bg-navy-dark text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy truncate">{s.name}</p>
                  <p className="text-xs text-text-muted truncate">Agente: {s.agentName} — {s.company?.name || 'Sem empresa'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.isActive ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'}`}>
                    {s.isActive ? 'ON' : 'OFF'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/admin')}
            className="text-text-muted text-xs hover:text-accent transition cursor-pointer bg-transparent border-none"
          >
            Acessar painel admin →
          </button>
        </div>
      </div>
    </div>
  );
}
