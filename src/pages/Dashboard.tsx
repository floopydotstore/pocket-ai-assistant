import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Play, Clock, Bot, Pencil, Trash2, MoreVertical, Globe, Lock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAgentStore } from '@/store/agentStore';
import { useAgentSync } from '@/hooks/useAgentSync';
import { useAuth } from '@/hooks/useAuth';
import { TEMPLATES, type Agent } from '@/types/agent';
import { EditAgentSheet } from '@/components/agents/EditAgentSheet';
import { DeleteAgentDialog } from '@/components/agents/DeleteAgentDialog';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [deleteAgentState, setDeleteAgentState] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [publicAgents, setPublicAgents] = useState<Agent[]>([]);
  const agents = useAgentStore((s) => s.agents);
  const { updateAgent, loadFromCloud, fetchPublicAgents, shouldSync } = useAgentSync();

  // Load agents from cloud on mount if sync is enabled
  useEffect(() => {
    if (shouldSync) {
      setIsLoading(true);
      Promise.all([loadFromCloud(), fetchPublicAgents().then(setPublicAgents)])
        .finally(() => setIsLoading(false));
    }
  }, [shouldSync, loadFromCloud, fetchPublicAgents]);

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.template.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPublicAgents = publicAgents
    .filter((agent) => agent.userId !== user?.id) // Exclude user's own agents from public list
    .filter(
      (agent) =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.template.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getTemplateInfo = (templateId: string) => {
    return TEMPLATES.find((t) => t.id === templateId);
  };

  const handleQuickRun = async (agentId: string, isOwner: boolean) => {
    if (isOwner) {
      await updateAgent(agentId, { lastRunAt: new Date().toISOString() });
    }
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

  const renderAgentCard = (agent: Agent, index: number, isOwner: boolean) => {
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
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                  {agent.isPublic && (
                    <Badge variant="secondary" className="text-xs gap-1 h-5">
                      <Globe className="w-3 h-3" />
                      Public
                    </Badge>
                  )}
                </div>
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
                  handleQuickRun(agent.id, isOwner);
                }}
                className="h-8 gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                Run
              </Button>
              {isOwner && (
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
                        setDeleteAgentState(agent);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {isOwner && (
              <>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatLastRun(agent.lastRunAt)}
                </span>
                <span>{agent.runCount} runs</span>
              </>
            )}
            {!isOwner && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Community agent
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
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
        {agents.length === 0 && publicAgents.length === 0 ? (
          <EmptyState onCreateClick={() => navigate('/create')} />
        ) : (
          <Tabs defaultValue="my-agents" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="my-agents" className="flex-1 gap-2">
                <Lock className="w-4 h-4" />
                My Agents
                {agents.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {agents.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="public-agents" className="flex-1 gap-2">
                <Globe className="w-4 h-4" />
                Public
                {filteredPublicAgents.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {filteredPublicAgents.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-agents" className="mt-0">
              {filteredAgents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {agents.length === 0 ? "You haven't created any agents yet" : 'No agents match your search'}
                  </p>
                  {agents.length === 0 && (
                    <Button variant="hero" onClick={() => navigate('/create')}>
                      <Plus className="w-4 h-4" />
                      Create Agent
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAgents.map((agent, index) => renderAgentCard(agent, index, true))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="public-agents" className="mt-0">
              {filteredPublicAgents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    {publicAgents.length === 0 ? 'No public agents available yet' : 'No public agents match your search'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Create your first public agent to share with the community!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPublicAgents.map((agent, index) => renderAgentCard(agent, index, false))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <EditAgentSheet
        agent={editAgent}
        open={!!editAgent}
        onOpenChange={(open) => !open && setEditAgent(null)}
      />
      
      <DeleteAgentDialog
        agent={deleteAgentState}
        open={!!deleteAgentState}
        onOpenChange={(open) => !open && setDeleteAgentState(null)}
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