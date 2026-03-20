import type { Company, Seller } from '../../types';

const inputCls = 'bg-white border border-border rounded-lg px-3 py-2 text-sm text-navy outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition';
const btnPrimary = 'bg-navy-dark text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-navy-light transition cursor-pointer';

export function DocumentUploadForm({
  companyList,
  sellerList,
  targetType,
  targetId,
  text,
  loading,
  namespace,
  onTargetTypeChange,
  onTargetIdChange,
  onTextChange,
  onSubmit,
}: {
  companyList: Company[];
  sellerList: Seller[];
  targetType: 'company' | 'seller';
  targetId: string;
  text: string;
  loading: boolean;
  namespace: string | null;
  onTargetTypeChange: (type: 'company' | 'seller') => void;
  onTargetIdChange: (id: string) => void;
  onTextChange: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="bg-surface border border-border rounded-xl p-5 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
          Tipo
          <select className={inputCls} value={targetType} onChange={(e) => { onTargetTypeChange(e.target.value as 'company' | 'seller'); onTargetIdChange(''); }}>
            <option value="company">Empresa</option>
            <option value="seller">Vendedor</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
          {targetType === 'company' ? 'Empresa' : 'Vendedor'}
          <select className={inputCls} value={targetId} onChange={(e) => onTargetIdChange(e.target.value)} required>
            <option value="">Selecione...</option>
            {targetType === 'company'
              ? companyList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
              : sellerList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)
            }
          </select>
        </label>
      </div>

      {targetId && (
        <div className="mt-2 text-xs text-text-muted">
          Namespace: <code className="bg-white border border-border px-2 py-0.5 rounded text-xs">{namespace || 'Será criado automaticamente'}</code>
        </div>
      )}

      <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted mt-4">
        Conteúdo do Documento
        <textarea
          className={`${inputCls} resize-y`}
          rows={8}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Cole aqui o conteúdo do documento (informações de produto, FAQ, políticas, etc.)"
          required
        />
      </label>

      <div className="flex gap-3 mt-4">
        <button type="submit" className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`} disabled={loading || !targetId}>
          {loading ? 'Enviando...' : 'Adicionar Documento'}
        </button>
      </div>
    </form>
  );
}
