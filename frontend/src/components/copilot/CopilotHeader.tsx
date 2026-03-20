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
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-2xl font-bold text-navy mb-1">Copilot</h2>
        <p className="text-text-muted text-sm">Configure e gerencie seu agente de IA.</p>
      </div>
      <button
        onClick={onToggle}
        disabled={toggling}
        className={`flex items-center gap-2.5 px-4 py-2 rounded-full border-2 transition-all duration-300 cursor-pointer disabled:opacity-50 ${
          isActive
            ? 'border-success/30 bg-success/10 text-success'
            : 'border-border bg-surface text-text-muted'
        }`}
      >
        <span className="text-xs font-semibold uppercase tracking-wide">
          {isActive ? 'Ativo' : 'Inativo'}
        </span>
        <span
          className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
            isActive ? 'bg-success' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${
              isActive ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </span>
      </button>
    </div>
  );
}
