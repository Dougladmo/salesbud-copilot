import type { DocumentRecord } from '../../api/client';

const inputCls =
  'bg-white border border-border rounded-lg px-4 py-2.5 text-sm text-navy outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 w-full placeholder:text-text-muted/50';

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
      <form onSubmit={onSubmitDoc} className="bg-white border border-border rounded-2xl p-6 shadow-sm mb-6 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">✍️</span>
          <h3 className="text-sm font-bold text-navy">Novo Documento</h3>
        </div>
        <textarea
          className={`${inputCls} resize-y min-h-[140px]`}
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cole aqui o conteúdo (informações de produto, FAQ, políticas, etc.)"
          required
        />
        <div className="flex justify-end mt-4">
          <button
            type="submit"
            disabled={loadingDoc || !text.trim()}
            className="flex items-center gap-2 bg-navy-dark text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent hover:shadow-lg hover:shadow-accent/20 transition-all duration-200 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            {loadingDoc ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              'Adicionar Documento'
            )}
          </button>
        </div>
      </form>

      {/* Company Documents */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          Base de Conhecimento da Empresa
        </h3>
        <span className="text-xs font-semibold text-accent bg-accent/10 px-2.5 py-1 rounded-full">
          {companyDocuments.length} {companyDocuments.length === 1 ? 'documento' : 'documentos'}
        </span>
      </div>

      {loadingDocs ? (
        <div className="flex items-center justify-center py-12">
          <span className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : companyDocuments.length === 0 ? (
        <div className="bg-white border border-border border-dashed rounded-2xl p-10 text-center animate-fade-in mb-8">
          <span className="text-3xl block mb-3">🏢</span>
          <p className="text-text-muted text-sm">Nenhum documento da empresa.</p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {companyDocuments.map((doc, i) => (
            <div
              key={doc.id}
              className="bg-white border border-border rounded-2xl p-5 flex items-start gap-4 hover:shadow-md hover:border-accent/20 transition-all duration-200 animate-fade-in-up group"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm">🏢</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-text-muted/60 font-mono mb-1.5">
                  {doc.id.slice(0, 12)}...
                </p>
                <p className="text-sm text-navy leading-relaxed">
                  {doc.text.length > 200 ? doc.text.slice(0, 200) + '...' : doc.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seller Documents */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          Documentos do seu Copilot
        </h3>
        <span className="text-xs font-semibold text-accent bg-accent/10 px-2.5 py-1 rounded-full">
          {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
        </span>
      </div>

      {loadingDocs ? (
        <div className="flex items-center justify-center py-12">
          <span className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white border border-border border-dashed rounded-2xl p-10 text-center animate-fade-in">
          <span className="text-3xl block mb-3">📂</span>
          <p className="text-text-muted text-sm">Nenhum documento do copilot.</p>
          <p className="text-text-muted/60 text-xs mt-1">Adicione documentos para o agente usar como referência.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc, i) => (
            <div
              key={doc.id}
              className="bg-white border border-border rounded-2xl p-5 flex items-start gap-4 hover:shadow-md hover:border-accent/20 transition-all duration-200 animate-fade-in-up group"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm">📄</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-text-muted/60 font-mono mb-1.5">
                  {doc.id.slice(0, 12)}...
                </p>
                <p className="text-sm text-navy leading-relaxed">
                  {doc.text.length > 200 ? doc.text.slice(0, 200) + '...' : doc.text}
                </p>
              </div>
              <button
                onClick={() => onDeleteDoc(doc.id)}
                disabled={deletingId === doc.id}
                className="shrink-0 opacity-0 group-hover:opacity-100 bg-danger/10 text-danger px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-danger hover:text-white transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {deletingId === doc.id ? (
                  <span className="w-3 h-3 border-2 border-danger/30 border-t-danger rounded-full animate-spin inline-block" />
                ) : (
                  'Remover'
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
