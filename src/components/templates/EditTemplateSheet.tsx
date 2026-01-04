import { useState, useEffect } from 'react';
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
import type { UserTemplate } from '@/pages/Templates';

const EMOJI_OPTIONS = ['🤖', '📝', '✉️', '🔍', '📋', '✅', '💡', '🎯', '📊', '🚀', '💬', '🔧'];

interface EditTemplateSheetProps {
  template: UserTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function EditTemplateSheet({ template, open, onOpenChange, onSaved }: EditTemplateSheetProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🤖');
  const [samplePrompt, setSamplePrompt] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [category, setCategory] = useState('Custom');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setIcon(template.icon);
      setSamplePrompt(template.samplePrompt || '');
      setSampleOutput(template.sampleOutput || '');
      setCategory(template.category);
    }
  }, [template]);

  const handleSave = async () => {
    if (!user || !template) {
      return;
    }

    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_templates')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          icon,
          sample_prompt: samplePrompt.trim() || null,
          sample_output: sampleOutput.trim() || null,
          category: category.trim() || 'Custom',
        })
        .eq('id', template.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Template updated');
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      console.error('Failed to update template:', err);
      toast.error('Failed to update template');
    } finally {
      setSaving(false);
    }
  };

  if (!template) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>Edit Template</SheetTitle>
          <SheetDescription>Update your template settings</SheetDescription>
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
            <Label htmlFor="edit-template-name">Template name</Label>
            <Input
              id="edit-template-name"
              placeholder="e.g., Code Reviewer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-template-description">Description</Label>
            <Input
              id="edit-template-description"
              placeholder="What does this template do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="edit-template-category">Category</Label>
            <Input
              id="edit-template-category"
              placeholder="e.g., Productivity, Development"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Sample Prompt */}
          <div className="space-y-2">
            <Label htmlFor="edit-template-prompt">Sample prompt (optional)</Label>
            <textarea
              id="edit-template-prompt"
              placeholder="Example prompt to show users..."
              value={samplePrompt}
              onChange={(e) => setSamplePrompt(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Sample Output */}
          <div className="space-y-2">
            <Label htmlFor="edit-template-output">Sample output (optional)</Label>
            <textarea
              id="edit-template-output"
              placeholder="Example of what the agent might respond..."
              value={sampleOutput}
              onChange={(e) => setSampleOutput(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
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
