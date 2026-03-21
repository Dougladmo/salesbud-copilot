import type { Seller } from '../../types';

const btnSmPrimary = 'bg-navy-dark text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-navy-light transition cursor-pointer';
const btnSmSuccess = 'bg-success text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-success-hover transition cursor-pointer';
const btnSmDanger = 'bg-danger text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-danger-hover transition cursor-pointer';

const traitLabel: Record<string, string> = {
  formal: 'Formal', informal: 'Informal',
  humorous: 'Humorístico', serious: 'Sério',
  direct: 'Direto', detailed: 'Detalhado',
  empathetic: 'Empático', objective: 'Objetivo',
  consultive: 'Consultivo', aggressive: 'Agressivo',
};

export function SellerTable({
  list,
  onEdit,
  onDelete,
  onToggleCopilot,
  onConnectWhatsApp,
}: {
  list: Seller[];
  onEdit: (s: Seller) => void;
  onDelete: (id: string) => void;
  onToggleCopilot: (s: Seller) => void;
  onConnectWhatsApp: (s: Seller) => void;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-hover">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Agente</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Copilot</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Personalidade</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="border-t border-border hover:bg-surface-hover transition">
                <td className="px-4 py-3 text-sm text-navy font-medium">{s.name}</td>
                <td className="px-4 py-3 text-sm text-text-muted">{s.agentName}</td>
                <td className="px-4 py-3">
                  <button
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                      s.isActive
                        ? 'bg-success text-white hover:bg-success-hover'
                        : 'bg-text-muted text-white hover:bg-gray-500'
                    }`}
                    onClick={() => onToggleCopilot(s)}
                    title={s.isActive ? 'Clique para desligar' : 'Clique para ligar'}
                  >
                    {s.isActive ? 'ON' : 'OFF'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    <span className="bg-white border border-border px-2 py-0.5 rounded text-[10px] text-text-muted">{traitLabel[s.traitFormality]}</span>
                    <span className="bg-white border border-border px-2 py-0.5 rounded text-[10px] text-text-muted">{traitLabel[s.traitHumor]}</span>
                    <span className="bg-white border border-border px-2 py-0.5 rounded text-[10px] text-text-muted">{traitLabel[s.traitSelling]}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {s.evolutionInstanceName && (
                      <button className={btnSmSuccess} onClick={() => onConnectWhatsApp(s)}>WhatsApp</button>
                    )}
                    <button className={btnSmPrimary} onClick={() => onEdit(s)}>Editar</button>
                    <button className={btnSmDanger} onClick={() => onDelete(s.id)}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-text-muted text-sm">
                  Nenhum vendedor cadastrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
