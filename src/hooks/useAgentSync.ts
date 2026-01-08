import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAgentStore } from '@/store/agentStore';
import type { Agent, AgentTemplate } from '@/types/agent';
import { toast } from 'sonner';

export function useAgentSync() {
  const { user } = useAuth();
  // Keep this selector to maintain hook order (even though we always sync when logged in)
  useAgentStore((s) => s.cloudSyncEnabled);
  const addAgentToStore = useAgentStore((s) => s.addAgent);
  const updateAgentInStore = useAgentStore((s) => s.updateAgent);
  const deleteAgentFromStore = useAgentStore((s) => s.deleteAgent);

  // Always sync to cloud when user is logged in
  const shouldSync = !!user;

  // Fetch agents from cloud
  const fetchAgents = useCallback(async (): Promise<Agent[]> => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agents:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      template: row.template as AgentTemplate,
      prompt: row.prompt,
      temperature: row.temperature ?? 0.7,
      maxTokens: row.max_tokens ?? 500,
      createdAt: row.created_at,
      lastRunAt: undefined,
      runCount: 0,
      isPublic: row.is_public ?? false,
      userId: row.user_id,
    }));
  }, [user]);

  // Fetch public agents from all users
  const fetchPublicAgents = useCallback(async (): Promise<Agent[]> => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching public agents:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      template: row.template as AgentTemplate,
      prompt: row.prompt,
      temperature: row.temperature ?? 0.7,
      maxTokens: row.max_tokens ?? 500,
      createdAt: row.created_at,
      lastRunAt: undefined,
      runCount: 0,
      isPublic: row.is_public ?? false,
      userId: row.user_id,
    }));
  }, []);

  // Get user display name for creator_name
  const getDisplayName = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    
    const { data } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('user_id', user.id)
      .single();
    
    return data?.display_name || data?.email?.split('@')[0] || null;
  }, [user]);

  // Create agent in cloud
  const createAgent = useCallback(
    async (agent: Agent): Promise<Agent | null> => {
      // Always add to local store first
      addAgentToStore(agent);

      if (!shouldSync) {
        return agent;
      }

      // Get creator name for public agents
      const creatorName = agent.isPublic ? await getDisplayName() : null;

      const { error } = await supabase.from('agents').insert({
        id: agent.id,
        user_id: user!.id,
        name: agent.name,
        template: agent.template,
        prompt: agent.prompt,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
        is_public: agent.isPublic,
        creator_name: creatorName,
        description: null,
        color: 'primary',
        icon: 'bot',
      });

      if (error) {
        console.error('Error creating agent in cloud:', error);
        toast.error('Failed to sync agent to cloud');
        return agent;
      }

      return agent;
    },
    [shouldSync, user, addAgentToStore, getDisplayName]
  );

  // Update agent in cloud
  const updateAgent = useCallback(
    async (
      id: string,
      updates: Partial<Agent>
    ): Promise<void> => {
      // Always update local store first
      updateAgentInStore(id, updates);

      if (!shouldSync) return;

      const cloudUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) cloudUpdates.name = updates.name;
      if (updates.prompt !== undefined) cloudUpdates.prompt = updates.prompt;
      if (updates.temperature !== undefined) cloudUpdates.temperature = updates.temperature;
      if (updates.maxTokens !== undefined) cloudUpdates.max_tokens = updates.maxTokens;
      if (updates.isPublic !== undefined) {
        cloudUpdates.is_public = updates.isPublic;
        // Update creator_name when making public
        if (updates.isPublic) {
          const creatorName = await getDisplayName();
          if (creatorName) cloudUpdates.creator_name = creatorName;
        }
      }

      if (Object.keys(cloudUpdates).length === 0) return;

      const { error } = await supabase
        .from('agents')
        .update(cloudUpdates)
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) {
        console.error('Error updating agent in cloud:', error);
        toast.error('Failed to sync changes to cloud');
      }
    },
    [shouldSync, user, updateAgentInStore, getDisplayName]
  );

  // Delete agent from cloud
  const deleteAgent = useCallback(
    async (id: string): Promise<void> => {
      // Always delete from local store first
      deleteAgentFromStore(id);

      if (!shouldSync) return;

      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) {
        console.error('Error deleting agent from cloud:', error);
        toast.error('Failed to delete from cloud');
      }
    },
    [shouldSync, user, deleteAgentFromStore]
  );

  // Sync local agents to cloud (for initial sync)
  const syncLocalToCloud = useCallback(async (): Promise<void> => {
    if (!user) return;

    const localAgents = useAgentStore.getState().agents;
    if (localAgents.length === 0) return;

    const agentsToInsert = localAgents.map((agent) => ({
      id: agent.id,
      user_id: user.id,
      name: agent.name,
      template: agent.template,
      prompt: agent.prompt,
      temperature: agent.temperature,
      max_tokens: agent.maxTokens,
      is_public: agent.isPublic ?? false,
      description: null,
      color: 'primary',
      icon: 'bot',
    }));

    const { error } = await supabase
      .from('agents')
      .upsert(agentsToInsert, { onConflict: 'id' });

    if (error) {
      console.error('Error syncing local agents to cloud:', error);
      toast.error('Failed to sync agents to cloud');
    } else {
      toast.success('Agents synced to cloud');
    }
  }, [user]);

  // Load agents from cloud and merge with local
  const loadFromCloud = useCallback(async (): Promise<void> => {
    if (!user) return;

    const cloudAgents = await fetchAgents();
    const localAgents = useAgentStore.getState().agents;

    // Merge: add cloud agents that aren't in local
    const localIds = new Set(localAgents.map((a) => a.id));
    cloudAgents.forEach((agent) => {
      if (!localIds.has(agent.id)) {
        addAgentToStore(agent);
      }
    });
  }, [user, fetchAgents, addAgentToStore]);

  return {
    shouldSync,
    fetchAgents,
    fetchPublicAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    syncLocalToCloud,
    loadFromCloud,
  };
}
