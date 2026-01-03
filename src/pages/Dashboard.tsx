import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Play, Clock, Bot, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAgentStore } from '@/store/agentStore';
import { TEMPLATES, type Agent } from '@/types/agent';
import { EditAgentSheet } from '@/components/agents/EditAgentSheet';
import { DeleteAgentDialog } from '@/components/agents/DeleteAgentDialog';

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null);
  const agents = useAgentStore((s) => s.agents);
  const updateAgent = useAgentStore((s) => s.updateAgent);

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.template.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTemplateInfo = (templateId: string) => {
    return TEMPLATES.find((t) => t.id === templateId);
  };

  const handleQuickRun = (agentId: string) => {
    updateAgent(agentId, { lastRunAt: new Date().toISOString() });
    navigate(`/chat/${agentId}`);
  };

  const formatLastRun = (dateString?: string) => {
    if (!dateString) return 'Never run';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-background safe-area-top">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">PocketAgent</h1>
            <p className="text-muted-foreground text-sm">Your AI assistants</p>
          </div>
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-secondary/50 border-0"
          />
        </div>
      </header>

      {/* Content */}
      <main className="px-5 pb-24">
        {agents.length === 0 ? (
          <EmptyState onCreateClick={() => navigate('/create')} />
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No agents match your search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAgents.map((agent, index) => {
              const template = getTemplateInfo(agent.template);
              return (
                <Card
                  key={agent.id}
                  variant="interactive"
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/chat/${agent.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center text-xl">
                          {template?.icon || '🤖'}
                        </div>
                        <div>
                          <CardTitle className="text-base">{agent.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {template?.name || agent.template}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="soft"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickRun(agent.id);
                          }}
                          className="h-8 gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Run
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditAgent(agent);
                              }}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteAgent(agent);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatLastRun(agent.lastRunAt)}
                      </span>
                      <span>{agent.runCount} runs</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <EditAgentSheet
        agent={editAgent}
        open={!!editAgent}
        onOpenChange={(open) => !open && setEditAgent(null)}
      />
      
      <DeleteAgentDialog
        agent={deleteAgent}
        open={!!deleteAgent}
        onOpenChange={(open) => !open && setDeleteAgent(null)}
      />
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center mb-6">
        <Bot className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2 text-foreground">No agents yet</h2>
      <p className="text-muted-foreground mb-6 max-w-xs">
        Create your first AI agent to start automating micro-tasks
      </p>
      <Button variant="hero" size="lg" onClick={onCreateClick}>
        <Plus className="w-5 h-5" />
        Create Agent
      </Button>
    </div>
  );
}
