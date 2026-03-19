import { useEffect, useState } from 'react';
import { companies, sellers } from '../api/client';
import type { Company, Seller } from '../types';

export default function Documents() {
  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [sellerList, setSellerList] = useState<Seller[]>([]);
  const [targetType, setTargetType] = useState<'company' | 'seller'>('company');
  const [targetId, setTargetId] = useState('');
  const [text, setText] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    companies.list().then(setCompanyList).catch(() => {});
    sellers.list().then(setSellerList).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const result = targetType === 'company'
        ? await companies.uploadDocument(targetId, text)
        : await sellers.uploadDocument(targetId, text);
      setStatus({
        type: 'success',
        message: `Documento enviado! ID: ${result.id} | Namespace: ${result.namespace}`,
      });
      setText('');
    } catch (err: unknown) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro ao enviar documento',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Upload de Documentos</h2>
      <p className="subtitle">
        Envie documentos para a base de conhecimento (RAG) de uma empresa ou vendedor.
      </p>

      {status && (
        <p className={status.type === 'success' ? 'success' : 'error'}>
          {status.message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-grid">
          <label>
            Tipo
            <select value={targetType} onChange={(e) => { setTargetType(e.target.value as 'company' | 'seller'); setTargetId(''); }}>
              <option value="company">Empresa</option>
              <option value="seller">Vendedor</option>
            </select>
          </label>
          <label>
            {targetType === 'company' ? 'Empresa' : 'Vendedor'}
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} required>
              <option value="">Selecione...</option>
              {targetType === 'company'
                ? companyList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
                : sellerList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)
              }
            </select>
          </label>
        </div>

        <label className="full-width">
          Conteúdo do Documento
          <textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole aqui o conteúdo do documento (informações de produto, FAQ, políticas, etc.)"
            required
          />
        </label>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Documento'}
          </button>
        </div>
      </form>
    </div>
  );
}
