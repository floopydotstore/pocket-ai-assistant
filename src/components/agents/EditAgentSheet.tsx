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
  
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([500]);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setPrompt(agent.prompt);
      setTemperature([agent.temperature]);
      setMaxTokens([agent.maxTokens]);
      setIsPublic(agent.isPublic ?? false);
    }
  }, [agent]);

  const template = agent ? TEMPLATES.find((t) => t.id === agent.template) : null;

  const handleSave = async () => {
    if (!agent) return;
    
    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    await updateAgent(agent.id, {
      name: name.trim(),
      prompt,
      temperature: temperature[0],
      maxTokens: maxTokens[0],
      isPublic,
    });
    
    toast.success('Agent updated');
    onOpenChange(false);
  };

  if (!agent) return null;

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
              <span className="text-sm font-medium text-primary">{temperature[0].toFixed(1)}</span>
            </div>
            <Slider
              value={temperature}
              onValueChange={setTemperature}
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
              <span className="text-sm font-medium text-primary">{maxTokens[0]} tokens</span>
            </div>
            <Slider
              value={maxTokens}
              onValueChange={setMaxTokens}
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
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row gap-3 pt-4 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="hero" className="flex-1" onClick={handleSave}>
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
