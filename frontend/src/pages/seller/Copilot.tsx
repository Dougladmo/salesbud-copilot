import { useState, useEffect } from 'react';
import { sellers } from '../../api/client';
import { useSeller } from '../../context/SellerContext';
import { useCopilotConfig } from '../../hooks/useCopilotConfig';
import { useCopilotDocuments } from '../../hooks/useCopilotDocuments';
import { CopilotHeader } from '../../components/copilot/CopilotHeader';
import { TabSwitcher, type Tab } from '../../components/copilot/TabSwitcher';
import { ConfigTab } from '../../components/copilot/ConfigTab';
import { DocumentsTab } from '../../components/copilot/DocumentsTab';

let tabKeyCounter = 0;

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'config', label: 'Configurações', icon: '⚙️' },
  { key: 'documents', label: 'Documentos', icon: '📄' },
];

export default function Copilot() {
  const { seller, silentReload } = useSeller();
  const [tab, setTab] = useState<Tab>('config');
  const [animKey, setAnimKey] = useState(0);
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

  const handleTabChange = (newTab: Tab) => {
    if (newTab === tab) return;
    setAnimKey(++tabKeyCounter);
    setTab(newTab);
  };

  return (
    <div className="animate-fade-in">
      <CopilotHeader isActive={isActive} toggling={toggling} onToggle={toggleActive} />
      <TabSwitcher tabs={tabs} activeTab={tab} onTabChange={handleTabChange} />

      {tab === 'config' && (
        <div key={`config-${animKey}`} className="animate-tab-enter">
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
        <div key={`docs-${animKey}`} className="animate-tab-enter">
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
