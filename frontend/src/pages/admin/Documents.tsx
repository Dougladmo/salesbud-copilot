import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { companies } from '../../api/client';
import type { DocumentRecord } from '../../api/client';
import { useSeller } from '../../context/SellerContext';
import { DocumentTable } from '../../components/documents/DocumentTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    <div className="animate-fade-in">
      <h2 className="text-2xl font-semibold text-foreground mb-2">Base de Conhecimento (RAG)</h2>
      <p className="text-muted-foreground text-sm mb-5">
        Gerencie os documentos da base de conhecimento de <strong>{companyName}</strong>.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm">Novo Documento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {namespace && (
              <div className="text-xs text-muted-foreground">
                Namespace: <Badge variant="outline" className="ml-1 font-mono">{namespace}</Badge>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="docContent">Conteudo do Documento</Label>
              <Textarea
                id="docContent"
                rows={8}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Cole aqui o conteudo do documento (informacoes de produto, FAQ, politicas, etc.)"
                className="resize-y"
                required
              />
            </div>

            <Button type="submit" disabled={loading || !companyId}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Adicionar Documento'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {companyId && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Documentos Cadastrados
            </h3>
            <Badge variant="secondary">
              {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
            </Badge>
          </div>
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
