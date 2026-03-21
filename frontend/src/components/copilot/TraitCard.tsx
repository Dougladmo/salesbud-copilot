import type { LucideIcon } from 'lucide-react';
import {
  Crown,
  Smile,
  Laugh,
  ClipboardList,
  Zap,
  BookOpen,
  Heart,
  Target,
  Handshake,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export interface TraitOption {
  value: string;
  label: string;
  icon: LucideIcon;
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
      { value: 'formal', label: 'Formal', icon: Crown, desc: 'Tom profissional e serio' },
      { value: 'informal', label: 'Informal', icon: Smile, desc: 'Tom descontraido e proximo' },
    ],
  },
  {
    key: 'humor',
    label: 'Humor',
    options: [
      { value: 'humorous', label: 'Humoristico', icon: Laugh, desc: 'Usa humor para engajar' },
      { value: 'serious', label: 'Serio', icon: ClipboardList, desc: 'Direto sem brincadeiras' },
    ],
  },
  {
    key: 'communication',
    label: 'Comunicacao',
    options: [
      { value: 'direct', label: 'Direto', icon: Zap, desc: 'Respostas curtas e objetivas' },
      { value: 'detailed', label: 'Detalhado', icon: BookOpen, desc: 'Explicacoes completas' },
    ],
  },
  {
    key: 'empathy',
    label: 'Empatia',
    options: [
      { value: 'empathetic', label: 'Empatico', icon: Heart, desc: 'Acolhedor e compreensivo' },
      { value: 'objective', label: 'Objetivo', icon: Target, desc: 'Focado em fatos e dados' },
    ],
  },
  {
    key: 'selling',
    label: 'Estilo de Venda',
    options: [
      { value: 'consultive', label: 'Consultivo', icon: Handshake, desc: 'Guia o cliente com perguntas' },
      { value: 'aggressive', label: 'Agressivo', icon: Rocket, desc: 'Foco em fechamento rapido' },
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
      <Label className="text-xs uppercase tracking-wide mb-2 block">{trait.label}</Label>
      <div className="grid grid-cols-2 gap-2">
        {trait.options.map((opt) => {
          const active = value === opt.value;
          const Icon = opt.icon;
          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => onChange(opt.value)}
              title={opt.desc}
              className={cn(
                'group relative rounded-lg border p-3 text-left transition-all duration-200 cursor-pointer flex flex-col gap-1.5',
                active
                  ? 'border-pink bg-pink/5 shadow-sm'
                  : 'hover:border-muted-foreground/30 hover:shadow-sm'
              )}
            >
              <Icon className={cn(
                'size-4',
                active ? 'text-pink' : 'text-muted-foreground'
              )} />
              <span
                className={cn(
                  'text-sm font-medium transition-colors duration-200',
                  active ? 'text-pink' : 'text-foreground'
                )}
              >
                {opt.label}
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight line-clamp-1">
                {opt.desc}
              </span>
              {active && (
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-pink" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
