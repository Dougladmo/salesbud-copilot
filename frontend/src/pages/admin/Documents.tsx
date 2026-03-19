import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { companies, sellers } from '../../api/client';
import type { DocumentRecord } from '../../api/client';
import type { Company, Seller } from '../../types';

const inputCls = 'bg-white border border-border rounded-lg px-3 py-2 text-sm text-navy outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition';
const btnPrimary = 'bg-navy-dark text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-navy-light transition cursor-pointer';

export default function Documents() {
  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [sellerList, setSellerList] = useState<Seller[]>([]);
  const [targetType, setTargetType] = useState<'company' | 'seller'>('company');
  const [targetId, setTargetId] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    companies.list().then(setCompanyList).catch((e) => toast.error(e instanceof Error ? e.message : 'Erro ao carregar empresas'));
    sellers.list().then(setSellerList).catch((e) => toast.error(e instanceof Error ? e.message : 'Erro ao carregar vendedores'));
  }, []);

  const loadDocuments = useCallback(async () => {
    if (!targetId) {
      setDocuments([]);
      return;
    }
    setLoadingDocs(true);
    try {
      const docs = targetType === 'company'
        ? await companies.listDocuments(targetId)
        : await sellers.listDocuments(targetId);
      setDocuments(docs);
    } catch {
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, [targetId, targetType]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const getSelectedNamespace = (): string | null => {
    if (targetType === 'company') {
      const c = companyList.find((x) => x.id === targetId);
      return c?.pineconeNamespace || null;
    }
    const s = sellerList.find((x) => x.id === targetId);
    return s?.pineconeNamespace || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = targetType === 'company'
        ? await companies.uploadDocument(targetId, text)
        : await sellers.uploadDocument(targetId, text);
      toast.success(`Documento enviado! ID: ${result.id} | Namespace: ${result.namespace}`);
      setText('');
      loadDocuments();
      if (targetType === 'seller') {
        sellers.list().then(setSellerList).catch((e) => toast.error(e instanceof Error ? e.message : 'Erro ao atualizar vendedores'));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar documento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Tem certeza que deseja remover este documento da base de conhecimento?')) return;
    setDeletingId(docId);
    try {
      if (targetType === 'company') {
        await companies.deleteDocument(targetId, docId);
      } else {
        await sellers.deleteDocument(targetId, docId);
      }
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success('Documento removido com sucesso.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover documento');
    } finally {
      setDeletingId(null);
    }
  };

  const namespace = getSelectedNamespace();

  return (
    <div>
      <h2 className="text-2xl font-semibold text-navy mb-2">Base de Conhecimento (RAG)</h2>
      <p className="text-text-muted text-sm mb-5">
        Gerencie os documentos da base de conhecimento de empresas e vendedores. O namespace no Pinecone
        {' '}será criado automaticamente ao enviar o primeiro documento.
      </p>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
            Tipo
            <select className={inputCls} value={targetType} onChange={(e) => { setTargetType(e.target.value as 'company' | 'seller'); setTargetId(''); }}>
              <option value="company">Empresa</option>
              <option value="seller">Vendedor</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
            {targetType === 'company' ? 'Empresa' : 'Vendedor'}
            <select className={inputCls} value={targetId} onChange={(e) => setTargetId(e.target.value)} required>
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
            onChange={(e) => setText(e.target.value)}
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

      {targetId && (
        <>
          <h3 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wide">
            Documentos Cadastrados ({documents.length})
          </h3>
          {loadingDocs ? (
            <p className="text-text-muted text-sm">Carregando documentos...</p>
          ) : documents.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-muted text-sm">
              Nenhum documento encontrado nesta base de conhecimento.
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface-hover">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Conteúdo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-20">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-t border-border hover:bg-surface-hover transition">
                      <td className="px-4 py-3 text-sm">
                        <code className="bg-white border border-border px-2 py-0.5 rounded text-xs text-text-muted">{doc.id.slice(0, 8)}...</code>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted max-w-[500px] truncate" title={doc.text}>
                        {doc.text.length > 120 ? doc.text.slice(0, 120) + '...' : doc.text}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="bg-danger text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-danger-hover transition cursor-pointer disabled:opacity-50"
                          disabled={deletingId === doc.id}
                          onClick={() => handleDelete(doc.id)}
                        >
                          {deletingId === doc.id ? '...' : 'Remover'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
