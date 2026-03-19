import { useState, useEffect, useCallback, useRef } from 'react';
import { sellers, companies } from '../../api/client';
import { useSeller } from '../../context/SellerContext';
import type { DocumentRecord } from '../../api/client';

const inputCls =
  'bg-white border border-border rounded-lg px-4 py-2.5 text-sm text-navy outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 w-full placeholder:text-text-muted/50';

type Tab = 'config' | 'documents';

/** Unique key to re-trigger CSS enter animation on tab switch */
let tabKey = 0;

function StatusBanner({ status, onDismiss }: { status: { type: 'success' | 'error'; msg: string }; onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status.type === 'success') {
      const t = setTimeout(onDismiss, 3000);
      return () => clearTimeout(t);
    }
  }, [status, onDismiss]);

  return (
    <div
      ref={ref}
      className={`flex items-center justify-between px-4 py-3 rounded-xl mb-5 text-sm border animate-slide-down ${
        status.type === 'success'
          ? 'bg-success/10 border-success/30 text-success'
          : 'bg-danger/10 border-danger/30 text-danger'
      }`}
    >
      <div className="flex items-center gap-2">
        <span>{status.type === 'success' ? '✓' : '✕'}</span>
        <span>{status.msg}</span>
      </div>
      <button onClick={onDismiss} className="text-current opacity-50 hover:opacity-100 transition cursor-pointer">
        ✕
      </button>
    </div>
  );
}

export default function Copilot() {
  const { seller, reload, silentReload } = useSeller();
  const [tab, setTab] = useState<Tab>('config');
  const [animKey, setAnimKey] = useState(0);
  const [toggling, setToggling] = useState(false);
  const [optimisticActive, setOptimisticActive] = useState<boolean | null>(null);

  const isActive = optimisticActive ?? seller?.isActive ?? false;

  // Config state
  const [saving, setSaving] = useState(false);
  const [configStatus, setConfigStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [agentName, setAgentName] = useState('');
  const [voiceId, setVoiceId] = useState('');

  // Documents state
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [companyDocuments, setCompanyDocuments] = useState<DocumentRecord[]>([]);
  const [text, setText] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [docStatus, setDocStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (!seller) return;
    setAgentName(seller.agentName);
    setVoiceId(seller.voiceId || '');
  }, [seller]);

  const loadDocuments = useCallback(async () => {
    if (!seller) return;
    setLoadingDocs(true);
    try {
      const [sellerDocs, companyDocs] = await Promise.all([
        sellers.listDocuments(seller.id),
        companies.listDocuments(seller.companyId),
      ]);
      setDocuments(sellerDocs);
      setCompanyDocuments(companyDocs);
    } catch {
      setDocuments([]);
      setCompanyDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, [seller]);

  useEffect(() => {
    if (tab === 'documents') loadDocuments();
  }, [tab, loadDocuments]);

  if (!seller) return null;

  const toggleActive = async () => {
    setToggling(true);
    const newValue = !isActive;
    setOptimisticActive(newValue);
    try {
      await sellers.toggleActive(seller.id, newValue);
      await silentReload();
    } catch {
      setOptimisticActive(!newValue);
    } finally {
      setOptimisticActive(null);
      setToggling(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setConfigStatus(null);
    try {
      await sellers.update(seller.id, {
        agentName,
        voiceId: voiceId || undefined,
      });
      setConfigStatus({ type: 'success', msg: 'Configurações salvas!' });
      silentReload();
    } catch (err: unknown) {
      setConfigStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Erro ao salvar' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocStatus(null);
    setLoadingDoc(true);
    try {
      await sellers.uploadDocument(seller.id, text);
      setDocStatus({ type: 'success', msg: 'Documento enviado!' });
      setText('');
      loadDocuments();
    } catch (err: unknown) {
      setDocStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Erro ao enviar' });
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Remover este documento?')) return;
    setDeletingId(docId);
    try {
      await sellers.deleteDocument(seller.id, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setDocStatus({ type: 'success', msg: 'Documento removido.' });
    } catch (err: unknown) {
      setDocStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Erro ao remover' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleTabChange = (newTab: Tab) => {
    if (newTab === tab) return;
    setAnimKey(++tabKey);
    setTab(newTab);
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'config', label: 'Configurações', icon: '⚙️' },
    { key: 'documents', label: 'Documentos', icon: '📄' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-navy mb-1">Copilot</h2>
          <p className="text-text-muted text-sm">Configure e gerencie seu agente de IA.</p>
        </div>
        <button
          onClick={toggleActive}
          disabled={toggling}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-full border-2 transition-all duration-300 cursor-pointer disabled:opacity-50 ${
            isActive
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-border bg-surface text-text-muted'
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-wide">
            {isActive ? 'Ativo' : 'Inativo'}
          </span>
          <span
            className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
              isActive ? 'bg-success' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${
                isActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </span>
        </button>
      </div>

      {/* Tabs */}
      <div className="relative flex gap-1 bg-surface border border-border rounded-xl p-1 mb-8">
        <span
          className="absolute top-1 bottom-1 rounded-lg bg-white shadow-md transition-all duration-300 ease-out"
          style={{
            width: `calc(50% - 4px)`,
            left: tab === 'config' ? '4px' : 'calc(50% + 0px)',
          }}
        />
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
              tab === key
                ? 'text-navy'
                : 'text-text-muted hover:text-navy'
            }`}
          >
            <span className="text-base">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Config Tab */}
      {tab === 'config' && (
        <div key={`config-${animKey}`} className="animate-tab-enter">
          {configStatus && (
            <StatusBanner status={configStatus} onDismiss={() => setConfigStatus(null)} />
          )}

          <form onSubmit={handleSaveConfig} className="space-y-6">
            {/* Identity Section */}
            <section className="bg-white border border-border rounded-2xl p-6 shadow-sm animate-fade-in-up">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-lg">🤖</span>
                <h3 className="text-sm font-bold text-navy">Identidade</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Nome do Agente
                  </label>
                  <input className={inputCls} value={agentName} onChange={(e) => setAgentName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Voice ID (ElevenLabs)
                  </label>
                  <input className={inputCls} value={voiceId} onChange={(e) => setVoiceId(e.target.value)} placeholder="Opcional — habilita respostas em áudio" />
                </div>
              </div>
            </section>

            {/* Save Button */}
            <div className="flex justify-end animate-fade-in-up" style={{ animationDelay: '80ms' }}>
              <button
                type="submit"
                disabled={saving}
                className={`group flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 ${
                  saving
                    ? 'bg-navy/70 text-white'
                    : 'bg-navy-dark text-white hover:bg-accent hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]'
                }`}
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Configurações'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Documents Tab */}
      {tab === 'documents' && (
        <div key={`docs-${animKey}`} className="animate-tab-enter">
          {docStatus && (
            <StatusBanner status={docStatus} onDismiss={() => setDocStatus(null)} />
          )}

          <form onSubmit={handleSubmitDoc} className="bg-white border border-border rounded-2xl p-6 shadow-sm mb-6 animate-fade-in-up">
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
                    onClick={() => handleDeleteDoc(doc.id)}
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
        </div>
      )}
    </div>
  );
}
