import { useEffect, useState } from 'react';
import { companies } from '../api/client';
import type { Company, CreateCompanyDto } from '../types';

const empty: CreateCompanyDto = {
  name: '',
  pineconeNamespace: '',
};

export default function Companies() {
  const [list, setList] = useState<Company[]>([]);
  const [form, setForm] = useState<CreateCompanyDto>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = () => companies.list().then(setList).catch((e) => setError(e.message));

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        await companies.update(editId, form);
      } else {
        await companies.create(form);
      }
      setForm(empty);
      setEditId(null);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
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
      <h2>Empresas</h2>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} className="form-card">
        <h3>{editId ? 'Editar Empresa' : 'Nova Empresa'}</h3>
        <div className="form-grid">
          <label>
            Nome
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Pinecone Namespace
            <input value={form.pineconeNamespace} onChange={(e) => setForm({ ...form, pineconeNamespace: e.target.value })} required />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit">{editId ? 'Salvar' : 'Criar'}</button>
          {editId && (
            <button type="button" className="btn-secondary" onClick={() => { setEditId(null); setForm(empty); }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Namespace</th>
            <th>Vendedores</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {list.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td><code>{c.pineconeNamespace}</code></td>
              <td>-</td>
              <td className="actions">
                <button className="btn-sm" onClick={() => startEdit(c)}>Editar</button>
                <button className="btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Excluir</button>
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr><td colSpan={4} className="empty">Nenhuma empresa cadastrada</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
