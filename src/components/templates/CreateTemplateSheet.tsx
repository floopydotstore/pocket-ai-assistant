import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const EMOJI_OPTIONS = ['🤖', '📝', '✉️', '🔍', '📋', '✅', '💡', '🎯', '📊', '🚀', '💬', '🔧'];

interface CreateTemplateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateTemplateSheet({ open, onOpenChange, onCreated }: CreateTemplateSheetProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🤖');
  const [samplePrompt, setSamplePrompt] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [category, setCategory] = useState('Custom');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setIcon('🤖');
    setSamplePrompt('');
    setSampleOutput('');
    setCategory('Custom');
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to create templates');
      return;
    }

    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('user_templates').insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        icon,
        sample_prompt: samplePrompt.trim() || null,
        sample_output: sampleOutput.trim() || null,
        category: category.trim() || 'Custom',
      });

      if (error) throw error;

      toast.success('Template created');
      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      console.error('Failed to create template:', err);
      toast.error('Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>Create Template</SheetTitle>
          <SheetDescription>Create a reusable template for your agents</SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    icon === emoji
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                      : 'bg-muted hover:bg-accent'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name">Template name</Label>
            <Input
              id="template-name"
              placeholder="e.g., Code Reviewer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Input
              id="template-description"
              placeholder="What does this template do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="template-category">Category</Label>
            <Input
              id="template-category"
              placeholder="e.g., Productivity, Development"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Sample Prompt */}
          <div className="space-y-2">
            <Label htmlFor="template-prompt">Sample prompt (optional)</Label>
            <textarea
              id="template-prompt"
              placeholder="Example prompt to show users..."
              value={samplePrompt}
              onChange={(e) => setSamplePrompt(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Sample Output */}
          <div className="space-y-2">
            <Label htmlFor="template-output">Sample output (optional)</Label>
            <textarea
              id="template-output"
              placeholder="Example of what the agent might respond..."
              value={sampleOutput}
              onChange={(e) => setSampleOutput(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <SheetFooter className="flex-row gap-3 pt-4 border-t border-border">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button variant="hero" className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? 'Creating...' : 'Create Template'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
