import { PenLine, Building2, FileText, FolderOpen, Loader2 } from 'lucide-react';
import type { DocumentRecord } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function DocumentsTab({
  documents,
  companyDocuments,
  text,
  setText,
  loadingDoc,
  loadingDocs,
  deletingId,
  onSubmitDoc,
  onDeleteDoc,
}: {
  documents: DocumentRecord[];
  companyDocuments: DocumentRecord[];
  text: string;
  setText: (v: string) => void;
  loadingDoc: boolean;
  loadingDocs: boolean;
  deletingId: string | null;
  onSubmitDoc: (e: React.FormEvent) => void;
  onDeleteDoc: (docId: string) => void;
}) {
  return (
    <>
      <Card className="mb-6 animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <PenLine className="size-4 text-muted-foreground" />
            Novo Documento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmitDoc} className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Cole aqui o conteudo (informacoes de produto, FAQ, politicas, etc.)"
              rows={6}
              className="resize-y min-h-[140px]"
              required
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={loadingDoc || !text.trim()}>
                {loadingDoc ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Adicionar Documento'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Company Documents */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Base de Conhecimento da Empresa
        </h3>
        <Badge variant="secondary">
          {companyDocuments.length} {companyDocuments.length === 1 ? 'documento' : 'documentos'}
        </Badge>
      </div>

      {loadingDocs ? (
        <div className="space-y-3 mb-8">
          {[1, 2].map((i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : companyDocuments.length === 0 ? (
        <Card className="border-dashed mb-8 animate-fade-in">
          <CardContent className="p-10 text-center">
            <Building2 className="size-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum documento da empresa.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 mb-8">
          {companyDocuments.map((doc, i) => (
            <Card
              key={doc.id}
              className="hover:shadow-md transition-all duration-200 animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CardContent className="p-5 flex items-start gap-4">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground/60 font-mono mb-1.5">
                    {doc.id.slice(0, 12)}...
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {doc.text.length > 200 ? doc.text.slice(0, 200) + '...' : doc.text}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Seller Documents */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Documentos do seu Copilot
        </h3>
        <Badge variant="secondary">
          {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
        </Badge>
      </div>

      {loadingDocs ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Card className="border-dashed animate-fade-in">
          <CardContent className="p-10 text-center">
            <FolderOpen className="size-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum documento do copilot.</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Adicione documentos para o agente usar como referencia.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc, i) => (
            <Card
              key={doc.id}
              className="group hover:shadow-md transition-all duration-200 animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CardContent className="p-5 flex items-start gap-4">
                <div className="size-8 rounded-lg bg-pink/10 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="size-4 text-pink" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground/60 font-mono mb-1.5">
                    {doc.id.slice(0, 12)}...
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {doc.text.length > 200 ? doc.text.slice(0, 200) + '...' : doc.text}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteDoc(doc.id)}
                  disabled={deletingId === doc.id}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    'Remover'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
