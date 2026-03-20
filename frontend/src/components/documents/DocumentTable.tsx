import type { DocumentRecord } from '../../api/client';

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
    return <p className="text-text-muted text-sm">Carregando documentos...</p>;
  }

  if (documents.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-muted text-sm">
        Nenhum documento encontrado nesta base de conhecimento.
      </div>
    );
  }

  return (
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
                  onClick={() => onDelete(doc.id)}
                >
                  {deletingId === doc.id ? '...' : 'Remover'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
