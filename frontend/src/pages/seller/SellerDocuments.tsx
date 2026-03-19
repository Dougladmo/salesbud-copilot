import { useEffect, useState, useCallback } from 'react';
import { sellers } from '../../api/client';
import { useSeller } from '../../context/SellerContext';
import type { DocumentRecord } from '../../api/client';

const inputCls = 'bg-white border border-border rounded-lg px-3 py-2 text-sm text-navy outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition w-full';

export default function SellerDocuments() {
  const { seller } = useSeller();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!seller) return;
    setLoadingDocs(true);
    try {
      const docs = await sellers.listDocuments(seller.id);
      setDocuments(docs);
    } catch {
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, [seller]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  if (!seller) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const result = await sellers.uploadDocument(seller.id, text);
      setStatus({ type: 'success', msg: `Documento enviado! ID: ${result.id}` });
      setText('');
      loadDocuments();
    } catch (err: unknown) {
      setStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Erro ao enviar' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Remover este documento?')) return;
    setDeletingId(docId);
    try {
      await sellers.deleteDocument(seller.id, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setStatus({ type: 'success', msg: 'Documento removido.' });
    } catch (err: unknown) {
      setStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Erro ao remover' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-navy mb-1">Meus Documentos</h2>
      <p className="text-text-muted text-sm mb-6">
        Base de conhecimento do seu agente. Adicione documentos para que ele possa responder com mais contexto.
        {seller.pineconeNamespace && (
          <span className="ml-2">
            Namespace: <code className="bg-surface border border-border px-1.5 py-0.5 rounded text-xs">{seller.pineconeNamespace}</code>
          </span>
        )}
      </p>

      {status && (
        <div className={`px-4 py-3 rounded-lg mb-4 text-sm border ${
          status.type === 'success' ? 'bg-success/10 border-success text-success' : 'bg-danger/10 border-danger text-danger'
        }`}>
          {status.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-5 mb-6">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">Novo Documento</h3>
        <textarea
          className={`${inputCls} resize-y`}
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cole aqui o conteúdo (informações de produto, FAQ, políticas, etc.)"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-navy-dark text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-navy-light transition cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Adicionar Documento'}
        </button>
      </form>

      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
        Documentos ({documents.length})
      </h3>

      {loadingDocs ? (
        <p className="text-text-muted text-sm">Carregando...</p>
      ) : documents.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-muted text-sm">
          Nenhum documento na base de conhecimento.
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-surface border border-border rounded-xl p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted mb-1">
                  <code className="bg-white border border-border px-1.5 py-0.5 rounded text-[10px]">{doc.id.slice(0, 12)}...</code>
                </p>
                <p className="text-sm text-navy leading-relaxed">
                  {doc.text.length > 200 ? doc.text.slice(0, 200) + '...' : doc.text}
                </p>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                disabled={deletingId === doc.id}
                className="shrink-0 bg-danger/10 text-danger px-3 py-1 rounded-full text-xs font-medium hover:bg-danger hover:text-white transition cursor-pointer disabled:opacity-50"
              >
                {deletingId === doc.id ? '...' : 'Remover'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
