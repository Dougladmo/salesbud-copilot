import { useEffect, useState } from 'react';
import { sellers, companies } from '../api/client';
import type { Seller, CreateSellerDto, Company } from '../types';

const empty: CreateSellerDto = {
  companyId: '',
  name: '',
  agentName: '',
};

const inputCls = 'bg-white border border-border rounded-lg px-3 py-2 text-sm text-navy outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition';
const btnPrimary = 'bg-navy-dark text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-navy-light transition cursor-pointer';
const btnSecondary = 'bg-surface-hover text-text-muted px-5 py-2 rounded-full text-sm font-medium hover:bg-border transition cursor-pointer';
const btnSmPrimary = 'bg-navy-dark text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-navy-light transition cursor-pointer';
const btnSmDanger = 'bg-danger text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-danger-hover transition cursor-pointer';

export default function Sellers() {
  const [list, setList] = useState<Seller[]>([]);
  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [form, setForm] = useState<CreateSellerDto>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    sellers.list().then(setList).catch((e) => setError(e.message));
    companies.list().then(setCompanyList).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        const { companyId: _, ...rest } = form;
        await sellers.update(editId, rest);
      } else {
        await sellers.create(form);
      }
      setForm(empty);
      setEditId(null);
      setShowAdvanced(false);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  const startEdit = (s: Seller) => {
    setEditId(s.id);
    setShowAdvanced(true);
    setForm({
      companyId: s.companyId,
      name: s.name,
      agentName: s.agentName,
      pineconeNamespace: s.pineconeNamespace || undefined,
      voiceId: s.voiceId || undefined,
      maxMemoryMessages: s.maxMemoryMessages,
      isActive: s.isActive,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    await sellers.delete(id);
    load();
  };

  const toggleCopilot = async (s: Seller) => {
    try {
      await sellers.toggleActive(s.id, !s.isActive);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-navy mb-5">Vendedores</h2>
      {error && (
        <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-text-muted mb-4 uppercase tracking-wide">
          {editId ? 'Editar Vendedor' : 'Novo Vendedor'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
            Empresa
            <select className={inputCls} value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })} required disabled={!!editId}>
              <option value="">Selecione...</option>
              {companyList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
            Nome
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
            Nome do Agente
            <input className={inputCls} value={form.agentName} onChange={(e) => setForm({ ...form, agentName: e.target.value })} required />
          </label>
        </div>

        <button
          type="button"
          className="text-accent text-xs font-medium mt-3 hover:text-accent-hover transition cursor-pointer bg-transparent border-none"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? '▼ Ocultar configurações avançadas' : '▶ Configurações avançadas'}
        </button>

        {showAdvanced && (
          <div className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
                Pinecone Namespace
                <input className={inputCls} value={form.pineconeNamespace || ''} onChange={(e) => setForm({ ...form, pineconeNamespace: e.target.value || undefined })} placeholder="Auto-gerado se vazio" />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
                Voice ID (ElevenLabs)
                <input className={inputCls} value={form.voiceId || ''} onChange={(e) => setForm({ ...form, voiceId: e.target.value || undefined })} placeholder="Opcional — habilita respostas em áudio" />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
                Memória de Contexto (mensagens)
                <input type="number" className={inputCls} value={form.maxMemoryMessages ?? 200} onChange={(e) => setForm({ ...form, maxMemoryMessages: Number(e.target.value) || 200 })} min={10} max={1000} />
                <span className="text-[10px] text-text-muted/60">Quantidade de mensagens mantidas no histórico da conversa (padrão: 200)</span>
              </label>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button type="submit" className={btnPrimary}>{editId ? 'Salvar' : 'Criar'}</button>
          {editId && (
            <button type="button" className={btnSecondary} onClick={() => { setEditId(null); setForm(empty); setShowAdvanced(false); }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-hover">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Agente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Empresa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Copilot</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-surface-hover transition">
                  <td className="px-4 py-3 text-sm text-navy font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-sm text-text-muted">{s.agentName}</td>
                  <td className="px-4 py-3 text-sm text-text-muted">{s.company?.name || s.companyId.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                        s.isActive
                          ? 'bg-success text-white hover:bg-success-hover'
                          : 'bg-text-muted text-white hover:bg-gray-500'
                      }`}
                      onClick={() => toggleCopilot(s)}
                      title={s.isActive ? 'Clique para desligar' : 'Clique para ligar'}
                    >
                      {s.isActive ? 'ON' : 'OFF'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className={btnSmPrimary} onClick={() => startEdit(s)}>Editar</button>
                      <button className={btnSmDanger} onClick={() => handleDelete(s.id)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-text-muted text-sm">
                    Nenhum vendedor cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
