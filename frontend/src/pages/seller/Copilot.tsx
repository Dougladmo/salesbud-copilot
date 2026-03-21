import { useState, useEffect } from 'react';
import { Settings, FileText } from 'lucide-react';
import { sellers } from '../../api/client';
import { useSeller } from '../../context/SellerContext';
import { useCopilotConfig } from '../../hooks/useCopilotConfig';
import { useCopilotDocuments } from '../../hooks/useCopilotDocuments';
import { CopilotHeader } from '../../components/copilot/CopilotHeader';
import { ConfigTab } from '../../components/copilot/ConfigTab';
import { DocumentsTab } from '../../components/copilot/DocumentsTab';
import { cn } from '@/lib/utils';

type Tab = 'config' | 'documents';

const tabs: { key: Tab; label: string; icon: typeof Settings }[] = [
  { key: 'config', label: 'Configuracoes', icon: Settings },
  { key: 'documents', label: 'Documentos', icon: FileText },
];

export default function Copilot() {
  const { seller, silentReload } = useSeller();
  const [tab, setTab] = useState<Tab>('config');
  const [toggling, setToggling] = useState(false);
  const [optimisticActive, setOptimisticActive] = useState<boolean | null>(null);

  const isActive = optimisticActive ?? seller?.isActive ?? false;

  const config = useCopilotConfig(seller, silentReload);
  const docs = useCopilotDocuments(seller?.id, seller?.companyId);

  useEffect(() => {
    if (tab === 'documents') docs.loadDocuments();
  }, [tab, docs.loadDocuments]);

  if (!seller) return null;

  const toggleActive = async () => {
    setToggling(true);
    const newValue = !isActive;
    setOptimisticActive(newValue);
    try {
      await sellers.toggleActive(seller.id, newValue);
      await silentReload();
    } catch {
      setOptimisticActive(!newValue);
    } finally {
      setOptimisticActive(null);
      setToggling(false);
    }
  };

  const activeIndex = tabs.findIndex((t) => t.key === tab);

  return (
    <div className="animate-fade-in">
      <CopilotHeader isActive={isActive} toggling={toggling} onToggle={toggleActive} />

      {/* Tab Switcher with sliding animation */}
      <div className="relative flex bg-muted rounded-xl p-1 mb-8">
        <span
          className="absolute top-1 bottom-1 rounded-lg bg-background shadow-sm transition-all duration-300 ease-out"
          style={{
            width: `calc(${100 / tabs.length}% - 4px)`,
            left: `calc(${activeIndex * (100 / tabs.length)}% + 2px)`,
          }}
        />
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'relative z-10 flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer',
              tab === key
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'config' && (
        <div className="animate-tab-enter">
          <ConfigTab
            agentName={config.agentName}
            setAgentName={config.setAgentName}
            traitValues={config.traitValues}
            traitSetters={config.traitSetters}
            saving={config.saving}
            onSave={config.handleSaveConfig}
          />
        </div>
      )}

      {tab === 'documents' && (
        <div className="animate-tab-enter">
          <DocumentsTab
            documents={docs.documents}
            companyDocuments={docs.companyDocuments}
            text={docs.text}
            setText={docs.setText}
            loadingDoc={docs.loadingDoc}
            loadingDocs={docs.loadingDocs}
            deletingId={docs.deletingId}
            onSubmitDoc={docs.handleSubmitDoc}
            onDeleteDoc={docs.handleDeleteDoc}
          />
        </div>
      )}
    </div>
  );
}
