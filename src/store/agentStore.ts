import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Agent, Conversation, HistoryEntry, Message } from '@/types/agent';

interface AgentState {
  agents: Agent[];
  conversations: Record<string, Conversation>;
  history: HistoryEntry[];
  hasCompletedOnboarding: boolean;
  cloudSyncEnabled: boolean;
  
  // Actions
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  
  addMessage: (agentId: string, message: Message) => void;
  getConversation: (agentId: string) => Conversation | undefined;
  clearConversation: (agentId: string) => void;
  
  addHistoryEntry: (entry: HistoryEntry) => void;
  deleteHistoryEntry: (id: string) => void;
  clearHistory: () => void;
  
  setOnboardingComplete: () => void;
  setCloudSync: (enabled: boolean) => void;
  
  exportData: () => string;
  clearUserData: (userId?: string) => void;
  clearAllData: () => void;
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [],
      conversations: {},
      history: [],
      hasCompletedOnboarding: false,
      cloudSyncEnabled: false,

      addAgent: (agent) =>
        set((state) => ({
          agents: [...state.agents, agent],
        })),

      updateAgent: (id, updates) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      deleteAgent: (id) =>
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
          conversations: Object.fromEntries(
            Object.entries(state.conversations).filter(([key]) => key !== id)
          ),
        })),

      addMessage: (agentId, message) =>
        set((state) => {
          const existing = state.conversations[agentId];
          const conversation: Conversation = existing
            ? {
                ...existing,
                messages: [...existing.messages, message],
                updatedAt: new Date().toISOString(),
              }
            : {
                id: agentId,
                agentId,
                messages: [message],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

          return {
            conversations: {
              ...state.conversations,
              [agentId]: conversation,
            },
          };
        }),

      getConversation: (agentId) => get().conversations[agentId],

      clearConversation: (agentId) =>
        set((state) => ({
          conversations: Object.fromEntries(
            Object.entries(state.conversations).filter(([key]) => key !== agentId)
          ),
        })),

      addHistoryEntry: (entry) =>
        set((state) => ({
          history: [entry, ...state.history].slice(0, 100),
        })),

      deleteHistoryEntry: (id) =>
        set((state) => ({
          history: state.history.filter((h) => h.id !== id),
        })),

      clearHistory: () => set({ history: [] }),

      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),

      setCloudSync: (enabled) => set({ cloudSyncEnabled: enabled }),

      exportData: () => {
        const state = get();
        return JSON.stringify({
          agents: state.agents,
          conversations: state.conversations,
          history: state.history,
          exportedAt: new Date().toISOString(),
        }, null, 2);
      },

      // Clear only current user's data (agents they own)
      clearUserData: (userId?: string) =>
        set((state) => {
          if (!userId) {
            // If no userId, just clear local agents without userId (local-only agents)
            return {
              agents: state.agents.filter((a) => a.userId && a.userId !== ''),
              conversations: {},
              history: [],
            };
          }
          
          // Filter out only the user's agents
          const userAgentIds = new Set(
            state.agents.filter((a) => a.userId === userId).map((a) => a.id)
          );
          
          return {
            agents: state.agents.filter((a) => a.userId !== userId),
            conversations: Object.fromEntries(
              Object.entries(state.conversations).filter(
                ([agentId]) => !userAgentIds.has(agentId)
              )
            ),
            history: state.history.filter((h) => !userAgentIds.has(h.agentId)),
          };
        }),

      clearAllData: () =>
        set({
          agents: [],
          conversations: {},
          history: [],
          hasCompletedOnboarding: false,
          cloudSyncEnabled: false,
        }),
    }),
    {
      name: 'pocket-agent-storage',
    }
  )
);
