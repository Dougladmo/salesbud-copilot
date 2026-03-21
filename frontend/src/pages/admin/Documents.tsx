import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { companies, sellers } from '../../api/client';
import type { DocumentRecord } from '../../api/client';
import type { Seller } from '../../types';
import { useSeller } from '../../context/SellerContext';
import { DocumentTable } from '../../components/documents/DocumentTable';

const inputCls = 'bg-white border border-border rounded-lg px-3 py-2 text-sm text-navy outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition';
const btnPrimary = 'bg-navy-dark text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-navy-light transition cursor-pointer';

export default function Documents() {
  const { seller: currentSeller } = useSeller();
  const companyId = currentSeller?.companyId || '';
  const companyName = currentSeller?.company?.name || '';

  const [sellerList, setSellerList] = useState<Seller[]>([]);
  const [targetType, setTargetType] = useState<'company' | 'seller'>('company');
  const [targetSellerId, setTargetSellerId] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    sellers.list()
      .then((all) => setSellerList(all.filter((s) => s.companyId === companyId)))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Erro ao carregar vendedores'));
  }, [companyId]);

  const loadDocuments = useCallback(async () => {
    if (!companyId) return;
    if (targetType === 'seller' && !targetSellerId) {
      setDocuments([]);
      return;
    }
    setLoadingDocs(true);
    try {
      const docs = targetType === 'company'
        ? await companies.listDocuments(companyId)
        : await sellers.listDocuments(targetSellerId);
      setDocuments(docs);
    } catch {
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, [companyId, targetType, targetSellerId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const getSelectedNamespace = (): string | null => {
    if (targetType === 'company') {
      return currentSeller?.company?.pineconeNamespace || null;
    }
    const s = sellerList.find((x) => x.id === targetSellerId);
    return s?.pineconeNamespace || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = targetType === 'company'
        ? await companies.uploadDocument(companyId, text)
        : await sellers.uploadDocument(targetSellerId, text);
      toast.success(`Documento enviado! ID: ${result.id}`);
      setText('');
      loadDocuments();
      if (targetType === 'seller') {
        sellers.list()
          .then((all) => setSellerList(all.filter((s) => s.companyId === companyId)))
          .catch(() => {});
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
        await companies.deleteDocument(companyId, docId);
      } else {
        await sellers.deleteDocument(targetSellerId, docId);
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
  const canSubmit = targetType === 'company' ? !!companyId : !!targetSellerId;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-navy mb-2">Base de Conhecimento (RAG)</h2>
      <p className="text-text-muted text-sm mb-5">
        Gerencie os documentos da base de conhecimento de <strong>{companyName}</strong>.
      </p>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
            Tipo
            <select
              className={inputCls}
              value={targetType}
              onChange={(e) => { setTargetType(e.target.value as 'company' | 'seller'); setTargetSellerId(''); }}
            >
              <option value="company">Empresa</option>
              <option value="seller">Vendedor</option>
            </select>
          </label>
          {targetType === 'seller' && (
            <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
              Vendedor
              <select className={inputCls} value={targetSellerId} onChange={(e) => setTargetSellerId(e.target.value)} required>
                <option value="">Selecione...</option>
                {sellerList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
          )}
        </div>

        {canSubmit && namespace && (
          <div className="mt-2 text-xs text-text-muted">
            Namespace: <code className="bg-white border border-border px-2 py-0.5 rounded text-xs">{namespace}</code>
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
          <button type="submit" className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`} disabled={loading || !canSubmit}>
            {loading ? 'Enviando...' : 'Adicionar Documento'}
          </button>
        </div>
      </form>

      {canSubmit && (
        <>
          <h3 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wide">
            Documentos Cadastrados ({documents.length})
          </h3>
          <DocumentTable
            documents={documents}
            loadingDocs={loadingDocs}
            deletingId={deletingId}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  );
}
