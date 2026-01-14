import { Clock, Trash2, Play, ChevronRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAgentStore } from '@/store/agentStore';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export default function TaskHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const history = useAgentStore((s) => s.history);
  const deleteHistoryEntry = useAgentStore((s) => s.deleteHistoryEntry);
  const clearHistory = useAgentStore((s) => s.clearHistory);
  const agents = useAgentStore((s) => s.agents);
useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleRerun = (entry: typeof history[0]) => {
    const agent = agents.find((a) => a.id === entry.agentId);
    if (agent) {
      navigate(`/chat/${agent.id}`);
    } else {
      toast({
        description: 'Agent no longer exists',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteHistoryEntry(id);
    toast({ description: 'Entry deleted' });
  };

  const handleClearAll = () => {
    clearHistory();
    toast({ description: 'History cleared' });
  };

  return (
    <div className="min-h-screen bg-background safe-area-top">
      {/* Header */}
      <header className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">History</h1>
            <p className="text-muted-foreground text-sm">Your past agent runs</p>
          </div>
          {history.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive">
                  Clear all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your task history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground">
                    Clear all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="px-5 pb-24">
        {history.length === 0 ? (
          <EmptyHistory />
        ) : (
          <div className="space-y-3">
            {history.map((entry, index) => (
              <Card
                key={entry.id}
                variant="default"
                className="animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium truncate">
                        {entry.agentName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <Clock className="w-3 h-3" />
                        {formatTime(entry.timestamp)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRerun(entry)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Input</p>
                      <p className="line-clamp-2">{entry.input}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-accent/50">
                      <p className="text-xs text-muted-foreground mb-1">Output</p>
                      <p className="line-clamp-3">{entry.output}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-6">
        <FileText className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2 text-foreground">No history yet</h2>
      <p className="text-muted-foreground max-w-xs">
        Your agent run history will appear here after you start using your agents.
      </p>
    </div>
  );
}
