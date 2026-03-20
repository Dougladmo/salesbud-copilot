import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { sellers, companies } from '../api/client';
import type { DocumentRecord } from '../api/client';

export function useCopilotDocuments(sellerId: string | undefined, companyId: string | undefined) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [companyDocuments, setCompanyDocuments] = useState<DocumentRecord[]>([]);
  const [text, setText] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!sellerId || !companyId) return;
    setLoadingDocs(true);
    try {
      const [sellerDocs, companyDocs] = await Promise.all([
        sellers.listDocuments(sellerId),
        companies.listDocuments(companyId),
      ]);
      setDocuments(sellerDocs);
      setCompanyDocuments(companyDocs);
    } catch {
      setDocuments([]);
      setCompanyDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, [sellerId, companyId]);

  const handleSubmitDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerId) return;
    setLoadingDoc(true);
    try {
      await sellers.uploadDocument(sellerId, text);
      toast.success('Documento enviado!');
      setText('');
      loadDocuments();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar');
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Remover este documento?')) return;
    if (!sellerId) return;
    setDeletingId(docId);
    try {
      await sellers.deleteDocument(sellerId, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success('Documento removido.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover');
    } finally {
      setDeletingId(null);
    }
  };

  return {
    documents,
    companyDocuments,
    text,
    setText,
    loadingDoc,
    loadingDocs,
    deletingId,
    loadDocuments,
    handleSubmitDoc,
    handleDeleteDoc,
  };
}
