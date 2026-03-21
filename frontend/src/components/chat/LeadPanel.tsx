import { useState, useEffect, useCallback } from 'react';
import { leads } from '../../api/client';
import type { Lead, LeadStatus, LeadTemperature } from '../../types';

const statusLabels: Record<LeadStatus, string> = {
  new: 'Novo',
  contacted: 'Contactado',
  qualified: 'Qualificado',
  scheduled: 'Agendado',
  converted: 'Convertido',
  lost: 'Perdido',
};

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  scheduled: 'bg-indigo-100 text-indigo-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

const temperatureConfig: Record<LeadTemperature, { label: string; color: string; icon: string }> = {
  cold: { label: 'Frio', color: 'bg-blue-500', icon: '❄️' },
  warm: { label: 'Morno', color: 'bg-yellow-500', icon: '☀️' },
  hot: { label: 'Quente', color: 'bg-red-500', icon: '🔥' },
};

const funnelStages: LeadStatus[] = ['new', 'contacted', 'qualified', 'scheduled', 'converted'];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TagList({ items, emptyText }: { items: string[] | null; emptyText: string }) {
  if (!items || items.length === 0) return <span className="text-text-muted text-xs italic">{emptyText}</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span key={i} className="bg-surface-hover border border-border px-2 py-0.5 rounded text-xs text-text">
          {item}
        </span>
      ))}
    </div>
  );
}

export function LeadPanel({
  sellerId,
  remoteJid,
}: {
  sellerId: string;
  remoteJid: string;
}) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  const loadLead = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leads.findByJid(sellerId, remoteJid);
      setLead(data);
      setNotesValue(data?.notes || '');
    } catch {
      setLead(null);
    } finally {
      setLoading(false);
    }
  }, [sellerId, remoteJid]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  const updateField = async (field: string, value: unknown) => {
    if (!lead) return;
    setSaving(true);
    try {
      const updated = await leads.update(lead.id, { [field]: value } as Partial<Lead>);
      setLead(updated);
    } catch {
      // silent fail
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    await updateField('notes', notesValue || null);
    setEditingNotes(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-4 text-center text-text-muted text-xs">
        Nenhum lead encontrado para este contato
      </div>
    );
  }

  const currentStageIndex = funnelStages.indexOf(lead.status);

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-navy">{lead.name || lead.phone}</h3>
        <p className="text-xs text-text-muted">{lead.phone}</p>
      </div>

      {/* Temperature */}
      <div>
        <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
          Temperatura {saving && <span className="text-accent">salvando...</span>}
        </label>
        <div className="flex gap-1.5">
          {(Object.keys(temperatureConfig) as LeadTemperature[]).map((temp) => {
            const cfg = temperatureConfig[temp];
            const isActive = lead.temperature === temp;
            return (
              <button
                key={temp}
                onClick={() => updateField('temperature', temp)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                  isActive
                    ? `${cfg.color} text-white border-transparent`
                    : 'bg-white border-border text-text-muted hover:bg-surface-hover'
                }`}
              >
                <span>{cfg.icon}</span>
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Funnel Stage */}
      <div>
        <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
          Etapa do Funil
        </label>
        <div className="flex flex-col gap-1">
          {funnelStages.map((stage, i) => {
            const isActive = lead.status === stage;
            const isPast = i < currentStageIndex;
            return (
              <button
                key={stage}
                onClick={() => updateField('status', stage)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                  isActive
                    ? `${statusColors[stage]} border-transparent font-bold`
                    : isPast
                      ? 'bg-surface-hover border-border text-text-muted'
                      : 'bg-white border-border text-text-muted hover:bg-surface-hover'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  isActive ? 'bg-current' : isPast ? 'bg-text-muted/40' : 'bg-border'
                }`} />
                {statusLabels[stage]}
              </button>
            );
          })}
          {lead.status === 'lost' && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${statusColors.lost}`}>
              <span className="w-2 h-2 rounded-full bg-current shrink-0" />
              {statusLabels.lost}
            </div>
          )}
        </div>
        {lead.status !== 'lost' && (
          <button
            onClick={() => updateField('status', 'lost')}
            className="mt-1.5 text-[10px] text-red-400 hover:text-red-600 transition cursor-pointer bg-transparent border-none"
          >
            Marcar como perdido
          </button>
        )}
      </div>

      {/* Decision Maker */}
      <div>
        <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
          Tomador de Decisao
        </label>
        <div className="flex gap-1.5">
          {[
            { value: true, label: 'Sim' },
            { value: false, label: 'Nao' },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => updateField('isDecisionMaker', opt.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                lead.isDecisionMaker === opt.value
                  ? 'bg-accent text-white border-transparent'
                  : 'bg-white border-border text-text-muted hover:bg-surface-hover'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Budget & Timeline */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1 block">
            Orcamento
          </label>
          <p className="text-xs text-text">{lead.budget || '-'}</p>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1 block">
            Timeline
          </label>
          <p className="text-xs text-text">{lead.timeline || '-'}</p>
        </div>
      </div>

      {/* Qualification Summary */}
      {lead.qualificationSummary && (
        <div>
          <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1 block">
            Resumo da Qualificacao
          </label>
          <p className="text-xs text-text bg-surface-hover rounded-lg p-2 leading-relaxed">
            {lead.qualificationSummary}
          </p>
        </div>
      )}

      {/* Pain Points */}
      <div>
        <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1 block">
          Dores
        </label>
        <TagList items={lead.painPoints} emptyText="Nenhuma identificada" />
      </div>

      {/* Interests */}
      <div>
        <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1 block">
          Interesses
        </label>
        <TagList items={lead.interests} emptyText="Nenhum identificado" />
      </div>

      {/* Expectations */}
      <div>
        <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1 block">
          Expectativas
        </label>
        <TagList items={lead.expectations} emptyText="Nenhuma identificada" />
      </div>

      {/* Objections */}
      <div>
        <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1 block">
          Objecoes
        </label>
        <TagList items={lead.objections} emptyText="Nenhuma identificada" />
      </div>

      {/* Notes */}
      <div>
        <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1 block">
          Notas
        </label>
        {editingNotes ? (
          <div className="flex flex-col gap-1.5">
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-border rounded-lg bg-white resize-none focus:outline-none focus:border-accent"
              rows={3}
            />
            <div className="flex gap-1.5">
              <button
                onClick={saveNotes}
                className="px-2.5 py-1 bg-accent text-white text-[10px] rounded-lg font-medium cursor-pointer border-none hover:bg-accent-hover transition"
              >
                Salvar
              </button>
              <button
                onClick={() => { setEditingNotes(false); setNotesValue(lead.notes || ''); }}
                className="px-2.5 py-1 bg-surface-hover text-text-muted text-[10px] rounded-lg font-medium cursor-pointer border border-border hover:bg-border transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingNotes(true)}
            className="w-full text-left text-xs text-text bg-surface-hover rounded-lg p-2 leading-relaxed cursor-pointer border border-transparent hover:border-border transition"
          >
            {lead.notes || <span className="text-text-muted italic">Clique para adicionar notas...</span>}
          </button>
        )}
      </div>

      {/* Timestamps */}
      <div className="border-t border-border pt-3 mt-1">
        <div className="grid grid-cols-2 gap-2 text-[10px] text-text-muted">
          <div>
            <span className="font-semibold uppercase">Ultimo contato</span>
            <p>{formatDate(lead.lastContactAt)}</p>
          </div>
          <div>
            <span className="font-semibold uppercase">Criado em</span>
            <p>{formatDate(lead.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
