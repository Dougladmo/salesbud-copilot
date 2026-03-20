import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { sellers, companies } from '../../api/client';
import type { Seller, CreateSellerDto, Company } from '../../types';
import { SellerForm } from '../../components/sellers/SellerForm';
import { SellerTable } from '../../components/sellers/SellerTable';

const empty: CreateSellerDto = {
  companyId: '',
  name: '',
  agentName: '',
};

export default function Sellers() {
  const [list, setList] = useState<Seller[]>([]);
  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [form, setForm] = useState<CreateSellerDto>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const load = () => {
    sellers.list().then(setList).catch((e) => toast.error(e.message));
    companies.list().then(setCompanyList).catch((e) => toast.error(e instanceof Error ? e.message : 'Erro ao carregar empresas'));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        const { companyId: _, ...rest } = form;
        await sellers.update(editId, rest);
        toast.success('Vendedor atualizado!');
      } else {
        await sellers.create(form);
        toast.success('Vendedor criado!');
      }
      setForm(empty);
      setEditId(null);
      setShowAdvanced(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro desconhecido');
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
      traitFormality: s.traitFormality,
      traitHumor: s.traitHumor,
      traitCommunication: s.traitCommunication,
      traitEmpathy: s.traitEmpathy,
      traitSelling: s.traitSelling,
      customPrompt: s.customPrompt || undefined,
      voiceId: s.voiceId || undefined,
      maxMemoryMessages: s.maxMemoryMessages,
      isActive: s.isActive,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      await sellers.delete(id);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir vendedor');
    }
  };

  const toggleCopilot = async (s: Seller) => {
    try {
      await sellers.toggleActive(s.id, !s.isActive);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar status');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-navy mb-5">Vendedores</h2>
      <SellerForm
        form={form}
        editId={editId}
        companyList={companyList}
        showAdvanced={showAdvanced}
        onSubmit={handleSubmit}
        onChange={(partial) => setForm({ ...form, ...partial })}
        onCancel={() => { setEditId(null); setForm(empty); setShowAdvanced(false); }}
        onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
      />
      <SellerTable
        list={list}
        onEdit={startEdit}
        onDelete={handleDelete}
        onToggleCopilot={toggleCopilot}
      />
    </div>
  );
}
