// src/pages/Dashboard.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Play,
  Clock,
  Bot,
  Pencil,
  Trash2,
  MoreVertical,
  Globe,
  Lock,
  Users,
} from 'lucide-react';
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
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { EditAgentSheet } from '@/components/agents/EditAgentSheet';
import { DeleteAgentDialog } from '@/components/agents/DeleteAgentDialog';

// Agent type used by the component (maps DB fields to camelCase)
export type Agent = {
  id: string;
  name: string;
  template: string;
  userId: string;
  isPublic: boolean;
  lastRunAt?: string | null;
  runCount?: number | null;
  createdAt?: string | null;
};

const mapRowToAgent = (row: any): Agent => ({
  id: row.id,
  name: row.name,
  template: row.template,
  userId: row.user_id ?? row.userId ?? row.user,
  isPublic: !!(row.is_public ?? row.isPublic),
  lastRunAt: row.last_run_at ?? row.lastRunAt ?? null,
  runCount: row.run_count ?? row.runCount ?? 0,
  createdAt: row.created_at ?? row.createdAt ?? null,
});

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [deleteAgentState, setDeleteAgentState] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userAgents, setUserAgents] = useState<Agent[]>([]);
  const [publicAgents, setPublicAgents] = useState<Agent[]>([]);
  const [activeTab, setActiveTab] = useState<'my-agents' | 'public-agents'>(() =>
    user ? 'my-agents' : 'public-agents'
  );

  // keep tab synced to auth state (if user logs out -> show public)
  useEffect(() => {
    setActiveTab(user ? 'my-agents' : 'public-agents');
  }, [user]);

  // fetch user's agents
  const fetchUserAgents = useCallback(async () => {
    if (!user) {
      setUserAgents([]);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserAgents((data ?? []).map(mapRowToAgent));
    } catch (err) {
      console.error('Error fetching user agents', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // fetch public agents
  const fetchPublicAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(200); // limit to avoid huge payloads
      if (error) throw error;
      setPublicAgents((data ?? []).map(mapRowToAgent));
    } catch (err) {
      console.error('Error fetching public agents', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // initial and on-user-change load
  useEffect(() => {
    // Always fetch public agents
    fetchPublicAgents();
    console.log('====================================');
    console.log(filteredPublicAgents.length);
    console.log('====================================');

    // fetch user agents only if logged in
    if (user) {
      fetchUserAgents();
    } else {
      setUserAgents([]);
    }
    // we intentionally do not add fetchUserAgents/fetchPublicAgents to deps (callbacks are stable)
  }, [user, fetchPublicAgents, fetchUserAgents]);

  // listen to realtime changes on agents table to keep lists fresh (optional)
  useEffect(() => {
    const subscription = supabase
      .channel('public:agents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agents' },
        () => {
          fetchPublicAgents();
          if (user) fetchUserAgents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, fetchPublicAgents, fetchUserAgents]);

  const filteredUserAgents = userAgents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.template.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPublicAgents = publicAgents
  // if user is logged in, exclude their own public agents; if not logged in, keep all public agents
  .filter((a) => (user ? a.userId !== user.id : true))  // ← Changed false to true
  .filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.template.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Template helper — you likely have this constant elsewhere
  const TEMPLATES = [
    { id: 'default', name: 'Default', icon: '🤖' },
    // Add your templates...
  ];
  const getTemplateInfo = (templateId: string) =>
    TEMPLATES.find((t) => t.id === templateId) ?? { id: templateId, name: templateId, icon: '🤖' };

  const formatLastRun = (dateString?: string | null) => {
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

  // update agent (used when running to update lastRunAt/runCount)
  const updateAgentRun = async (agentId: string) => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('agents')
        .update({ last_run_at: now })
        .eq('id', agentId)
        .select();
      if (error) throw error;
      fetchPublicAgents();
      if (user) fetchUserAgents();
      return data?.[0] ? mapRowToAgent(data[0]) : null;
    } catch (err) {
      console.error('Error updating agent run', err);
      return null;
    }
  };

  const handleQuickRun = async (agentId: string, isOwner: boolean) => {
    if (isOwner) {
      await updateAgentRun(agentId);
    }
    navigate(`/chat/${agentId}`);
  };

  const onAgentEdited = async () => {
    await fetchPublicAgents();
    if (user) await fetchUserAgents();
    setEditAgent(null);
  };

  const onAgentDeleted = async () => {
    await fetchPublicAgents();
    if (user) await fetchUserAgents();
    setDeleteAgentState(null);
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
                <CardDescription className="text-xs">{template?.name || agent.template}</CardDescription>
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
                <span>{agent.runCount ?? 0} runs</span>
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

  // Skeleton card to show while loading
  const renderSkeletonCard = (key: string | number) => (
    <div
      key={key}
      role="status"
      aria-busy="true"
      className="animate-slide-up"
      style={{ animationDelay: `${Number(key) * 30}ms` }}
    >
      <div className="flex items-start justify-between p-4 rounded-lg border border-border bg-card animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gray-300 dark:bg-gray-700" />
          <div className="space-y-2">
            <div className="w-40 h-4 rounded bg-gray-300 dark:bg-gray-700" />
            <div className="w-28 h-3 rounded bg-gray-200 dark:bg-gray-600 mt-2" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-8 rounded bg-gray-300 dark:bg-gray-700" />
          <div className="w-8 h-8 rounded bg-gray-300 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background safe-area-top">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pocket Agent</h1>
            <p className="text-muted-foreground text-sm">Your AI assistants</p>
          </div>
          <img src="/app-icon.png" alt="app-icon" className="h-10 w-10" />
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
        
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            {/* Show "My Agents" tab only when logged in */}
            <TabsList className="w-full mb-4">
              {user ? (
                <TabsTrigger value="my-agents" className="flex-1 gap-2">
                  <Lock className="w-4 h-4" />
                  My Agents
                  {userAgents.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {userAgents.length}
                    </Badge>
                  )}
                </TabsTrigger>
              ) : null}
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

            {user && (
              <TabsContent value="my-agents" className="mt-0">
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => renderSkeletonCard(`user-${i}`))}
                  </div>
                ) : filteredUserAgents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                      <Bot className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground mb-4">
                      {userAgents.length === 0 ? "You haven't created any agents yet" : 'No agents match your search'}
                    </p>
                    {userAgents.length === 0 && (
                      <Button variant="hero" onClick={() => navigate('/create')}>
                        <Plus className="w-4 h-4" />
                        Create Agent
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUserAgents.map((agent, index) => renderAgentCard(agent, index, true))}
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent value="public-agents" className="mt-0">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => renderSkeletonCard(`public-${i}`))}
                </div>
              ) : filteredPublicAgents.length === 0 ? (
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
                  {filteredPublicAgents.map((agent, index) => {
                    const isOwner = agent.userId === user?.id;
                    return renderAgentCard(agent, index, isOwner);
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        
      </main>

      <EditAgentSheet
        agent={editAgent}
        open={!!editAgent}
        onOpenChange={(open) => {
          if (!open) setEditAgent(null);
        }}
        onSaved={() => onAgentEdited()}
      />

      <DeleteAgentDialog
        agent={deleteAgentState}
        open={!!deleteAgentState}
        onOpenChange={(open) => {
          if (!open) setDeleteAgentState(null);
        }}
        onDeleted={() => onAgentDeleted()}
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
