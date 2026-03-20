import type { CreateSellerDto } from '../../types';

const inputCls = 'bg-white border border-border rounded-lg px-3 py-2 text-sm text-navy outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition';
const selectCls = inputCls;

export function SellerAdvancedFields({
  form,
  onChange,
}: {
  form: CreateSellerDto;
  onChange: (partial: Partial<CreateSellerDto>) => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
          Pinecone Namespace
          <input className={inputCls} value={form.pineconeNamespace || ''} onChange={(e) => onChange({ pineconeNamespace: e.target.value || undefined })} placeholder="Auto-gerado se vazio" />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
          Voice ID (ElevenLabs)
          <input className={inputCls} value={form.voiceId || ''} onChange={(e) => onChange({ voiceId: e.target.value || undefined })} placeholder="Opcional — habilita respostas em áudio" />
        </label>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Personalidade</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
            Formalidade
            <select className={selectCls} value={form.traitFormality || 'informal'} onChange={(e) => onChange({ traitFormality: e.target.value as 'formal' | 'informal' })}>
              <option value="formal">Formal</option>
              <option value="informal">Informal</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
            Humor
            <select className={selectCls} value={form.traitHumor || 'humorous'} onChange={(e) => onChange({ traitHumor: e.target.value as 'humorous' | 'serious' })}>
              <option value="humorous">Humorístico</option>
              <option value="serious">Sério</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
            Comunicação
            <select className={selectCls} value={form.traitCommunication || 'direct'} onChange={(e) => onChange({ traitCommunication: e.target.value as 'direct' | 'detailed' })}>
              <option value="direct">Direto</option>
              <option value="detailed">Detalhado</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
            Empatia
            <select className={selectCls} value={form.traitEmpathy || 'empathetic'} onChange={(e) => onChange({ traitEmpathy: e.target.value as 'empathetic' | 'objective' })}>
              <option value="empathetic">Empático</option>
              <option value="objective">Objetivo</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
            Estilo de Venda
            <select className={selectCls} value={form.traitSelling || 'consultive'} onChange={(e) => onChange({ traitSelling: e.target.value as 'consultive' | 'aggressive' })}>
              <option value="consultive">Consultivo</option>
              <option value="aggressive">Agressivo</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
          Memória de Contexto (mensagens)
          <input type="number" className={inputCls} value={form.maxMemoryMessages ?? 200} onChange={(e) => onChange({ maxMemoryMessages: Number(e.target.value) || 200 })} min={10} max={1000} />
          <span className="text-[10px] text-text-muted/60">Quantidade de mensagens mantidas no histórico da conversa (padrão: 200)</span>
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted col-span-full">
        Prompt Customizado
        <textarea
          className={`${inputCls} resize-y`}
          rows={3}
          value={form.customPrompt || ''}
          onChange={(e) => onChange({ customPrompt: e.target.value || undefined })}
        />
      </label>
    </div>
  );
}
