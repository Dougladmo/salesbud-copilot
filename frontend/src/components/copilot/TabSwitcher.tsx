export type Tab = 'config' | 'documents';

export function TabSwitcher({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { key: Tab; label: string; icon: string }[];
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <div className="relative flex gap-1 bg-surface border border-border rounded-xl p-1 mb-8">
      <span
        className="absolute top-1 bottom-1 rounded-lg bg-white shadow-md transition-all duration-300 ease-out"
        style={{
          width: `calc(50% - 4px)`,
          left: activeTab === 'config' ? '4px' : 'calc(50% + 0px)',
        }}
      />
      {tabs.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
            activeTab === key
              ? 'text-navy'
              : 'text-text-muted hover:text-navy'
          }`}
        >
          <span className="text-base">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
}
