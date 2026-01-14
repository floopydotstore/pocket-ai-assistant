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
  Heart,
  Copy,
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
import { TEMPLATES, type Agent } from '@/types/agent';
import { toast } from 'sonner';

// Extended agent type with DB fields
type DashboardAgent = Agent & {
  creatorName?: string | null;
  likesCount?: number;
  isLiked?: boolean;
};

const mapRowToAgent = (row: any, userId?: string, likes?: { agent_id: string; user_id: string }[]): DashboardAgent => ({
  id: row.id,
  name: row.name,
  template: row.template,
  prompt: row.prompt ?? '',
  temperature: row.temperature ?? 0.7,
  maxTokens: row.max_tokens ?? 500,
  userId: row.user_id ?? row.userId ?? row.user,
  isPublic: !!(row.is_public ?? row.isPublic),
  lastRunAt: row.last_run_at ?? row.lastRunAt ?? undefined,
  runCount: row.run_count ?? row.runCount ?? 0,
  createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  creatorName: row.creator_name ?? null,
  likesCount: row.likes_count ?? 0,
  isLiked: likes?.some(l => l.agent_id === row.id && l.user_id === userId) ?? false,
});

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [editAgent, setEditAgent] = useState<DashboardAgent | null>(null);
  const [deleteAgentState, setDeleteAgentState] = useState<DashboardAgent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userAgents, setUserAgents] = useState<DashboardAgent[]>([]);
  const [publicAgents, setPublicAgents] = useState<DashboardAgent[]>([]);
  const [userLikes, setUserLikes] = useState<{ agent_id: string; user_id: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'my-agents' | 'public-agents'>(() =>
    user ? 'my-agents' : 'public-agents'
  );
   useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  // Keep tab synced to auth state
  useEffect(() => {
    if (!user) {
      setActiveTab('public-agents');
    }
  }, [user]);

  // Fetch user likes
  const fetchUserLikes = useCallback(async () => {
    if (!user) {
      setUserLikes([]);
      return [];
    }
    
    const { data, error } = await supabase
      .from('agent_likes')
      .select('agent_id, user_id')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching likes:', error);
      return [];
    }
    
    setUserLikes(data || []);
    return data || [];
  }, [user]);

  // Fetch user's agents with likes counts
  const fetchUserAgents = useCallback(async () => {
    if (!user) {
      setUserAgents([]);
      return;
    }
    setIsLoading(true);
    try {
      const likes = await fetchUserLikes();
      
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch likes counts for user's agents
      const agentIds = (data ?? []).map(a => a.id);
      let likesCountMap: Record<string, number> = {};
      
      if (agentIds.length > 0) {
        const { data: likesData } = await supabase
          .from('agent_likes')
          .select('agent_id')
          .in('agent_id', agentIds);
        
        (likesData || []).forEach(like => {
          likesCountMap[like.agent_id] = (likesCountMap[like.agent_id] || 0) + 1;
        });
      }

      setUserAgents((data ?? []).map(row => ({
        ...mapRowToAgent(row, user.id, likes),
        likesCount: likesCountMap[row.id] || 0,
      })));
    } catch (err) {
      console.error('Error fetching user agents', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchUserLikes]);

  // Fetch public agents with likes count
  const fetchPublicAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const likes = user ? await fetchUserLikes() : [];
      
      // Fetch agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(200);

      if (agentsError) throw agentsError;

      // Fetch likes counts
      const { data: likesData, error: likesError } = await supabase
        .from('agent_likes')
        .select('agent_id');

      if (likesError) throw likesError;

      // Count likes per agent
      const likesCountMap: Record<string, number> = {};
      (likesData || []).forEach(like => {
        likesCountMap[like.agent_id] = (likesCountMap[like.agent_id] || 0) + 1;
      });

      const agents = (agentsData ?? []).map(row => ({
        ...mapRowToAgent(row, user?.id, likes),
        likesCount: likesCountMap[row.id] || 0,
      }));

      setPublicAgents(agents);
    } catch (err) {
      console.error('Error fetching public agents', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchUserLikes]);

  // Initial and on-user-change load
  useEffect(() => {
    fetchPublicAgents();
    if (user) {
      fetchUserAgents();
    } else {
      setUserAgents([]);
    }
  }, [user, fetchPublicAgents, fetchUserAgents]);

  // Listen to realtime changes
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
    .filter((a) => (user ? a.userId !== user.id : true))
    .filter(
      (a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.template.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

  const handleQuickRun = async (agentId: string) => {
    navigate(`/chat/${agentId}`);
  };

  const handleLike = async (agentId: string, isCurrentlyLiked: boolean) => {
    if (!user) {
      toast.error('Sign in to like agents');
      return;
    }

    try {
      if (isCurrentlyLiked) {
        // Unlike
        await supabase
          .from('agent_likes')
          .delete()
          .eq('agent_id', agentId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('agent_likes')
          .insert({ agent_id: agentId, user_id: user.id });
      }

      // Refresh public agents to update like counts
      fetchPublicAgents();
    } catch (err) {
      console.error('Error toggling like:', err);
      toast.error('Failed to update like');
    }
  };

  const handleDuplicate = async (agent: DashboardAgent) => {
    if (!user) {
      toast.error('Sign in to duplicate agents');
      return;
    }

    try {
      const newAgent = {
        id: crypto.randomUUID(),
        user_id: user.id,
        name: `${agent.name} (Copy)`,
        template: agent.template,
        prompt: agent.prompt,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
        is_public: false, // Duplicates start as private
        creator_name: null,
        description: null,
        color: 'primary',
        icon: 'bot',
      };

      const { error } = await supabase.from('agents').insert(newAgent);

      if (error) throw error;

      toast.success('Agent duplicated successfully');
      fetchUserAgents();
    } catch (err) {
      console.error('Error duplicating agent:', err);
      toast.error('Failed to duplicate agent');
    }
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

  const renderAgentCard = (agent: DashboardAgent, index: number, isOwner: boolean) => {
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
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center text-xl shrink-0">
                {template?.icon || '🤖'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base truncate">{agent.name}</CardTitle>
                  {agent.isPublic && (
                    <Badge variant="secondary" className="text-xs gap-1 h-5 shrink-0">
                      <Globe className="w-3 h-3" />
                      Public
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs truncate">{template?.name || agent.template}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
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
                <span className="hidden sm:inline">Run</span>
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
                        handleDuplicate(agent);
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
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
              {!isOwner && user && (
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
                        handleDuplicate(agent);
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate to My Agents
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            {isOwner && (
              <>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatLastRun(agent.lastRunAt)}
                </span>
                <span>{agent.runCount ?? 0} runs</span>
                {agent.isPublic && (
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    {agent.likesCount || 0}
                  </span>
                )}
              </>
            )}
            {!isOwner && (
              <>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {agent.creatorName ? `by ${agent.creatorName}` : 'Community agent'}
                </span>
                <button
                  className="flex items-center gap-1 hover:text-destructive transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(agent.id, agent.isLiked || false);
                  }}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${agent.isLiked ? 'fill-destructive text-destructive' : ''}`}
                  />
                  {agent.likesCount || 0}
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

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
          <div className="w-11 h-11 rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="w-40 h-4 rounded bg-muted" />
            <div className="w-28 h-3 rounded bg-muted mt-2" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-8 rounded bg-muted" />
          <div className="w-8 h-8 rounded bg-muted" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background safe-area-top">
      {/* Header */}
      <header className="px-5 pt-12 pb-4">
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
          <TabsList className="w-full mb-4">
            {user && (
              <TabsTrigger value="my-agents" className="flex-1 gap-2">
                <Lock className="w-4 h-4" />
                My Agents
                {userAgents.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {userAgents.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
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
        onSaved={onAgentEdited}
      />

      <DeleteAgentDialog
        agent={deleteAgentState}
        open={!!deleteAgentState}
        onOpenChange={(open) => {
          if (!open) setDeleteAgentState(null);
        }}
        onDeleted={onAgentDeleted}
      />
    </div>
  );
}
