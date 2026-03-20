import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { sellers } from '../api/client';
import type { Seller } from '../types';

export function useCopilotConfig(seller: Seller | null, silentReload: () => void) {
  const [saving, setSaving] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [traitFormality, setTraitFormality] = useState('informal');
  const [traitHumor, setTraitHumor] = useState('humorous');
  const [traitCommunication, setTraitCommunication] = useState('direct');
  const [traitEmpathy, setTraitEmpathy] = useState('empathetic');
  const [traitSelling, setTraitSelling] = useState('consultive');
  const [voiceId, setVoiceId] = useState('');

  const traitSetters: Record<string, (v: string) => void> = {
    formality: setTraitFormality,
    humor: setTraitHumor,
    communication: setTraitCommunication,
    empathy: setTraitEmpathy,
    selling: setTraitSelling,
  };

  const traitValues: Record<string, string> = {
    formality: traitFormality,
    humor: traitHumor,
    communication: traitCommunication,
    empathy: traitEmpathy,
    selling: traitSelling,
  };

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

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;
    setSaving(true);
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
      toast.success('Configurações salvas!');
      silentReload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return {
    agentName,
    setAgentName,
    voiceId,
    setVoiceId,
    traitValues,
    traitSetters,
    saving,
    handleSaveConfig,
  };
}
