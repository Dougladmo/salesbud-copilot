export interface TraitOption {
  value: string;
  label: string;
  icon: string;
  desc: string;
}

export const traitConfig: {
  key: string;
  label: string;
  options: [TraitOption, TraitOption];
}[] = [
  {
    key: 'formality',
    label: 'Formalidade',
    options: [
      { value: 'formal', label: 'Formal', icon: '🎩', desc: 'Tom profissional e sério' },
      { value: 'informal', label: 'Informal', icon: '😎', desc: 'Tom descontraído e próximo' },
    ],
  },
  {
    key: 'humor',
    label: 'Humor',
    options: [
      { value: 'humorous', label: 'Humorístico', icon: '😄', desc: 'Usa humor para engajar' },
      { value: 'serious', label: 'Sério', icon: '📋', desc: 'Direto sem brincadeiras' },
    ],
  },
  {
    key: 'communication',
    label: 'Comunicação',
    options: [
      { value: 'direct', label: 'Direto', icon: '⚡', desc: 'Respostas curtas e objetivas' },
      { value: 'detailed', label: 'Detalhado', icon: '📖', desc: 'Explicações completas' },
    ],
  },
  {
    key: 'empathy',
    label: 'Empatia',
    options: [
      { value: 'empathetic', label: 'Empático', icon: '💛', desc: 'Acolhedor e compreensivo' },
      { value: 'objective', label: 'Objetivo', icon: '🎯', desc: 'Focado em fatos e dados' },
    ],
  },
  {
    key: 'selling',
    label: 'Estilo de Venda',
    options: [
      { value: 'consultive', label: 'Consultivo', icon: '🤝', desc: 'Guia o cliente com perguntas' },
      { value: 'aggressive', label: 'Agressivo', icon: '🚀', desc: 'Foco em fechamento rápido' },
    ],
  },
];

export function TraitCard({
  trait,
  value,
  onChange,
  index,
}: {
  trait: (typeof traitConfig)[number];
  value: string;
  onChange: (v: string) => void;
  index: number;
}) {
  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">{trait.label}</p>
      <div className="grid grid-cols-2 gap-2">
        {trait.options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => onChange(opt.value)}
              title={opt.desc}
              className={`group relative rounded-xl border-2 p-3 text-left transition-all duration-200 cursor-pointer flex flex-col ${
                active
                  ? 'border-accent bg-accent/5 shadow-sm shadow-accent/10'
                  : 'border-border bg-white hover:border-navy/30 hover:shadow-sm'
              }`}
            >
              <span className="text-lg mb-1">{opt.icon}</span>
              <span
                className={`text-sm font-semibold transition-colors duration-200 ${
                  active ? 'text-accent' : 'text-navy group-hover:text-navy-light'
                }`}
              >
                {opt.label}
              </span>
              <span className="text-[11px] text-text-muted leading-tight mt-1 line-clamp-1">{opt.desc}</span>
              {active && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
