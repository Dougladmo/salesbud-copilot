import { Loader2 } from 'lucide-react';
import type { DocumentRecord } from '../../api/client';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DocumentTable({
  documents,
  loadingDocs,
  deletingId,
  onDelete,
}: {
  documents: DocumentRecord[];
  loadingDocs: boolean;
  deletingId: string | null;
  onDelete: (docId: string) => void;
}) {
  if (loadingDocs) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          Nenhum documento encontrado nesta base de conhecimento.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32">ID</TableHead>
            <TableHead>Conteudo</TableHead>
            <TableHead className="w-24">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>
                <Badge variant="outline" className="font-mono text-xs">
                  {doc.id.slice(0, 8)}...
                </Badge>
              </TableCell>
              <TableCell className="max-w-[500px] truncate text-muted-foreground" title={doc.text}>
                {doc.text.length > 120 ? doc.text.slice(0, 120) + '...' : doc.text}
              </TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deletingId === doc.id}
                  onClick={() => onDelete(doc.id)}
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    'Remover'
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
