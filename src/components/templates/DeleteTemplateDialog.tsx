import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { UserTemplate } from '@/pages/Templates';

interface DeleteTemplateDialogProps {
  template: UserTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteTemplateDialog({ template, open, onOpenChange, onDeleted }: DeleteTemplateDialogProps) {
  const { user } = useAuth();

  const handleDelete = async () => {
    if (!template || !user) return;

    try {
      const { error } = await supabase
        .from('user_templates')
        .delete()
        .eq('id', template.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(`"${template.name}" deleted`);
      onOpenChange(false);
      onDeleted?.();
    } catch (err) {
      console.error('Failed to delete template:', err);
      toast.error('Failed to delete template');
    }
  };

  if (!template) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{template.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this template. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
