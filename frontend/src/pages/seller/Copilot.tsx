import { useState, useEffect } from 'react';
import { Settings, FileText } from 'lucide-react';
import { sellers } from '../../api/client';
import { useSeller } from '../../context/SellerContext';
import { useCopilotConfig } from '../../hooks/useCopilotConfig';
import { useCopilotDocuments } from '../../hooks/useCopilotDocuments';
import { CopilotHeader } from '../../components/copilot/CopilotHeader';
import { ConfigTab } from '../../components/copilot/ConfigTab';
import { DocumentsTab } from '../../components/copilot/DocumentsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Tab = 'config' | 'documents';

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

  return (
    <div className="animate-fade-in">
      <CopilotHeader isActive={isActive} toggling={toggling} onToggle={toggleActive} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="w-full mb-8">
          <TabsTrigger value="config" className="flex-1 gap-2">
            <Settings className="size-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex-1 gap-2">
            <FileText className="size-4" />
            Documentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="animate-fade-in-up">
          <ConfigTab
            agentName={config.agentName}
            setAgentName={config.setAgentName}
            traitValues={config.traitValues}
            traitSetters={config.traitSetters}
            saving={config.saving}
            onSave={config.handleSaveConfig}
          />
        </TabsContent>

        <TabsContent value="documents" className="animate-fade-in-up">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
