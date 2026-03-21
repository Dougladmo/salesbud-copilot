import { TraitCard, traitConfig } from './TraitCard';

const inputCls =
  'bg-white border border-border rounded-lg px-4 py-2.5 text-sm text-navy outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 w-full placeholder:text-text-muted/50';

export function ConfigTab({
  agentName,
  setAgentName,
  traitValues,
  traitSetters,
  saving,
  onSave,
}: {
  agentName: string;
  setAgentName: (v: string) => void;
  traitValues: Record<string, string>;
  traitSetters: Record<string, (v: string) => void>;
  saving: boolean;
  onSave: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSave} className="space-y-6">
      <section className="bg-white border border-border rounded-2xl p-6 shadow-sm animate-fade-in-up">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-lg">🤖</span>
          <h3 className="text-sm font-bold text-navy">Identidade</h3>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">
            Nome do Agente
          </label>
          <input className={inputCls} value={agentName} onChange={(e) => setAgentName(e.target.value)} required />
        </div>
      </section>

      <section className="bg-white border border-border rounded-2xl p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '40ms' }}>
        <div className="flex items-center gap-2 mb-5">
          <span className="text-lg">🎭</span>
          <h3 className="text-sm font-bold text-navy">Personalidade</h3>
        </div>
        <p className="text-xs text-text-muted mb-5">Adapte o comportamento do seu copilot para ficar mais parecido com a forma que você fala.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {traitConfig.map((trait, i) => (
            <TraitCard
              key={trait.key}
              trait={trait}
              value={traitValues[trait.key]}
              onChange={(v) => traitSetters[trait.key](v)}
              index={i}
            />
          ))}
        </div>
      </section>

      <div className="flex justify-end animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <button
          type="submit"
          disabled={saving}
          className={`group flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 ${
            saving
              ? 'bg-navy/70 text-white'
              : 'bg-navy-dark text-white hover:bg-accent hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]'
          }`}
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configurações'
          )}
        </button>
      </div>
    </form>
  );
}
