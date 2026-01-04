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
import { useAgentSync } from '@/hooks/useAgentSync';
import { toast } from 'sonner';

interface AgentForDelete {
  id: string;
  name: string;
}

interface DeleteAgentDialogProps {
  agent: AgentForDelete | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteAgentDialog({ agent, open, onOpenChange, onDeleted }: DeleteAgentDialogProps) {
  const { deleteAgent } = useAgentSync();

  const handleDelete = async () => {
    if (!agent) return;
    
    await deleteAgent(agent.id);
    toast.success(`"${agent.name}" deleted`);
    onOpenChange(false);
    onDeleted?.();
  };

  if (!agent) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{agent.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this agent and all its conversation history. This action cannot be undone.
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
