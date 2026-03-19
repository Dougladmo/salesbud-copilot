import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { companies } from '../../api/client';
import type { Company, CreateCompanyDto } from '../../types';

const empty: CreateCompanyDto = {
  name: '',
  pineconeNamespace: '',
};

export default function Companies() {
  const [list, setList] = useState<Company[]>([]);
  const [form, setForm] = useState<CreateCompanyDto>(empty);
  const [editId, setEditId] = useState<string | null>(null);

  const load = () => companies.list().then(setList).catch((e) => toast.error(e.message));

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await companies.update(editId, form);
        toast.success('Empresa atualizada!');
      } else {
        await companies.create(form);
        toast.success('Empresa criada!');
      }
      setForm(empty);
      setEditId(null);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  const startEdit = (c: Company) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      pineconeNamespace: c.pineconeNamespace,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    await companies.delete(id);
    load();
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-navy mb-5">Empresas</h2>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-text-muted mb-4 uppercase tracking-wide">
          {editId ? 'Editar Empresa' : 'Nova Empresa'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
            Nome
            <input
              className="bg-white border border-border rounded-lg px-3 py-2 text-sm text-navy outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
            Pinecone Namespace
            <input
              className="bg-white border border-border rounded-lg px-3 py-2 text-sm text-navy outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition"
              value={form.pineconeNamespace}
              onChange={(e) => setForm({ ...form, pineconeNamespace: e.target.value })}
              required
            />
          </label>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            className="bg-navy-dark text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-navy-light transition cursor-pointer"
          >
            {editId ? 'Salvar' : 'Criar'}
          </button>
          {editId && (
            <button
              type="button"
              className="bg-surface-hover text-text-muted px-5 py-2 rounded-full text-sm font-medium hover:bg-border transition cursor-pointer"
              onClick={() => { setEditId(null); setForm(empty); }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-hover">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Namespace</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Vendedores</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-surface-hover transition">
                <td className="px-4 py-3 text-sm text-navy font-medium">{c.name}</td>
                <td className="px-4 py-3 text-sm">
                  <code className="bg-white border border-border px-2 py-0.5 rounded text-xs text-text-muted">{c.pineconeNamespace}</code>
                </td>
                <td className="px-4 py-3 text-sm text-text-muted">-</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      className="bg-navy-dark text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-navy-light transition cursor-pointer"
                      onClick={() => startEdit(c)}
                    >
                      Editar
                    </button>
                    <button
                      className="bg-danger text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-danger-hover transition cursor-pointer"
                      onClick={() => handleDelete(c.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-text-muted text-sm">
                  Nenhuma empresa cadastrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
