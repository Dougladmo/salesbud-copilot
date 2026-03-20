import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { companies, sellers } from '../../api/client';
import type { DocumentRecord } from '../../api/client';
import type { Company, Seller } from '../../types';
import { DocumentUploadForm } from '../../components/documents/DocumentUploadForm';
import { DocumentTable } from '../../components/documents/DocumentTable';

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

  return (
    <div>
      <h2 className="text-2xl font-semibold text-navy mb-2">Base de Conhecimento (RAG)</h2>
      <p className="text-text-muted text-sm mb-5">
        Gerencie os documentos da base de conhecimento de empresas e vendedores. O namespace no Pinecone
        {' '}será criado automaticamente ao enviar o primeiro documento.
      </p>
      <DocumentUploadForm
        companyList={companyList}
        sellerList={sellerList}
        targetType={targetType}
        targetId={targetId}
        text={text}
        loading={loading}
        namespace={getSelectedNamespace()}
        onTargetTypeChange={setTargetType}
        onTargetIdChange={setTargetId}
        onTextChange={setText}
        onSubmit={handleSubmit}
      />
      {targetId && (
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
