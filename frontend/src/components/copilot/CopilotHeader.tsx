import { Switch } from '@/components/ui/switch';

export function CopilotHeader({
  isActive,
  toggling,
  onToggle,
}: {
  isActive: boolean;
  toggling: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Copilot</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Configure e gerencie seu agente de IA.</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium ${isActive ? 'text-success' : 'text-muted-foreground'}`}>
          {isActive ? 'Ativo' : 'Inativo'}
        </span>
        <Switch
          checked={isActive}
          onCheckedChange={onToggle}
          disabled={toggling}
        />
      </div>
    </div>
  );
}
