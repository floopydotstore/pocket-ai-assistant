import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Sparkles, AlertCircle, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useAgentSync } from '@/hooks/useAgentSync';
import { TEMPLATES, type AgentTemplate, type Agent } from '@/types/agent';
import { cn } from '@/lib/utils';

type WizardStep = 'template' | 'name' | 'settings' | 'confirm';

const STEPS: WizardStep[] = ['template', 'name', 'settings', 'confirm'];

export default function CreateAgent() {
  const navigate = useNavigate();
  const { createAgent } = useAgentSync();
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [agentName, setAgentName] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([500]);
  const [isPublic, setIsPublic] = useState(false);

  const stepIndex = STEPS.indexOf(currentStep);
  const template = TEMPLATES.find((t) => t.id === selectedTemplate);

  const canProceed = () => {
    switch (currentStep) {
      case 'template':
        return selectedTemplate !== null;
      case 'name':
        return agentName.trim().length >= 2;
      case 'settings':
        return true;
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 'confirm') {
      handleCreate();
      return;
    }
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      navigate(-1);
      return;
    }
    setCurrentStep(STEPS[stepIndex - 1]);
  };

  const handleCreate = async () => {
    if (!selectedTemplate || !template) return;

    // Generate UUID compatible with all environments
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const newAgent: Agent = {
      id: generateUUID(),
      name: agentName.trim(),
      template: selectedTemplate,
      prompt: customPrompt || template.samplePrompt,
      temperature: temperature[0],
      maxTokens: maxTokens[0],
      createdAt: new Date().toISOString(),
      runCount: 0,
      isPublic,
    };

    await createAgent(newAgent);
    navigate(`/chat/${newAgent.id}`);
  };

  return (
    <div className="min-h-screen bg-background safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-semibold text-foreground">Create Agent</h1>
          <p className="text-xs text-muted-foreground">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full gradient-primary transition-all duration-300"
          style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <main className="px-5 py-6 pb-32">
        {currentStep === 'template' && (
          <TemplateStep
            selected={selectedTemplate}
            onSelect={(t) => {
              setSelectedTemplate(t);
              const tmpl = TEMPLATES.find((x) => x.id === t);
              if (tmpl) setCustomPrompt(tmpl.samplePrompt);
            }}
          />
        )}

        {currentStep === 'name' && (
          <NameStep
            name={agentName}
            prompt={customPrompt}
            onNameChange={setAgentName}
            onPromptChange={setCustomPrompt}
            template={template}
          />
        )}

        {currentStep === 'settings' && (
          <SettingsStep
            temperature={temperature}
            maxTokens={maxTokens}
            isPublic={isPublic}
            onTemperatureChange={setTemperature}
            onMaxTokensChange={setMaxTokens}
            onPublicChange={setIsPublic}
          />
        )}

        {currentStep === 'confirm' && (
          <ConfirmStep
            name={agentName}
            template={template}
            prompt={customPrompt}
            temperature={temperature[0]}
            maxTokens={maxTokens[0]}
            isPublic={isPublic}
          />
        )}
      </main>

      {/* Bottom action */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-background border-t border-border safe-area-bottom">
        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {currentStep === 'confirm' ? (
            <>
              <Check className="w-5 h-5" />
              Create & Run
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function TemplateStep({
  selected,
  onSelect,
}: {
  selected: AgentTemplate | null;
  onSelect: (t: AgentTemplate) => void;
}) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-semibold mb-2">Choose a template</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Select a template to get started. You can customize it later.
      </p>
      <div className="space-y-3">
        {TEMPLATES.map((template, index) => (
          <Card
            key={template.id}
            variant={selected === template.id ? 'elevated' : 'interactive'}
            className={cn(
              'animate-slide-up',
              selected === template.id && 'border-primary ring-2 ring-primary/20'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => onSelect(template.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-2xl">
                  {template.icon}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-xs">{template.description}</CardDescription>
                </div>
                {selected === template.id && (
                  <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NameStep({
  name,
  prompt,
  onNameChange,
  onPromptChange,
  template,
}: {
  name: string;
  prompt: string;
  onNameChange: (v: string) => void;
  onPromptChange: (v: string) => void;
  template?: typeof TEMPLATES[0];
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold mb-2">Name your agent</h2>
        <p className="text-muted-foreground text-sm">
          Give your agent a name and customize its behavior.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Agent name</Label>
          <Input
            id="name"
            placeholder="e.g., My Email Helper"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt">System prompt</Label>
          <textarea
            id="prompt"
            placeholder="Instructions for the agent..."
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            Default: {template?.samplePrompt}
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingsStep({
  temperature,
  maxTokens,
  isPublic,
  onTemperatureChange,
  onMaxTokensChange,
  onPublicChange,
}: {
  temperature: number[];
  maxTokens: number[];
  isPublic: boolean;
  onTemperatureChange: (v: number[]) => void;
  onMaxTokensChange: (v: number[]) => void;
  onPublicChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold mb-2">Runtime settings</h2>
        <p className="text-muted-foreground text-sm">
          Adjust how the AI generates responses.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Creativity</Label>
            <span className="text-sm font-medium text-primary">{temperature[0].toFixed(1)}</span>
          </div>
          <Slider
            value={temperature}
            onValueChange={onTemperatureChange}
            max={1}
            min={0}
            step={0.1}
            className="py-2"
          />
          <p className="text-xs text-muted-foreground">
            Lower = more focused, higher = more creative
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Response length</Label>
            <span className="text-sm font-medium text-primary">{maxTokens[0]} tokens</span>
          </div>
          <Slider
            value={maxTokens}
            onValueChange={onMaxTokensChange}
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
            <Switch checked={isPublic} onCheckedChange={onPublicChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmStep({
  name,
  template,
  prompt,
  temperature,
  maxTokens,
  isPublic,
}: {
  name: string;
  template?: typeof TEMPLATES[0];
  prompt: string;
  temperature: number;
  maxTokens: number;
  isPublic: boolean;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold mb-2">Ready to create</h2>
        <p className="text-muted-foreground text-sm">Review your agent settings.</p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center text-3xl">
              {template?.icon || '🤖'}
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription>{template?.name}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">System prompt</p>
            <p className="text-sm line-clamp-3">{prompt}</p>
          </div>
          <div className="flex gap-4 text-sm flex-wrap">
            <span className="text-muted-foreground">
              Creativity: <span className="text-foreground font-medium">{temperature.toFixed(1)}</span>
            </span>
            <span className="text-muted-foreground">
              Max tokens: <span className="text-foreground font-medium">{maxTokens}</span>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              {isPublic ? (
                <>
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  <span className="text-primary font-medium">Public</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span className="text-foreground font-medium">Private</span>
                </>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card variant="ghost" className="p-4 bg-accent/50 border border-primary/20">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">Privacy notice</p>
            <p className="text-muted-foreground text-xs">
              Your agent data is stored locally on your device. Prompts are sent to the AI service
              for processing but are not stored permanently on external servers.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
