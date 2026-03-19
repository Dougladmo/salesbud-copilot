import { useState, useEffect } from 'react';
import { sellers } from '../../api/client';
import { useSeller } from '../../context/SellerContext';

const inputCls = 'bg-white border border-border rounded-lg px-3 py-2 text-sm text-navy outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition w-full';
const selectCls = inputCls;

export default function AgentConfig() {
  const { seller, reload } = useSeller();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [agentName, setAgentName] = useState('');
  const [traitFormality, setTraitFormality] = useState('informal');
  const [traitHumor, setTraitHumor] = useState('humorous');
  const [traitCommunication, setTraitCommunication] = useState('direct');
  const [traitEmpathy, setTraitEmpathy] = useState('empathetic');
  const [traitSelling, setTraitSelling] = useState('consultive');
  const [voiceId, setVoiceId] = useState('');

  useEffect(() => {
    if (!seller) return;
    setAgentName(seller.agentName);
    setTraitFormality(seller.traitFormality);
    setTraitHumor(seller.traitHumor);
    setTraitCommunication(seller.traitCommunication);
    setTraitEmpathy(seller.traitEmpathy);
    setTraitSelling(seller.traitSelling);
    setVoiceId(seller.voiceId || '');
  }, [seller]);

  if (!seller) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await sellers.update(seller.id, {
        agentName,
        traitFormality: traitFormality as 'formal' | 'informal',
        traitHumor: traitHumor as 'humorous' | 'serious',
        traitCommunication: traitCommunication as 'direct' | 'detailed',
        traitEmpathy: traitEmpathy as 'empathetic' | 'objective',
        traitSelling: traitSelling as 'consultive' | 'aggressive',
        voiceId: voiceId || undefined,
      });
      setStatus({ type: 'success', msg: 'Configurações salvas!' });
      reload();
    } catch (err: unknown) {
      setStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Erro ao salvar' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-navy mb-1">Meu Agente</h2>
      <p className="text-text-muted text-sm mb-6">Configure a personalidade e comportamento do seu agente de IA.</p>

      {status && (
        <div className={`px-4 py-3 rounded-lg mb-4 text-sm border ${
          status.type === 'success' ? 'bg-success/10 border-success text-success' : 'bg-danger/10 border-danger text-danger'
        }`}>
          {status.msg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identity */}
        <section className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">Identidade</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
              Nome do Agente
              <input className={inputCls} value={agentName} onChange={(e) => setAgentName(e.target.value)} required />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
              Voice ID (ElevenLabs)
              <input className={inputCls} value={voiceId} onChange={(e) => setVoiceId(e.target.value)} placeholder="Opcional" />
            </label>
          </div>
        </section>

        {/* Personality */}
        <section className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">Personalidade</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
              Formalidade
              <select className={selectCls} value={traitFormality} onChange={(e) => setTraitFormality(e.target.value)}>
                <option value="formal">Formal</option>
                <option value="informal">Informal</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
              Humor
              <select className={selectCls} value={traitHumor} onChange={(e) => setTraitHumor(e.target.value)}>
                <option value="humorous">Humorístico</option>
                <option value="serious">Sério</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
              Comunicação
              <select className={selectCls} value={traitCommunication} onChange={(e) => setTraitCommunication(e.target.value)}>
                <option value="direct">Direto</option>
                <option value="detailed">Detalhado</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
              Empatia
              <select className={selectCls} value={traitEmpathy} onChange={(e) => setTraitEmpathy(e.target.value)}>
                <option value="empathetic">Empático</option>
                <option value="objective">Objetivo</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
              Estilo de Venda
              <select className={selectCls} value={traitSelling} onChange={(e) => setTraitSelling(e.target.value)}>
                <option value="consultive">Consultivo</option>
                <option value="aggressive">Agressivo</option>
              </select>
            </label>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="bg-navy-dark text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-navy-light transition cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </form>
    </div>
  );
}
