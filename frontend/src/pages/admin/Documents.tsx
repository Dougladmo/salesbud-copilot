import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { companies } from '../../api/client';
import type { DocumentRecord } from '../../api/client';
import { useSeller } from '../../context/SellerContext';
import { DocumentTable } from '../../components/documents/DocumentTable';

const inputCls = 'bg-white border border-border rounded-lg px-3 py-2 text-sm text-navy outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition';
const btnPrimary = 'bg-navy-dark text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-navy-light transition cursor-pointer';

export default function Documents() {
  const { seller: currentSeller } = useSeller();
  const companyId = currentSeller?.companyId || '';
  const companyName = currentSeller?.company?.name || '';

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!companyId) return;
    setLoadingDocs(true);
    try {
      const docs = await companies.listDocuments(companyId);
      setDocuments(docs);
    } catch {
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const namespace = currentSeller?.company?.pineconeNamespace || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await companies.uploadDocument(companyId, text);
      toast.success(`Documento enviado! ID: ${result.id}`);
      setText('');
      loadDocuments();
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
      await companies.deleteDocument(companyId, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success('Documento removido com sucesso.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover documento');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-navy mb-2">Base de Conhecimento (RAG)</h2>
      <p className="text-text-muted text-sm mb-5">
        Gerencie os documentos da base de conhecimento de <strong>{companyName}</strong>.
      </p>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-5 mb-6">
        {namespace && (
          <div className="mb-4 text-xs text-text-muted">
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
          <button type="submit" className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`} disabled={loading || !companyId}>
            {loading ? 'Enviando...' : 'Adicionar Documento'}
          </button>
        </div>
      </form>

      {companyId && (
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
