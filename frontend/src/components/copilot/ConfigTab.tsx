import { Bot, Users, Loader2 } from 'lucide-react';
import { TraitCard, traitConfig } from './TraitCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

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
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bot className="size-4 text-muted-foreground" />
            Identidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="agentName">Nome do Agente</Label>
            <Input
              id="agentName"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up" style={{ animationDelay: '40ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="size-4 text-muted-foreground" />
            Personalidade
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Adapte o comportamento do seu copilot para ficar mais parecido com a forma que voce fala.
          </p>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <div className="flex justify-end animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <Button type="submit" disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configuracoes'
          )}
        </Button>
      </div>
    </form>
  );
}
