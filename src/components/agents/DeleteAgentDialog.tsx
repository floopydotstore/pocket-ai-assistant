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
import { useAgentStore } from '@/store/agentStore';
import { type Agent } from '@/types/agent';
import { toast } from 'sonner';

interface DeleteAgentDialogProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAgentDialog({ agent, open, onOpenChange }: DeleteAgentDialogProps) {
  const deleteAgent = useAgentStore((s) => s.deleteAgent);

  const handleDelete = () => {
    if (!agent) return;
    
    deleteAgent(agent.id);
    toast.success(`"${agent.name}" deleted`);
    onOpenChange(false);
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
