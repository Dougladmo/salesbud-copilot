import { useState, useEffect, useCallback } from 'react';
import { Snowflake, Sun, Flame } from 'lucide-react';
import { leads } from '../../api/client';
import type { Lead, LeadStatus, LeadTemperature } from '../../types';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

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

const temperatureConfig: Record<LeadTemperature, { label: string; color: string; icon: LucideIcon }> = {
  cold: { label: 'Frio', color: 'bg-blue-500', icon: Snowflake },
  warm: { label: 'Morno', color: 'bg-yellow-500', icon: Sun },
  hot: { label: 'Quente', color: 'bg-red-500', icon: Flame },
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
  if (!items || items.length === 0) {
    return <span className="text-muted-foreground text-xs italic">{emptyText}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <Badge key={i} variant="secondary" className="text-xs font-normal">
          {item}
        </Badge>
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
      <div className="p-4 space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-4 text-center text-muted-foreground text-xs">
        Nenhum lead encontrado para este contato
      </div>
    );
  }

  const currentStageIndex = funnelStages.indexOf(lead.status);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">{lead.name || lead.phone}</h3>
        <p className="text-xs text-muted-foreground">{lead.phone}</p>
      </div>

      {/* Temperature */}
      <div>
        <Label className="text-[10px] uppercase tracking-wider mb-1.5 block">
          Temperatura {saving && <span className="text-pink">salvando...</span>}
        </Label>
        <div className="flex gap-1.5">
          {(Object.keys(temperatureConfig) as LeadTemperature[]).map((temp) => {
            const cfg = temperatureConfig[temp];
            const isActive = lead.temperature === temp;
            return (
              <Button
                key={temp}
                variant="outline"
                size="sm"
                onClick={() => updateField('temperature', temp)}
                className={cn(
                  'gap-1 text-xs',
                  isActive && `${cfg.color} text-white border-transparent hover:text-white hover:${cfg.color}`
                )}
              >
                <cfg.icon className="size-3" />
                {cfg.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Funnel Stage */}
      <div>
        <Label className="text-[10px] uppercase tracking-wider mb-1.5 block">
          Etapa do Funil
        </Label>
        <div className="flex flex-col gap-1">
          {funnelStages.map((stage, i) => {
            const isActive = lead.status === stage;
            const isPast = i < currentStageIndex;
            return (
              <Button
                key={stage}
                variant="outline"
                size="sm"
                onClick={() => updateField('status', stage)}
                className={cn(
                  'justify-start gap-2 text-xs',
                  isActive && `${statusColors[stage]} border-transparent font-bold`,
                  isPast && 'bg-muted text-muted-foreground'
                )}
              >
                <span className={cn(
                  'size-2 rounded-full shrink-0',
                  isActive ? 'bg-current' : isPast ? 'bg-muted-foreground/40' : 'bg-border'
                )} />
                {statusLabels[stage]}
              </Button>
            );
          })}
          {lead.status === 'lost' && (
            <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold', statusColors.lost)}>
              <span className="size-2 rounded-full bg-current shrink-0" />
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
        <Label className="text-[10px] uppercase tracking-wider mb-1.5 block">
          Tomador de Decisao
        </Label>
        <div className="flex gap-1.5">
          {[
            { value: true, label: 'Sim' },
            { value: false, label: 'Nao' },
          ].map((opt) => (
            <Button
              key={String(opt.value)}
              variant="outline"
              size="sm"
              onClick={() => updateField('isDecisionMaker', opt.value)}
              className={cn(
                'text-xs',
                lead.isDecisionMaker === opt.value && 'bg-pink text-white border-transparent hover:bg-pink-hover hover:text-white'
              )}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Budget & Timeline */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] uppercase tracking-wider mb-1 block">Orcamento</Label>
          <p className="text-xs text-foreground">{lead.budget || '-'}</p>
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider mb-1 block">Timeline</Label>
          <p className="text-xs text-foreground">{lead.timeline || '-'}</p>
        </div>
      </div>

      {/* Qualification Summary */}
      {lead.qualificationSummary && (
        <div>
          <Label className="text-[10px] uppercase tracking-wider mb-1 block">
            Resumo da Qualificacao
          </Label>
          <p className="text-xs text-foreground bg-muted rounded-lg p-2 leading-relaxed">
            {lead.qualificationSummary}
          </p>
        </div>
      )}

      {/* Pain Points */}
      <div>
        <Label className="text-[10px] uppercase tracking-wider mb-1 block">Dores</Label>
        <TagList items={lead.painPoints} emptyText="Nenhuma identificada" />
      </div>

      {/* Interests */}
      <div>
        <Label className="text-[10px] uppercase tracking-wider mb-1 block">Interesses</Label>
        <TagList items={lead.interests} emptyText="Nenhum identificado" />
      </div>

      {/* Expectations */}
      <div>
        <Label className="text-[10px] uppercase tracking-wider mb-1 block">Expectativas</Label>
        <TagList items={lead.expectations} emptyText="Nenhuma identificada" />
      </div>

      {/* Objections */}
      <div>
        <Label className="text-[10px] uppercase tracking-wider mb-1 block">Objecoes</Label>
        <TagList items={lead.objections} emptyText="Nenhuma identificada" />
      </div>

      {/* Notes */}
      <div>
        <Label className="text-[10px] uppercase tracking-wider mb-1 block">Notas</Label>
        {editingNotes ? (
          <div className="flex flex-col gap-1.5">
            <Textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              rows={3}
              className="text-xs resize-none"
            />
            <div className="flex gap-1.5">
              <Button size="sm" onClick={saveNotes} className="text-[10px] bg-pink hover:bg-pink-hover">
                Salvar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEditingNotes(false); setNotesValue(lead.notes || ''); }}
                className="text-[10px]"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingNotes(true)}
            className="w-full text-left text-xs text-foreground bg-muted rounded-lg p-2 leading-relaxed cursor-pointer border border-transparent hover:border-border transition"
          >
            {lead.notes || <span className="text-muted-foreground italic">Clique para adicionar notas...</span>}
          </button>
        )}
      </div>

      {/* Timestamps */}
      <Separator />
      <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
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
  );
}
