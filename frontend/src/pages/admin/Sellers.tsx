import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { sellers } from '../../api/client';
import type { Seller, CreateSellerDto } from '../../types';
import { useSeller } from '../../context/SellerContext';
import { SellerForm } from '../../components/sellers/SellerForm';
import { SellerTable } from '../../components/sellers/SellerTable';

const empty: CreateSellerDto = {
  companyId: '',
  name: '',
  agentName: '',
};

export default function Sellers() {
  const { seller: currentSeller } = useSeller();
  const companyId = currentSeller?.companyId || '';

  const [list, setList] = useState<Seller[]>([]);
  const [form, setForm] = useState<CreateSellerDto>({ ...empty, companyId });
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const load = () => {
    sellers.list()
      .then((all) => setList(all.filter((s) => s.companyId === companyId)))
      .catch((e) => toast.error(e.message));
  };

  useEffect(() => {
    if (companyId) load();
  }, [companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        const { companyId: _, ...rest } = form;
        await sellers.update(editId, rest);
        toast.success('Vendedor atualizado!');
      } else {
        await sellers.create({ ...form, companyId });
        toast.success('Vendedor criado!');
      }
      setForm({ ...empty, companyId });
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
      <h2 className="text-2xl font-semibold text-navy mb-2">Vendedores</h2>
      <p className="text-text-muted text-sm mb-5">
        Gerencie os vendedores de <strong>{currentSeller?.company?.name}</strong>.
      </p>
      <SellerForm
        form={form}
        editId={editId}
        showAdvanced={showAdvanced}
        onSubmit={handleSubmit}
        onChange={(partial) => setForm({ ...form, ...partial })}
        onCancel={() => { setEditId(null); setForm({ ...empty, companyId }); setShowAdvanced(false); }}
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
