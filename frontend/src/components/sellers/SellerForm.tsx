import type { CreateSellerDto, Company } from '../../types';
import { SellerAdvancedFields } from './SellerAdvancedFields';

const inputCls = 'bg-white border border-border rounded-lg px-3 py-2 text-sm text-navy outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition';
const btnPrimary = 'bg-navy-dark text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-navy-light transition cursor-pointer';
const btnSecondary = 'bg-surface-hover text-text-muted px-5 py-2 rounded-full text-sm font-medium hover:bg-border transition cursor-pointer';

export function SellerForm({
  form,
  editId,
  companyList,
  showAdvanced,
  onSubmit,
  onChange,
  onCancel,
  onToggleAdvanced,
}: {
  form: CreateSellerDto;
  editId: string | null;
  companyList: Company[];
  showAdvanced: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (partial: Partial<CreateSellerDto>) => void;
  onCancel: () => void;
  onToggleAdvanced: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="bg-surface border border-border rounded-xl p-5 mb-6">
      <h3 className="text-sm font-semibold text-text-muted mb-4 uppercase tracking-wide">
        {editId ? 'Editar Vendedor' : 'Novo Vendedor'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
          Empresa
          <select className={inputCls} value={form.companyId} onChange={(e) => onChange({ companyId: e.target.value })} required disabled={!!editId}>
            <option value="">Selecione...</option>
            {companyList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
          Nome
          <input className={inputCls} value={form.name} onChange={(e) => onChange({ name: e.target.value })} required />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
          Nome do Agente
          <input className={inputCls} value={form.agentName} onChange={(e) => onChange({ agentName: e.target.value })} required />
        </label>
      </div>

      <button
        type="button"
        className="text-accent text-xs font-medium mt-3 hover:text-accent-hover transition cursor-pointer bg-transparent border-none"
        onClick={onToggleAdvanced}
      >
        {showAdvanced ? '▼ Ocultar configurações avançadas' : '▶ Configurações avançadas'}
      </button>

      {showAdvanced && <SellerAdvancedFields form={form} onChange={onChange} />}

      <div className="flex gap-3 mt-4">
        <button type="submit" className={btnPrimary}>{editId ? 'Salvar' : 'Criar'}</button>
        {editId && (
          <button type="button" className={btnSecondary} onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
