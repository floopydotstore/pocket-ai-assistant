// src/components/agents/EditAgentSheet.tsx
import { useState, useEffect } from 'react';
import { Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { useAgentSync } from '@/hooks/useAgentSync';
import { TEMPLATES, type Agent } from '@/types/agent';
import { toast } from 'sonner';

interface EditAgentSheetProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAgentSheet({ agent, open, onOpenChange }: EditAgentSheetProps) {
  const { updateAgent } = useAgentSync();

  // default sensible values
  const DEFAULT_TEMPERATURE = 0.7;
  const DEFAULT_MAX_TOKENS = 500;

  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [temperature, setTemperature] = useState<number[]>([DEFAULT_TEMPERATURE]);
  const [maxTokens, setMaxTokens] = useState<number[]>([DEFAULT_MAX_TOKENS]);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (agent) {
      setName(agent.name ?? '');
      setPrompt(agent.prompt ?? '');
      // defensive fallbacks if DB values are null/undefined
      setTemperature([typeof agent.temperature === 'number' ? agent.temperature : DEFAULT_TEMPERATURE]);
      setMaxTokens([typeof agent.maxTokens === 'number' ? agent.maxTokens : DEFAULT_MAX_TOKENS]);
      setIsPublic(Boolean(agent.isPublic));
    } else {
      // reset when no agent
      setName('');
      setPrompt('');
      setTemperature([DEFAULT_TEMPERATURE]);
      setMaxTokens([DEFAULT_MAX_TOKENS]);
      setIsPublic(false);
    }
  }, [agent]);

  const template = agent ? TEMPLATES.find((t) => t.id === agent.template) ?? null : null;

  const handleSave = async () => {
    if (!agent) return;

    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    setSaving(true);
    try {
      await updateAgent(agent.id, {
        name: name.trim(),
        prompt: prompt ?? '',
        temperature: (temperature?.[0] ?? DEFAULT_TEMPERATURE),
        maxTokens: (maxTokens?.[0] ?? DEFAULT_MAX_TOKENS),
        isPublic,
      });

      toast.success('Agent updated');
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to update agent', err);
      toast.error('Failed to save agent. See console for details.');
    } finally {
      setSaving(false);
    }
  };

  if (!agent) return null;

  // safe values for display
  const displayTemp = (typeof temperature?.[0] === 'number' ? temperature[0] : DEFAULT_TEMPERATURE);
  const displayMaxTokens = (typeof maxTokens?.[0] === 'number' ? maxTokens[0] : DEFAULT_MAX_TOKENS);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-xl">
              {template?.icon || '🤖'}
            </div>
            <div>
              <SheetTitle>Edit Agent</SheetTitle>
              <SheetDescription>{template?.name || agent.template}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Agent name</Label>
            <Input
              id="edit-name"
              placeholder="e.g., My Email Helper"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="edit-prompt">System prompt</Label>
            <textarea
              id="edit-prompt"
              placeholder="Instructions for the agent..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Temperature */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Creativity</Label>
              <span className="text-sm font-medium text-primary">{displayTemp.toFixed(1)}</span>
            </div>
            <Slider
              value={temperature}
              onValueChange={(v: number[]) => setTemperature(v)}
              max={1}
              min={0}
              step={0.1}
              className="py-2"
            />
            <p className="text-xs text-muted-foreground">
              Lower = more focused, higher = more creative
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Response length</Label>
              <span className="text-sm font-medium text-primary">{displayMaxTokens} tokens</span>
            </div>
            <Slider
              value={maxTokens}
              onValueChange={(v: number[]) => setMaxTokens(v)}
              max={2000}
              min={100}
              step={100}
              className="py-2"
            />
            <p className="text-xs text-muted-foreground">
              Approximate maximum length of the response
            </p>
          </div>

          {/* Visibility */}
          <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="w-5 h-5 text-primary" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <Label className="text-base">Make agent public</Label>
                  <p className="text-xs text-muted-foreground">
                    {isPublic ? 'Anyone can see and use this agent' : 'Only you can access this agent'}
                  </p>
                </div>
              </div>
              <Switch checked={isPublic} onCheckedChange={(v) => setIsPublic(Boolean(v))} />
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row gap-3 pt-4 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="hero" className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
